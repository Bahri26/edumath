#!/usr/bin/env python3
"""
AI-FastAPI proje yapısını oluşturur
"""

import os
from pathlib import Path

# Ana dizin
BASE_DIR = Path(__file__).parent

# Oluşturulacak klasörler
DIRECTORIES = [
    "app",
    "app/models",
    "app/routers",
    "app/services",
    "app/middleware",
    "app/utils",
    "app/ml_models",
    "tests",
    "tests/unit",
    "tests/integration",
    "data",
    "data/training",
    "data/cache",
]

# __init__.py dosyası oluşturulacak klasörler
INIT_FILES = [
    "app",
    "app/models",
    "app/routers",
    "app/services",
    "app/middleware",
    "app/utils",
    "tests",
    "tests/unit",
    "tests/integration",
]

# .gitkeep dosyası oluşturulacak klasörler (boş klasörleri git'e eklemek için)
GITKEEP_FILES = [
    "data/training",
    "data/cache",
]


def create_directories():
    """Klasörleri oluştur"""
    print("📁 Klasörler oluşturuluyor...")
    
    for directory in DIRECTORIES:
        dir_path = BASE_DIR / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"  ✅ {directory}")


def create_init_files():
    """__init__.py dosyalarını oluştur"""
    print("\n📄 __init__.py dosyaları oluşturuluyor...")
    
    for directory in INIT_FILES:
        init_file = BASE_DIR / directory / "__init__.py"
        if not init_file.exists():
            with open(init_file, "w", encoding="utf-8") as f:
                f.write('"""\n')
                f.write(f"{directory.split('/')[-1]} package\n")
                f.write('"""\n')
            print(f"  ✅ {directory}/__init__.py")


def create_gitkeep_files():
    """Boş klasörler için .gitkeep oluştur"""
    print("\n📌 .gitkeep dosyaları oluşturuluyor...")
    
    for directory in GITKEEP_FILES:
        gitkeep_file = BASE_DIR / directory / ".gitkeep"
        if not gitkeep_file.exists():
            gitkeep_file.touch()
            print(f"  ✅ {directory}/.gitkeep")


def create_placeholder_files():
    """Placeholder dosyaları oluştur"""
    print("\n📝 Placeholder dosyaları oluşturuluyor...")
    
    # Services
    services = {
        "app/services/openai_service.py": '''"""
OpenAI API servis katmanı
"""

import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()


class OpenAIService:
    """OpenAI API ile etkileşim"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        self.client = AsyncOpenAI(api_key=self.api_key)
    
    async def generate_completion(self, prompt: str, max_tokens: int = 2000) -> str:
        """GPT completion üret"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Sen yardımcı bir matematik öğretmenisin."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"OpenAI API hatası: {str(e)}")
''',
        "app/middleware/auth.py": '''"""
JWT Authentication Middleware
"""

from fastapi import Header, HTTPException
import jwt
import os

async def verify_token(authorization: str = Header(None)):
    """JWT token doğrula"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header gerekli")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(
            token,
            os.getenv("JWT_SECRET"),
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Geçersiz token")


async def get_current_user(token_data = None):
    """Mevcut kullanıcıyı al"""
    # Token data'dan kullanıcı bilgilerini çek
    return token_data
''',
        "app/middleware/rate_limit.py": '''"""
Rate Limiting Middleware
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
from collections import defaultdict

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Basit rate limiting"""
    
    def __init__(self, app, max_requests: int = 60, window: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window
        self.requests = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = time.time()
        
        # Eski istekleri temizle
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < self.window
        ]
        
        # Rate limit kontrolü
        if len(self.requests[client_ip]) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later."
            )
        
        # Yeni isteği kaydet
        self.requests[client_ip].append(now)
        
        response = await call_next(request)
        return response
''',
    }
    
    for file_path, content in services.items():
        file = BASE_DIR / file_path
        if not file.exists():
            with open(file, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  ✅ {file_path}")


def main():
    """Ana fonksiyon"""
    print("🚀 AI-FastAPI Proje Yapısı Oluşturulucu\n")
    
    create_directories()
    create_init_files()
    create_gitkeep_files()
    create_placeholder_files()
    
    print("\n✨ Proje yapısı başarıyla oluşturuldu!")
    print("\n📋 Sonraki adımlar:")
    print("  1. python -m venv venv")
    print("  2. venv\\Scripts\\activate  (Windows)")
    print("  3. pip install -r requirements.txt")
    print("  4. copy .env.example .env")
    print("  5. uvicorn main:app --reload --port 8001")


if __name__ == "__main__":
    main()
