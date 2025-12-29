import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 🚨 1. İSTEK INTERCEPTOR (Token Ekleme)
apiClient.interceptors.request.use((config) => {
    // Tarayıcı hafızasından token'ı al
    const token = localStorage.getItem('token');
    
    // Eğer token varsa, Header'a ekle: "Bearer eyJhbGciOi..."
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 🚨 2. YANIT INTERCEPTOR (401 Hatası Yakalama)
// Eğer token süresi dolmuşsa veya geçersizse kullanıcıyı otomatik çıkış yaptır
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Oturum süresi doldu, çıkış yapılıyor...");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Sayfayı yenile veya anasayfaya at
            window.location.href = '/'; 
        }
        return Promise.reject(error);
    }
);

export default apiClient;