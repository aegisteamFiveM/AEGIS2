// AEGIS Configuration Fetcher
// Bu dosya, yapılandırma değerlerini güvenli bir şekilde backend'den almak için kullanılır

// Yapılandırma değerlerini saklayacak nesne
let config = {
    DISCORD_CLIENT_ID: null,
    LICENSE_SERVER_URL: null,
    isLoaded: false
};

// Yapılandırma değerlerini backend'den yükle
async function loadConfig() {
    try {
        // Yapılandırma endpoint'i - bu endpoint'i backend'de oluşturacağız
        const response = await fetch('https://your-pythonanywhere-username.pythonanywhere.com/api/config');
        const data = await response.json();
        
        if (data.status === "success") {
            config.DISCORD_CLIENT_ID = data.DISCORD_CLIENT_ID;
            config.LICENSE_SERVER_URL = data.LICENSE_SERVER_URL;
            config.isLoaded = true;
            console.log("Yapılandırma başarıyla yüklendi");
            
            // Yapılandırma yüklendiğinde bir olay tetikle
            const configLoadedEvent = new Event('configLoaded');
            document.dispatchEvent(configLoadedEvent);
            
            return true;
        } else {
            console.error("Yapılandırma yüklenemedi:", data.message);
            return false;
        }
    } catch (error) {
        console.error("Yapılandırma yüklenirken hata:", error);
        return false;
    }
}

// Yapılandırma değerlerini al (yüklenmemişse yükle)
async function getConfig() {
    if (!config.isLoaded) {
        await loadConfig();
    }
    return config;
}

// Sayfa yüklendiğinde yapılandırmayı otomatik olarak yükle
document.addEventListener('DOMContentLoaded', loadConfig);

// Dışa aktarılan fonksiyonlar
window.AEGIS_CONFIG = {
    getConfig,
    loadConfig
}; 