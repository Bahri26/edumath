# Soru bankası görsel ve arayüz düzeltmeleri — 18 Ekim 2026

Canlı frontend paketi API istekleri için `edumath-t10n.onrender.com`, göreli görseller için eski `edumath-api.onrender.com` adresini içeriyordu. Ayrıca PDF kaynak yolu üretim ortamında kapalı olduğundan canlı API üzerinde 404 döndüğü doğrulandı. Edge'in lazy-loading intervention satırı hata kaynağı değildir.

Düzeltmeler:

- Göreli `/uploads` görselleri API köküne çözülür; eski asset-host ayarı görselleri farklı bir servise yönlendirmez.
- 95 kaynak PDF görseli hem geliştirme hem üretimde paket içinden sunulur. Yalnızca izin verilen sınıf ve PNG dosya adları kabul edilir. Öğretmenin görsel değiştirme/kaldırma işaretleri korunur.
- Kartta soru cümlesi gösterilmez. Büyük görsel küçük önizlemesi, sınıf/zorluk rozetleri ve ayrı düzenleme/silme kontrolleri kullanılır. Metin sorularına nötr simge konur; bozuk görseller açık hata durumu gösterir.
- Filtreler etiketlendi, URL sınıfı ilk state'e doğrudan aktarıldı. Geç dönen eski isteklerin yeni sınıf listesini ezmesi engellendi. Mobilde kartlar okunabilirlik için tek sütunla başlar.
- AI formunda ikinci başlık/kapatma alanı ve sunucu ortam değişkeni açıklamaları kaldırıldı; form seçili sınıfı devralır.

Doğrulama: 12 ilgili frontend testi ve 1 backend dosya yolu testi geçti. Üretim derlemesi ve değişen frontend bileşenlerinin lint kontrolü başarılı. Tarayıcı test görünümünde 8/8 gerçek kaynak görseli yüklendi; 375 piksel genişlikte sayfa taşması yok, AI penceresi ekran içinde. Test sırasında AI üretimi veya soru kaydı yapılmadı.
