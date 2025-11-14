# AI-FastAPI Kurulum Rehberi

## Adım 1: Klasör Yapısını Oluştur

Windows PowerShell'de ai-fastapi klasöründe:

```powershell
# Tüm klasörleri oluştur
mkdir app, app\models, app\routers, app\services, app\middleware, app\utils, app\ml_models, tests, tests\unit, tests\integration, data, data\training, data\cache

# __init__.py dosyalarını oluştur
New-Item -ItemType File -Path "app\__init__.py", "app\models\__init__.py", "app\routers\__init__.py", "app\services\__init__.py", "app\middleware\__init__.py", "app\utils\__init__.py", "tests\__init__.py"
```

## Adım 2: Virtual Environment Oluştur

```powershell
python -m venv venv
venv\Scripts\activate
```

## Adım 3: Paketleri Yükle

```powershell
pip install -r requirements.txt
```

## Adım 4: Çevre Değişkenlerini Ayarla

```powershell
cp .env.example .env
# .env dosyasını düzenle ve API anahtarlarını ekle
```

## Adım 5: Servisi Başlat

```powershell
uvicorn main:app --reload --port 8001
```

## Test

http://localhost:8001/docs adresine git

## Sorun Giderme

### Python bulunamıyor
```powershell
# Python yüklü mü kontrol et
python --version
# Veya
py --version
```

### Paket yüklenmiyor
```powershell
# Pip'i güncelle
python -m pip install --upgrade pip
```

### Port 8001 kullanımda
```powershell
# Başka port kullan
uvicorn main:app --reload --port 8002
```
