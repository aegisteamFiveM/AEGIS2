# AEGIS Anti-Cheat Lisans Sistemi Kurulum Talimatları

## GitHub Secrets Kurulumu

GitHub Secrets, hassas bilgilerinizi (Discord Client ID, PythonAnywhere URL gibi) güvenli bir şekilde saklamanıza olanak tanır. Bu bilgiler GitHub deposunda görünmez ve sadece derleme sırasında kullanılır.

### Adım 1: GitHub Secrets Ayarlama

1. GitHub'da projenize gidin
2. "Settings" (Ayarlar) sekmesine tıklayın
3. Sol menüden "Secrets and variables" > "Actions" seçeneğine tıklayın
4. "New repository secret" (Yeni depo sırrı) butonuna tıklayın
5. Aşağıdaki sırları ekleyin:

   - `DISCORD_CLIENT_ID`: Discord Developer Portal'dan aldığınız Client ID
   - `LICENSE_SERVER_URL`: PythonAnywhere'deki lisans sunucunuzun URL'si (örn: https://kullanici-adiniz.pythonanywhere.com)

### Adım 2: GitHub Actions Workflow'u Etkinleştirme

1. GitHub'da projenize gidin
2. "Actions" sekmesine tıklayın
3. "Build and Deploy" workflow'unu bulun ve "Run workflow" butonuna tıklayın
4. Bu işlem, GitHub Secrets'dan alınan değerleri kullanarak `js/config.js` dosyasını otomatik olarak oluşturacak ve projeyi GitHub Pages'a dağıtacaktır

## PythonAnywhere Kurulumu

### Adım 1: PythonAnywhere Hesabı Oluşturma

1. [PythonAnywhere](https://www.pythonanywhere.com/) adresine gidin ve bir hesap oluşturun
2. Ücretsiz plan yeterli olacaktır

### Adım 2: Dosyaları Yükleme

1. PythonAnywhere'de "Files" sekmesine gidin
2. Aşağıdaki dosyaları yükleyin:
   - `aegis_license_server.py`
   - `config.py`
   - `requirements.txt`
   - `pythonanywhere_wsgi.py` (adını `wsgi.py` olarak değiştirin)

### Adım 3: Veritabanı Oluşturma

1. PythonAnywhere'de "Databases" sekmesine gidin
2. SQLite veritabanı otomatik olarak oluşturulacaktır

### Adım 4: Çevre Değişkenlerini Ayarlama

1. PythonAnywhere'de "Dashboard" sekmesine gidin
2. Bir konsol başlatın (örn: Bash)
3. `.env` dosyası oluşturun:

```bash
echo "DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID" > .env
echo "DISCORD_CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET" >> .env
echo "DISCORD_REDIRECT_URI=https://YOUR_GITHUB_USERNAME.github.io/REPO_NAME/auth-callback.html" >> .env
echo "ADMIN_API_KEY=YOUR_ADMIN_API_KEY" >> .env
echo "DEBUG=False" >> .env
```

### Adım 5: Web Uygulaması Oluşturma

1. PythonAnywhere'de "Web" sekmesine gidin
2. "Add a new web app" butonuna tıklayın
3. "Manual configuration" seçeneğini seçin
4. Python sürümünü seçin (örn: Python 3.9)
5. WSGI dosyasını düzenleyin ve içeriğini `pythonanywhere_wsgi.py` dosyasındaki içerikle değiştirin
6. "Reload" butonuna tıklayarak web uygulamanızı başlatın

## Discord Developer Portal Kurulumu

### Adım 1: Discord Uygulaması Oluşturma

1. [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin
2. "New Application" butonuna tıklayın
3. Uygulamanıza bir isim verin (örn: "AEGIS Anti-Cheat")

### Adım 2: OAuth2 Ayarları

1. Sol menüden "OAuth2" seçeneğine tıklayın
2. "Redirects" bölümünde "Add Redirect" butonuna tıklayın
3. Redirect URL'yi ekleyin: `https://YOUR_GITHUB_USERNAME.github.io/REPO_NAME/auth-callback.html`
4. "Save Changes" butonuna tıklayın

### Adım 3: Client ID ve Client Secret Alma

1. "OAuth2" sayfasında "Client ID" değerini kopyalayın ve GitHub Secrets'a ekleyin
2. "Client Secret" değerini kopyalayın ve PythonAnywhere'deki `.env` dosyasına ekleyin

## Son Adımlar

1. GitHub'da projenize gidin
2. "Actions" sekmesinde "Build and Deploy" workflow'unun başarıyla tamamlandığını kontrol edin
3. GitHub Pages URL'nizi ziyaret edin: `https://YOUR_GITHUB_USERNAME.github.io/REPO_NAME/`
4. Sistemin doğru çalıştığını doğrulamak için Discord ile giriş yapmayı deneyin

## Sorun Giderme

- **GitHub Secrets değerleri güncelleme:** GitHub Secrets'daki değerleri güncellerseniz, değişikliklerin etkili olması için "Actions" sekmesinden "Build and Deploy" workflow'unu manuel olarak tetiklemeniz gerekir.
- **Discord giriş hatası:** Discord Developer Portal'da redirect URL'nin doğru olduğundan emin olun.
- **PythonAnywhere bağlantı hatası:** PythonAnywhere URL'nizin doğru olduğundan ve web uygulamanızın çalıştığından emin olun.
- **CORS hatası:** PythonAnywhere'deki `aegis_license_server.py` dosyasında CORS ayarlarının doğru olduğundan emin olun. 