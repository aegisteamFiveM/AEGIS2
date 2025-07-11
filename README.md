# AEGIS Anti-Cheat

FiveM sunucuları için AI destekli anti-cheat koruması.

## Kurulum

1. Bu repoyu GitHub Pages olarak yayınlayın
2. Lisans sunucunuzu ayrı bir sunucuda çalıştırın
3. `js/auth.js` dosyasında `LICENSE_SERVER_URL` değişkenini güncelleyin
4. Discord Developer Portal'dan bir uygulama oluşturun ve bilgileri güncelleyin

## Özellikler

- Discord ile giriş yapma
- Lisans aktivasyonu
- Kullanıcı portalı
- Lisans yönetimi

## PythonAnywhere Kurulumu

1. PythonAnywhere'de bir hesap oluşturun
2. Web sekmesinde yeni bir web uygulaması oluşturun ve "manual configuration" seçin
3. Python sürümünü seçin (örn: Python 3.9)
4. Dosyaları PythonAnywhere hesabınıza yükleyin:
   - aegis_license_server.py
   - pythonanywhere_wsgi.py (adını sadece wsgi.py olarak değiştirin)
   - requirements.txt
   - config.py
5. .env dosyası oluşturun ve çevre değişkenlerini ayarlayın:
   ```
   DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
   DISCORD_CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET
   DISCORD_REDIRECT_URI=https://GITHUB_USERNAME.github.io/REPO_NAME/auth-callback.html
   ADMIN_API_KEY=""
   DEBUG=False
   ```
6. PythonAnywhere konsolunda şu komutu çalıştırın:
   ```bash
   pip install -r requirements.txt
   ```
7. WSGI dosyasında kullanıcı adınızı güncelleyin
8. Web uygulamanızı yeniden başlatın

## GitHub Pages Kurulumu

1. Bu repoyu GitHub'a yükleyin
2. GitHub repository ayarlarından Pages özelliğini etkinleştirin
3. `js/auth.js` dosyasındaki `LICENSE_SERVER_URL` değişkenini PythonAnywhere URL'niz ile güncelleyin
4. Discord Developer Portal'dan bir uygulama oluşturun ve bilgileri güncelleyin 