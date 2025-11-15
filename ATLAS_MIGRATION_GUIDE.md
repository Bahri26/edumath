# Atlas Migration - Manuel Adımlar

## Durum
✅ Atlas cluster oluşturuldu
✅ Database kullanıcısı eklendi (bahrikoc1996_db_user)
✅ .env dosyası Atlas URI ile güncellendi
✅ Mongoose bağlantı ayarları optimize edildi

## Yerel Verinin Atlas'a Taşınması

### Seçenek 1: MongoDB Compass (GUI - ÖNERİLEN)
1. MongoDB Compass'ı indirin: https://www.mongodb.com/try/download/compass
2. Yerel bağlantı: `mongodb://localhost:27017`
3. `edumathDB` veritabanını seçin
4. Her koleksiyonu seç → Export Collection → JSON
5. Atlas'a bağlan: `mongodb+srv://bahrikoc1996_db_user:N9TsJQ6P1J6rWsIJ@cluster0.6900dc1.mongodb.net`
6. Her koleksiyona Import

### Seçenek 2: MongoDB Database Tools (Komut Satırı)
```powershell
# 1. İndirin: https://www.mongodb.com/try/download/database-tools
# 2. PATH'e ekleyin veya tam yol kullanın

# Dump (yerel → dosya)
mongodump --db edumathDB --out .\dump

# Restore (dosya → Atlas)
$atlasUri = "mongodb+srv://bahrikoc1996_db_user:N9TsJQ6P1J6rWsIJ@cluster0.6900dc1.mongodb.net/edumathDB?retryWrites=true&w=majority"
mongorestore --uri $atlasUri --db edumathDB .\dump\edumathDB
```

### Seçenek 3: Manuel Veri Giriş (Az Veri Varsa)
- Eğer henüz çok veri yoksa, uygulamayı kullanarak sıfırdan başlayabilirsiniz
- Seed script varsa çalıştırın

## Backend Test
```powershell
cd backend-express
node server.js
```

Beklenen çıktı:
```
MongoDB (Atlas) bağlantısı başarılı.
Express sunucusu http://localhost:8000 adresinde çalışıyor.
```

## Bağlantı Test
```powershell
Invoke-WebRequest http://localhost:8000/api/health | Select-Object -ExpandProperty Content
```

## Güvenlik (Migration Sonrası)
1. Atlas → Network Access → 0.0.0.0/0 kaydını SİLİN
2. Sadece kendi IP'nizi ekleyin
3. Üretim için özel IP aralıkları kullanın

## Sorun Giderme
- **MongoNetworkError**: IP whitelist'e ekleyin
- **Authentication failed**: Kullanıcı adı/şifre kontrol edin
- **Timeout**: serverSelectionTimeoutMS artırın (zaten 10s)

## Sonraki Adımlar
- [ ] Yerel veriyi Atlas'a taşı (yukarıdaki seçeneklerden biri)
- [ ] Backend'i başlat ve test et
- [ ] Frontend'den giriş yap → veri oku/yaz
- [ ] IP whitelist güvenliğini sıkılaştır
