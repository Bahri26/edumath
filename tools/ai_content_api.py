
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import random
import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Gemini API ile ve fallback olarak yerel bilgi ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def get_gemini_fact(topic: str):
    if not GEMINI_API_KEY:
        return None
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}
    prompt = f"{topic} hakkında ilginç, kısa ve eğitici bir bilgi ver. Sadece bilgi ver, başlık ve açıklama da döndür."
    data = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }
    try:
        response = requests.post(url, headers=headers, params=params, json=data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            text = result["candidates"][0]["content"]["parts"][0]["text"]
            return {
                "title": topic,
                "explanation": text,
                "image_url": ""
            }
    except Exception:
        pass
    return None

def get_topic_fact(topic: str):
    gemini_fact = get_gemini_fact(topic)
    if gemini_fact:
        return gemini_fact
    if topic.lower() == "matematik":
        facts = [
            {
                "title": "Pi Sayısı",
                "explanation": "Pi sayısı irrasyonel bir sayıdır ve ondalık kısmı sonsuzdur.",
                "image_url": "https://cdn.pixabay.com/photo/2013/07/12/15/55/pi-150568_1280.png"
            },
            {
                "title": "Üçgenin İç Açıları",
                "explanation": "Bir üçgenin iç açıları toplamı her zaman 180 derecedir.",
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Triangle_angles_sum.svg/512px-Triangle_angles_sum.svg.png"
            },
            {
                "title": "Asal Sayılar",
                "explanation": "Bir asal sayı yalnızca 1 ve kendisine bölünebilir.",
                "image_url": "https://cdn.pixabay.com/photo/2017/01/31/13/14/prime-2029360_1280.png"
            },
            {
                "title": "Sıfırın Özelliği",
                "explanation": "Sıfır ile herhangi bir sayının çarpımı sıfırdır.",
                "image_url": "https://cdn.pixabay.com/photo/2012/04/13/00/22/zero-31212_1280.png"
            },
            {
                "title": "Altın Oran",
                "explanation": "Altın oran, matematikte ve sanatta estetik bir orandır ve yaklaşık 1.618'e eşittir.",
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Golden_ratio_line.svg/512px-Golden_ratio_line.svg.png"
            }
        ]
        return random.choice(facts)
    return {
        "title": topic,
        "explanation": f"{topic} ile ilgili bilgi bulunamadı.",
        "image_url": ""
    }

def generate_multiple_choice(topic: str):
    if topic == 'Dikdörtgenin Alanı':
        return {
            'type': 'multiple_choice',
            'question': 'Bir dikdörtgenin kısa kenarı 4 cm, uzun kenarı 7 cm ise alanı kaç cm² olur?',
            'options': ['11', '28', '21', '18'],
            'answer': '28'
        }
    return None

def generate_fill_in_blank(topic: str):
    if topic == 'Dikdörtgenin Alanı':
        return {
            'type': 'fill_in_blank',
            'question': 'Dikdörtgenin alanı = ____ x ____',
            'answer': 'kısa kenar x uzun kenar'
        }
    return None

def generate_true_false(topic: str):
    if topic == 'Dikdörtgenin Alanı':
        return {
            'type': 'true_false',
            'question': 'Dikdörtgenin alanı, kenar uzunluklarının toplamı ile bulunur.',
            'answer': False
        }
    return None

# --- API modelleri ---
class ContentResponse(BaseModel):
    topic: str
    title: str
    explanation: str
    image_url: str
    questions: List[dict] = []

@app.get("/generate-content", response_model=ContentResponse)
def generate_content(topic: str = Query(..., description="Eksik konu başlığı")):
    fact = get_topic_fact(topic)
    questions = []
    for fn in [generate_multiple_choice, generate_fill_in_blank, generate_true_false]:
        q = fn(topic)
        if q:
            questions.append(q)
    return ContentResponse(
        topic=topic,
        title=fact["title"],
        explanation=fact["explanation"],
        image_url=fact["image_url"],
        questions=questions
    )

