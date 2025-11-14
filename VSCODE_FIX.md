# VS Code Yapılandırma Düzeltmesi

## Problem

Eğer VS Code'da aşağıdaki gibi bir hata alıyorsanız:

```
Connection state: Error spawn c:\Users\...\vscode\extensions\vscjava.migrate-java-to-azure-...\out\mcp-server.exe ENOENT
```

Bu hata, VS Code'un Java eklentilerini JavaScript/Node.js projemiz üzerinde çalıştırmaya çalışmasından kaynaklanır.

## Çözüm

Bu proje **Java değil, JavaScript/Node.js/React** projesidir. Java eklentilerine ihtiyacımız yoktur.

### Otomatik Çözüm

Bu PR ile birlikte gelen değişiklikler:

1. **`.vscode/settings.json`** - Java eklentilerini devre dışı bırakır
2. **`.vscode/extensions.json`** - Uygun eklentileri önerir ve Java eklentilerini reddeder

### Manuel Çözüm (Eğer Hala Hata Alıyorsanız)

#### Yöntem 1: VS Code'u Yeniden Başlatın
1. VS Code'u tamamen kapatın
2. VS Code'u yeniden açın
3. Workspace'i yeniden yükleyin

#### Yöntem 2: Java Eklentilerini Manuel Olarak Devre Dışı Bırakın
1. VS Code'da **Extensions** görünümünü açın (Ctrl+Shift+X veya Cmd+Shift+X)
2. Aşağıdaki eklentileri arayın ve **Disable (Workspace)** seçeneğini kullanın:
   - `Java Extension Pack`
   - `Java Language Server`
   - `Java to Azure`
   - Diğer Java ile ilgili eklentiler

#### Yöntem 3: Kullanıcı Ayarlarını Kontrol Edin
1. **File > Preferences > Settings** (veya Ctrl+,)
2. "java" arayın
3. `Java: Enabled` ayarını bulun ve **kapatın**

#### Yöntem 4: VS Code Eklenti Önbelleğini Temizleyin
1. VS Code'u kapatın
2. Aşağıdaki klasörü silin (varsa):
   - Windows: `%APPDATA%\Code\CachedExtensionVSIXs`
   - macOS: `~/Library/Application Support/Code/CachedExtensionVSIXs`
   - Linux: `~/.config/Code/CachedExtensionVSIXs`
3. VS Code'u yeniden başlatın

## Önerilen Eklentiler

Bu proje için aşağıdaki eklentiler önerilir:

### Zorunlu
- **ESLint** - JavaScript kod kalitesi
- **Prettier** - Kod biçimlendirme

### Önerilen
- **ES7+ React/Redux/React-Native snippets** - React geliştirme
- **MongoDB for VS Code** - MongoDB veritabanı yönetimi
- **GitLens** - Git entegrasyonu
- **npm Intellisense** - npm paket içe aktarma desteği
- **Path Intellisense** - Dosya yolu otomatik tamamlama
- **REST Client** - API testi

## Ek Bilgiler

### Proje Yapısı
```
edumath/
├── backend-express/    # Node.js/Express API
├── frontend-react/     # React SPA
├── mobile-expo/        # React Native (Expo)
└── .vscode/            # VS Code yapılandırması
```

### Teknoloji Stack
- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React 19, Vite, React Router 7
- **Mobile**: React Native (Expo)

Bu proje için **Java eklentilerine ihtiyaç yoktur**.

## İletişim

Hala sorun yaşıyorsanız:
- **Email**: bahadir26@hotmail.com
- **Issue**: GitHub üzerinde yeni bir issue açın

---

## English Version

### Problem
If you're getting this error in VS Code:

```
Connection state: Error spawn c:\Users\...\vscode\extensions\vscjava.migrate-java-to-azure-...\out\mcp-server.exe ENOENT
```

This error occurs because VS Code is trying to run Java extensions on our JavaScript/Node.js project.

### Solution
This project is **JavaScript/Node.js/React**, not Java. We don't need Java extensions.

The changes in this PR:
1. **`.vscode/settings.json`** - Disables Java extensions
2. **`.vscode/extensions.json`** - Recommends appropriate extensions and rejects Java extensions

### Manual Fix (If Still Getting Errors)

1. **Reload VS Code workspace**
2. **Disable Java extensions** in Extensions view (Ctrl+Shift+X)
3. **Check user settings** and disable Java
4. **Clear VS Code extension cache** if needed

This project requires **NO Java extensions**.
