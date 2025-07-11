// AEGIS Auth System - Discord OAuth2 ve PythonAnywhere API Entegrasyonu

// Yapılandırma değerlerini dinamik olarak yükle
let DISCORD_CLIENT_ID = null;
let DISCORD_REDIRECT_URI = window.location.origin + "/auth-callback.html"; // GitHub Pages için doğru URL
const DISCORD_API_ENDPOINT = "https://discord.com/api/v10";

// API Yapılandırması - PythonAnywhere URL'si dinamik olarak yüklenecek
let LICENSE_SERVER_URL = null;

// Kullanıcı Bilgileri ve Yetkilendirme
let currentUser = null;
let accessToken = null;
let configLoaded = false;

// Yapılandırma yüklendiğinde çağrılacak fonksiyon
async function initializeAuth() {
    // Yapılandırma değerlerini al
    const config = await window.AEGIS_CONFIG.getConfig();
    
    // Yapılandırma değerlerini ayarla
    DISCORD_CLIENT_ID = config.DISCORD_CLIENT_ID;
    LICENSE_SERVER_URL = config.LICENSE_SERVER_URL;
    configLoaded = true;
    
    console.log("Auth sistemi başlatıldı");
    
    // LocalStorage'dan önceki oturumu kontrol et
    checkExistingSession();
    
    // Tüm login butonlarını aktifleştir
    const loginButtons = document.querySelectorAll('.login-btn');
    loginButtons.forEach(button => {
        button.addEventListener('click', initiateDiscordLogin);
    });
}

// Discord ile Giriş Yap Butonlarını Başlatma
document.addEventListener('DOMContentLoaded', function() {
    // Yapılandırma yüklendiğinde auth sistemini başlat
    if (window.AEGIS_CONFIG && window.AEGIS_CONFIG.getConfig) {
        initializeAuth();
    } else {
        // config.js yüklenmemişse, yüklendiğinde dinle
        document.addEventListener('configLoaded', initializeAuth);
    }
    
    // Auth callback'ten döndüyse parametreleri işle
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // Yapılandırma yüklendiğinde token al
        if (configLoaded) {
            exchangeCodeForToken(code);
        } else {
            // Yapılandırma yüklendiğinde token al
            document.addEventListener('configLoaded', function() {
                exchangeCodeForToken(code);
            });
        }
    }
});

// Önceki bir oturum var mı kontrol et
function checkExistingSession() {
    accessToken = localStorage.getItem('discord_access_token');
    const userData = localStorage.getItem('user_data');
    
    if (accessToken && userData) {
        try {
            currentUser = JSON.parse(userData);
            updateUIForLoggedInUser();
            verifyTokenWithPythonAnywhere();
        } catch (e) {
            console.error("Oturum verisi işlenirken hata:", e);
            logout(); // Hatalı veri varsa oturumu kapat
        }
    }
}

