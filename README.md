# AEGIS Anti-Cheat Lisans Sistemi

AEGIS Anti-Cheat için Discord entegrasyonlu lisans yönetim sistemi.

## Proje Yapısı

- `index.html` - Ana sayfa
- `portal.html` - Kullanıcı portalı
- `auth-callback.html` - Discord OAuth2 callback sayfası
- `aegis_license_server.py` - Lisans sunucusu (PythonAnywhere'de çalışır)
- `js/auth.js` - Discord OAuth2 ve lisans yönetimi için JavaScript
- `js/config.js` - Yapılandırma değerlerini yönetmek için JavaScript

## GitHub Secrets Kullanımı

Bu proje, hassas yapılandırma değerlerini GitHub Secrets kullanarak güvenli bir şekilde yönetir. GitHub Secrets, hassas verileri (API anahtarları, token'lar vb.) güvenli bir şekilde saklamanıza olanak tanır.

### GitHub Secrets Nasıl Ayarlanır

1. GitHub'da projenize gidin
2. "Settings" (Ayarlar) sekmesine tıklayın
3. Sol menüden "Secrets and variables" > "Actions" seçeneğine tıklayın
4. "New repository secret" (Yeni depo sırrı) butonuna tıklayın
5. Aşağıdaki sırları ekleyin:

   - `DISCORD_CLIENT_ID`: Discord Developer Portal'dan aldığınız Client ID
   - `LICENSE_SERVER_URL`: PythonAnywhere'deki lisans sunucunuzun URL'si (örn: https://kullanici-adiniz.pythonanywhere.com)

### Nasıl Çalışır

1. GitHub Actions, `deploy.yml` workflow dosyasını kullanarak derleme ve dağıtım işlemini gerçekleştirir
2. Derleme sırasında, GitHub Secrets'dan alınan değerler `js/config.js` dosyasına enjekte edilir
3. Frontend uygulaması, bu değerleri kullanarak Discord OAuth2 ve lisans sunucusu ile iletişim kurar

## Geliştirme

Yerel geliştirme için:

1. `js/config.js` dosyasını düzenleyerek geliştirme değerlerini ayarlayın
2. Bir HTTP sunucusu başlatın: `python -m http.server` veya başka bir yerel sunucu kullanın
3. Tarayıcıda `http://localhost:8000` adresine gidin

## Dağıtım

Projeyi GitHub Pages'a dağıtmak için:

1. GitHub Secrets'ı yukarıdaki talimatlara göre ayarlayın
2. Değişikliklerinizi `main` dalına push edin
3. GitHub Actions otomatik olarak projeyi derleyecek ve `gh-pages` dalına dağıtacaktır

## PythonAnywhere Yapılandırması

PythonAnywhere'de lisans sunucusunu yapılandırmak için:

1. PythonAnywhere'de bir hesap oluşturun
2. Dosyaları yükleyin: `aegis_license_server.py`, `config.py`, `requirements.txt`, `pythonanywhere_wsgi.py`
3. Bir veritabanı oluşturun
4. WSGI dosyasını yapılandırın
5. `.env` dosyasında veya PythonAnywhere'in çevre değişkenlerinde Discord Client Secret'ı ayarlayın

## Güvenlik Notları

- Client ID genellikle genel olarak bilinebilir, ancak yine de GitHub Secrets kullanarak saklıyoruz
- Client Secret **ASLA** frontend kodunda saklanmamalıdır - bu değer yalnızca backend'de (PythonAnywhere) kullanılmalıdır
- GitHub Secrets, GitHub Actions tarafından derleme sırasında kullanılır ve depo tarihçesinde veya kaynak kodda görünmez 