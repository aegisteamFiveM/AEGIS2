from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import secrets
import os
import time
from datetime import datetime, timedelta
import requests
import json

app = Flask(__name__)
CORS(app)  # Cross-Origin Resource Sharing (CORS) ayarları

# Veritabanı yolu
DB_PATH = os.path.join(os.path.dirname(__file__), 'aegis.db')

# Discord API bilgileri
DISCORD_API_ENDPOINT = "https://discord.com/api/v10"
DISCORD_CLIENT_ID = os.environ.get("DISCORD_CLIENT_ID", "YOUR_DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.environ.get("DISCORD_CLIENT_SECRET", "YOUR_DISCORD_CLIENT_SECRET")
DISCORD_REDIRECT_URI = os.environ.get("DISCORD_REDIRECT_URI", "https://yoursite.com/auth-callback.html")

# JWT Secret Key
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))

# Veritabanı başlatma
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Kullanıcılar tablosu
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT UNIQUE NOT NULL,
        discord_username TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry INTEGER,
        created_at INTEGER,
        last_login INTEGER
    )
    ''')
    
    # Lisanslar tablosu
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_key TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        server_ip TEXT,
        created_at INTEGER,
        expires_at INTEGER,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Sunucular tablosu
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_ip TEXT UNIQUE NOT NULL,
        server_name TEXT,
        license_id INTEGER,
        last_online INTEGER,
        status TEXT DEFAULT 'offline',
        FOREIGN KEY (license_id) REFERENCES licenses (id)
    )
    ''')
    
    # Günlükler tablosu (hile tespitleri vb.)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER,
        player_id TEXT,
        player_name TEXT,
        detection_type TEXT,
        details TEXT,
        action_taken TEXT,
        timestamp INTEGER,
        FOREIGN KEY (server_id) REFERENCES servers (id)
    )
    ''')
    
    conn.commit()
    conn.close()

# API başlatıldığında veritabanını oluştur
init_db()

# Discord ile token doğrulama
def verify_discord_token(token):
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{DISCORD_API_ENDPOINT}/users/@me", headers=headers)
        
        if response.status_code == 200:
            return response.json()
        
        return None
    except Exception as e:
        print(f"Token doğrulama hatası: {e}")
        return None

# API rotaları

# Discord kullanıcısını kaydet/güncelle
@app.route('/api/register-discord-user', methods=['POST'])
def register_discord_user():
    data = request.json
    discord_id = data.get('discord_id')
    discord_username = data.get('discord_username')
    discord_token = data.get('discord_token')
    
    if not all([discord_id, discord_username, discord_token]):
        return jsonify({'success': False, 'message': 'Eksik bilgiler'}), 400
    
    # Token'ı doğrula
    user_info = verify_discord_token(discord_token)
    if not user_info or str(user_info.get('id')) != discord_id:
        return jsonify({'success': False, 'message': 'Geçersiz Discord token'}), 401
    
    # Kullanıcıyı kaydet veya güncelle
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Kullanıcı var mı kontrol et
        cursor.execute("SELECT id FROM users WHERE discord_id = ?", (discord_id,))
        user = cursor.fetchone()
        
        current_time = int(time.time())
        
        if user:
            # Kullanıcı varsa güncelle
            cursor.execute(
                "UPDATE users SET discord_username = ?, access_token = ?, last_login = ? WHERE discord_id = ?",
                (discord_username, discord_token, current_time, discord_id)
            )
        else:
            # Yeni kullanıcı ekle
            cursor.execute(
                "INSERT INTO users (discord_id, discord_username, access_token, created_at, last_login) VALUES (?, ?, ?, ?, ?)",
                (discord_id, discord_username, discord_token, current_time, current_time)
            )
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Kullanıcı kaydedildi'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Veritabanı hatası: {str(e)}'}), 500

# Token doğrulama
@app.route('/api/verify-token', methods=['POST'])
def verify_token():
    data = request.json
    discord_id = data.get('discord_id')
    discord_token = data.get('discord_token')
    
    if not all([discord_id, discord_token]):
        return jsonify({'valid': False, 'message': 'Eksik bilgiler'}), 400
    
    # Discord API ile token doğrula
    user_info = verify_discord_token(discord_token)
    
    if user_info and str(user_info.get('id')) == discord_id:
        return jsonify({'valid': True})
    
    return jsonify({'valid': False, 'message': 'Geçersiz token'})

# Lisans aktivasyonu
@app.route('/api/activate-license', methods=['POST'])
def activate_license():
    data = request.json
    discord_id = data.get('discord_id')
    license_key = data.get('license_key')
    
    if not all([discord_id, license_key]):
        return jsonify({'success': False, 'message': 'Eksik bilgiler'}), 400
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Kullanıcıyı kontrol et
        cursor.execute("SELECT id FROM users WHERE discord_id = ?", (discord_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'Kullanıcı bulunamadı'}), 404
        
        user_id = user[0]
        
        # Lisans anahtarını kontrol et
        cursor.execute("SELECT id, status, user_id FROM licenses WHERE license_key = ?", (license_key,))
        license_data = cursor.fetchone()
        
        if not license_data:
            return jsonify({'success': False, 'message': 'Geçersiz lisans anahtarı'}), 404
        
        license_id, status, existing_user_id = license_data
        
        if status != 'active' and status != 'pending':
            return jsonify({'success': False, 'message': 'Bu lisans anahtarı artık geçerli değil'}), 400
        
        if existing_user_id and existing_user_id != user_id:
            return jsonify({'success': False, 'message': 'Bu lisans anahtarı başka bir hesaba atanmış'}), 400
        
        # Lisansı kullanıcıya ata
        current_time = int(time.time())
        expires_at = current_time + (30 * 24 * 60 * 60)  # 30 gün sonra
        
        cursor.execute(
            "UPDATE licenses SET user_id = ?, status = 'active', created_at = ?, expires_at = ? WHERE id = ?",
            (user_id, current_time, expires_at, license_id)
        )
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Lisans başarıyla aktifleştirildi'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Veritabanı hatası: {str(e)}'}), 500

# Kullanıcının lisanslarını getir
@app.route('/api/user-licenses', methods=['GET'])
def get_user_licenses():
    discord_id = request.args.get('discord_id')
    
    if not discord_id:
        return jsonify({'success': False, 'message': 'Discord ID gerekli'}), 400
    
    # Token kontrolü (authorization header'dan)
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Yetkilendirme başlığı gerekli'}), 401
    
    token = token.split('Bearer ')[1]
    user_info = verify_discord_token(token)
    
    if not user_info or str(user_info.get('id')) != discord_id:
        return jsonify({'success': False, 'message': 'Geçersiz token'}), 401
    
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row  # Dict formatında sonuç için
        cursor = conn.cursor()
        
        # Önce kullanıcıyı bul
        cursor.execute("SELECT id FROM users WHERE discord_id = ?", (discord_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'Kullanıcı bulunamadı'}), 404
        
        user_id = user['id']
        current_time = int(time.time())
        
        # Kullanıcının lisanslarını al
        cursor.execute("""
            SELECT l.*, s.server_ip, s.server_name, s.status as server_status
            FROM licenses l
            LEFT JOIN servers s ON l.id = s.license_id
            WHERE l.user_id = ?
        """, (user_id,))
        
        licenses_raw = cursor.fetchall()
        licenses = []
        
        for lic in licenses_raw:
            # Kalan süreyi hesapla
            days_left = 0
            if lic['expires_at'] > current_time:
                days_left = (lic['expires_at'] - current_time) // (24 * 60 * 60)
            
            licenses.append({
                'id': lic['id'],
                'key': lic['license_key'],
                'status': 'expired' if lic['expires_at'] < current_time else lic['status'],
                'server_ip': lic['server_ip'],
                'server_name': lic['server_name'],
                'server_status': lic['server_status'] if lic['server_status'] else 'unknown',
                'created_at': lic['created_at'],
                'expires_at': lic['expires_at'],
                'days_left': days_left
            })
        
        conn.close()
        
        return jsonify({'success': True, 'licenses': licenses})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Veritabanı hatası: {str(e)}'}), 500

# Sunucu durum güncellemesi (FiveM sunucusundan)
@app.route('/api/server/heartbeat', methods=['POST'])
def server_heartbeat():
    data = request.json
    license_key = data.get('license_key')
    server_ip = data.get('server_ip')
    server_name = data.get('server_name')
    
    if not all([license_key, server_ip]):
        return jsonify({'success': False, 'message': 'Eksik bilgiler'}), 400
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Lisansı doğrula
        cursor.execute("SELECT id, status, expires_at FROM licenses WHERE license_key = ?", (license_key,))
        license_data = cursor.fetchone()
        
        if not license_data:
            return jsonify({'success': False, 'message': 'Geçersiz lisans'}), 404
        
        license_id, status, expires_at = license_data
        current_time = int(time.time())
        
        if status != 'active' or expires_at < current_time:
            return jsonify({'success': False, 'message': 'Lisans süresi dolmuş veya aktif değil'}), 403
        
        # Sunucu bilgisini güncelle
        cursor.execute("SELECT id FROM servers WHERE server_ip = ?", (server_ip,))
        server = cursor.fetchone()
        
        if server:
            cursor.execute(
                "UPDATE servers SET license_id = ?, server_name = ?, last_online = ?, status = 'online' WHERE server_ip = ?",
                (license_id, server_name, current_time, server_ip)
            )
        else:
            cursor.execute(
                "INSERT INTO servers (server_ip, server_name, license_id, last_online, status) VALUES (?, ?, ?, ?, 'online')",
                (server_ip, server_name, license_id, current_time)
            )
        
        # Lisansa server_ip ekle
        cursor.execute(
            "UPDATE licenses SET server_ip = ? WHERE id = ?",
            (server_ip, license_id)
        )
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Sunucu durumu güncellendi'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Veritabanı hatası: {str(e)}'}), 500

# Hile tespiti kaydet (FiveM sunucusundan)
@app.route('/api/server/report-cheat', methods=['POST'])
def report_cheat():
    data = request.json
    license_key = data.get('license_key')
    server_ip = data.get('server_ip')
    player_id = data.get('player_id')
    player_name = data.get('player_name')
    detection_type = data.get('detection_type')
    details = data.get('details')
    action_taken = data.get('action_taken')
    
    if not all([license_key, server_ip, player_id, detection_type]):
        return jsonify({'success': False, 'message': 'Eksik bilgiler'}), 400
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Lisansı doğrula
        cursor.execute("SELECT id FROM licenses WHERE license_key = ? AND status = 'active'", (license_key,))
        license_data = cursor.fetchone()
        
        if not license_data:
            return jsonify({'success': False, 'message': 'Geçersiz veya aktif olmayan lisans'}), 404
        
        # Sunucuyu bul
        cursor.execute("SELECT id FROM servers WHERE server_ip = ?", (server_ip,))
        server = cursor.fetchone()
        
        if not server:
            return jsonify({'success': False, 'message': 'Sunucu bulunamadı'}), 404
        
        server_id = server[0]
        current_time = int(time.time())
        
        # Günlüğü kaydet
        cursor.execute(
            """INSERT INTO logs 
               (server_id, player_id, player_name, detection_type, details, action_taken, timestamp) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (server_id, player_id, player_name, detection_type, details, action_taken, current_time)
        )
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Hile tespiti kaydedildi'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Veritabanı hatası: {str(e)}'}), 500

# Discord OAuth2 token alma (frontend yerine burada yapılması daha güvenli)
@app.route('/api/discord/token', methods=['POST'])
def get_discord_token():
    code = request.json.get('code')
    
    if not code:
        return jsonify({'success': False, 'message': 'Code parametresi gerekli'}), 400
    
    data = {
        'client_id': DISCORD_CLIENT_ID,
        'client_secret': DISCORD_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': DISCORD_REDIRECT_URI
    }
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    try:
        response = requests.post('https://discord.com/api/oauth2/token', data=data, headers=headers)
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({
                'success': False,
                'message': 'Discord token alınamadı',
                'details': response.text
            }), response.status_code
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Hata: {str(e)}'}), 500

# Lisans oluşturma (admin paneli için)
@app.route('/api/admin/create-license', methods=['POST'])
def create_license():
    # Bu endpoint gerçekte bir admin paneli ve yetkilendirme gerektirir
    # Basitlik için burada sadece temel işlevselliği gösteriyoruz
    
    data = request.json
    count = data.get('count', 1)  # Kaç adet lisans oluşturulacak
    
    if count < 1 or count > 100:
        return jsonify({'success': False, 'message': 'Geçersiz sayı'}), 400
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        licenses = []
        current_time = int(time.time())
        
        for _ in range(count):
            # Benzersiz bir lisans anahtarı oluştur (format: AEGIS-XXXX-XXXX-XXXX)
            while True:
                part1 = secrets.token_hex(2).upper()
                part2 = secrets.token_hex(2).upper()
                part3 = secrets.token_hex(2).upper()
                license_key = f"AEGIS-{part1}-{part2}-{part3}"
                
                cursor.execute("SELECT 1 FROM licenses WHERE license_key = ?", (license_key,))
                if not cursor.fetchone():
                    break
            
            # Lisansı veritabanına ekle
            cursor.execute(
                "INSERT INTO licenses (license_key, status, created_at) VALUES (?, 'pending', ?)",
                (license_key, current_time)
            )
            
            licenses.append(license_key)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': f'{count} lisans oluşturuldu',
            'licenses': licenses
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Veritabanı hatası: {str(e)}'}), 500

# Uygulama başlatma
if __name__ == '__main__':
    app.run(debug=True)  # Geliştirme ortamında debug=True, canlı ortamda False olmalıdır 