// Discord login sürecini başlat
function initiateDiscordLogin() {
    if (!configLoaded) {
        console.error("Yapılandırma henüz yüklenmedi, lütfen bekleyin.");
        return;
    }
    
    const scope = 'identify';
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${scope}`;
    
    // Popup pencere ile login
    const width = 500;
    const height = 750;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
        authUrl,
        'Discord Giriş',
        `width=${width},height=${height},top=${top},left=${left},status=yes,scrollbars=yes`
    );
    
    // Alternatif olarak doğrudan yönlendirme
    // window.location.href = authUrl;
}

// Auth code ile token al
async function exchangeCodeForToken(code) {
    try {
        // Lisans sunucusu üzerinden token alma (client_secret sunucu tarafında saklanıyor)
        const response = await fetch(`${LICENSE_SERVER_URL}/api/discord/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                redirect_uri: DISCORD_REDIRECT_URI
            })
        });
        
        const data = await response.json();
        
        if (data.access_token) {
            accessToken = data.access_token;
            localStorage.setItem('discord_access_token', accessToken);
            await fetchDiscordUserInfo();
            await registerWithPythonAnywhere();
        } else {
            console.error("Token alınamadı:", data);
            showLoginError("Discord ile giriş yapılamadı. Lütfen tekrar deneyin.");
        }
    } catch (error) {
        console.error("Token alınırken hata:", error);
        showLoginError("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
}

// Discord kullanıcı bilgilerini al
async function fetchDiscordUserInfo() {
    if (!accessToken) return;
    
    try {
        const response = await fetch(`${DISCORD_API_ENDPOINT}/users/@me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        
        const userData = await response.json();
        
        if (userData.id) {
            currentUser = {
                id: userData.id,
                username: userData.username,
                discriminator: userData.discriminator,
                avatar: userData.avatar ? 
                    `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : 
                    `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator) % 5}.png`,
                email: userData.email
            };
            
            localStorage.setItem('user_data', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
        }
    } catch (error) {
        console.error("Kullanıcı bilgileri alınırken hata:", error);
    }
}

// Discord kullanıcı bilgilerini kaydet
async function registerWithPythonAnywhere() {
    if (!currentUser || !accessToken) return;
    
    // Bu fonksiyon artık gerekli değil, çünkü kullanıcı bilgileri lisans aktivasyonu sırasında kaydediliyor
    console.log("Discord kullanıcısı hazır:", currentUser.username);
    
    // Lisans listesini güncelle
    updateLicensesList();
}

// Discord token doğrulama
async function verifyTokenWithPythonAnywhere() {
    if (!currentUser || !accessToken) return;
    
    try {
        // Discord API ile token doğrulama
        const response = await fetch(`${DISCORD_API_ENDPOINT}/users/@me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        
        if (response.status !== 200) {
            console.log("Token geçersiz, oturum sonlandırılıyor");
            logout();
        }
    } catch (error) {
        console.error("Token doğrulanırken hata:", error);
    }
}

// Lisans aktivasyon fonksiyonu
async function activateLicense(licenseKey) {
    if (!currentUser || !accessToken) {
        showLicenseError("Önce giriş yapmalısınız");
        return;
    }
    
    try {
        // Lisans sunucusuna bağlan
        const response = await fetch(`${LICENSE_SERVER_URL}/activate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                license_key: licenseKey,
                user_id: currentUser.id,
                ip_address: "web_activation" // Web üzerinden aktivasyon
            })
        });
        
        const data = await response.json();
        
        if (data.status === "success") {
            showLicenseSuccess("Lisans başarıyla aktifleştirildi!");
            
            // Lisans bilgilerini göster
            const expiryInfo = data.license_info.expiry_date 
                ? `Son kullanma tarihi: ${data.license_info.expiry_date}`
                : "Süresiz lisans";
                
            showLicenseSuccess(`Lisans başarıyla aktifleştirildi! ${expiryInfo}`);
            updateLicensesList();
        } else {
            showLicenseError(data.message || "Lisans aktifleştirilemedi");
        }
    } catch (error) {
        console.error("Lisans aktifleştirilirken hata:", error);
        showLicenseError("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
}

// Aktif lisansları görüntüleme
async function updateLicensesList() {
    if (!currentUser || !accessToken) return;
    
    try {
        // Lisans sunucusundan kullanıcının lisanslarını al
        // Kullanıcı lisanslarını almak için özel bir endpoint kullanacağız
        const response = await fetch(`${LICENSE_SERVER_URL}/user-licenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                discord_token: accessToken // Token ile doğrulama yapılacak
            })
        });
        
        const data = await response.json();
        
        if (data.status === "success" && data.licenses) {
            // Kullanıcının lisanslarını filtrele
            const userLicenses = data.licenses.filter(license => license.user_id === currentUser.id);
            displayLicenses(userLicenses);
        }
    } catch (error) {
        console.error("Lisanslar alınırken hata:", error);
    }
}

// UI Fonksiyonları
function updateUIForLoggedInUser() {
    const loginButtons = document.querySelectorAll('.login-btn');
    loginButtons.forEach(button => {
        button.innerHTML = `<img src="${currentUser.avatar}" alt="" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;"> ${currentUser.username}`;
        button.removeEventListener('click', initiateDiscordLogin);
        button.addEventListener('click', showUserDropdown);
    });
    
    // Portal bölümünü güncelle, varsa
    const portalSection = document.getElementById('portal');
    if (portalSection) {
        const welcomeElement = portalSection.querySelector('.welcome-message');
        if (welcomeElement) {
            welcomeElement.textContent = `Hoş geldin, ${currentUser.username}!`;
        }
        
        // Lisans listesini güncelle
        updateLicensesList();
    }
}

function displayLicenses(licenses) {
    const licenseContainer = document.getElementById('active-licenses');
    if (!licenseContainer) return;
    
    licenseContainer.innerHTML = '';
    
    if (licenses.length === 0) {
        licenseContainer.innerHTML = '<p>Henüz aktif lisansınız bulunmuyor.</p>';
        return;
    }
    
    licenses.forEach(license => {
        const licenseItem = document.createElement('div');
        licenseItem.className = 'license-item';
        
        // Lisans durumuna göre stil uygula
        const isActive = license.status === 'active' || license.status === 'activated';
        const statusClass = isActive ? 'license-active' : 'license-expired';
        const statusText = isActive ? 'Aktif' : 'Süresi Dolmuş';
        
        // Kalan süre bilgisini hazırla
        let remainingTimeText = 'Süresiz';
        if (license.remaining_days) {
            remainingTimeText = `${license.remaining_days} gün`;
        } else if (license.expiry_date && license.expiry_date !== 'Unlimited') {
            remainingTimeText = `Son kullanma: ${license.expiry_date}`;
        }
        
        licenseItem.innerHTML = `
            <div class="license-header">
                <span class="license-key">${license.license_key.substring(0, 12)}...</span>
                <span class="license-status ${statusClass}">${statusText}</span>
            </div>
            <div class="license-details">
                <span>IP: ${license.ip_address || 'Tanımlanmamış'}</span>
                <span>Kalan Süre: ${remainingTimeText}</span>
            </div>
        `;
        
        licenseContainer.appendChild(licenseItem);
    });
}

function showUserDropdown() {
    // User dropdown menüsünü göster
    console.log("User dropdown would show here");
    // Bu kısım HTML/CSS ile implement edilmeli
}

function showLoginError(message) {
    // Hata mesajını kullanıcıya gösterme
    alert(message);
    // Gerçek uygulamada daha iyi bir UI elementiyle gösterilmeli
}

function showLicenseError(message) {
    const errorElement = document.getElementById('license-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showLicenseSuccess(message) {
    const successElement = document.getElementById('license-success');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function logout() {
    localStorage.removeItem('discord_access_token');
    localStorage.removeItem('user_data');
    accessToken = null;
    currentUser = null;
    
    // UI'ı güncelle
    const loginButtons = document.querySelectorAll('.login-btn');
    loginButtons.forEach(button => {
        button.innerHTML = '<i class="fab fa-discord"></i> Giriş Yap';
        button.removeEventListener('click', showUserDropdown);
        button.addEventListener('click', initiateDiscordLogin);
    });
    
    // Sayfayı yenile veya ana sayfaya yönlendir
    // window.location.href = '/';
}

// Lisans aktifleştirme form'unu dinleyen event
document.addEventListener('DOMContentLoaded', function() {
    const licenseForm = document.querySelector('.license-input');
    if (licenseForm) {
        licenseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const licenseInput = document.querySelector('.license-input input');
            const licenseKey = licenseInput.value.trim();
            
            if (licenseKey) {
                activateLicense(licenseKey);
            } else {
                showLicenseError("Lütfen bir lisans anahtarı girin");
            }
        });
    }
}); 