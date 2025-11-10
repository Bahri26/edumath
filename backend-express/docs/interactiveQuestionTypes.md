# Interaktif Soru Tipleri Taslak

Bu doküman yeni `interactive` tabanlı soru türleri için **schema + alan** özetini içerir.

## Ortak Alanlar
```json
{
  "questionType": "interactive",
  "interactionKind": "match | memory | random-cards | find-pair | wheel | open-boxes | anagram | grouping | sentence-order | fill-sentence | pair-reveal",
  "interactionConfig": { /* türe özgü */ }
}
```

## Türler ve Config Şemaları

### 1. match (Eşleştir)
```json
{
  "items": [{"id": "i1", "left": "Parabola", "right": "İkinci derece fonksiyon grafiği"}],
  "shuffleSides": true,
  "scoring": "perPair" // perPair | allOrNothing
}
```

### 2. memory (Hafıza Kartları)
```json
{
  "cards": [{"id": "c1", "pairId": "p1", "content": "3x5"}, {"id": "c2", "pairId": "p1", "content": "15"}],
  "revealTimeMs": 0,
  "gridColumns": 4
}
```

### 3. random-cards (Rastgele Kartlar)
```json
{
  "deck": [{"text": "Alan formülleri", "difficulty": "Kolay", "tag": "geometri"}],
  "drawCount": 1,
  "allowRedraw": false
}
```

### 4. find-pair (Eşleşmeyi Bul)
```json
{
  "targets": [{"id": "t1", "label": "Üçgen"}],
  "candidates": [{"id": "c1", "label": "3 kenarlı", "matchTargetId": "t1"}],
  "attemptsAllowed": 3
}
```

### 5. wheel (Çarkıfelek)
```json
{
  "slices": [{"label": "+5 XP", "weight": 1}],
  "spinCountPerSession": 1,
  "rewardMode": "points" // points | hint | timeBonus
}
```

### 6. open-boxes (Kutuyu Aç)
```json
{
  "boxes": [{"id": "b1", "label": "İpucu 1", "content": "a^2 + b^2"}],
  "revealOrder": "sequential", // sequential | any
  "penaltyPerReveal": 0
}
```

### 7. anagram
```json
{
  "solution": "PARABOL",
  "scrambled": "LAPAROB",
  "hint": "İkinci derece fonksiyon grafiği",
  "allowMistakes": true
}
```

### 8. grouping (Grup Sıralaması)
```json
{
  "groups": [{"id": "g1", "name": "Asal"}],
  "items": [{"id": "i1", "label": "11", "groupId": "g1"}],
  "scoring": "perItem"
}
```

### 9. sentence-order (Kelime Çorbası)
```json
{
  "tokens": ["Parabola", "aks", "simetrik"],
  "solutionOrder": [0,2,1],
  "allowExtraTokens": false
}
```

### 10. fill-sentence (Cümleyi Tamamlayın)
```json
{
  "textTemplate": "Parabola tepe noktası {blank1} ile gösterilir.",
  "blanks": [{"id": "blank1", "answers": ["(h,k)", "h,k"], "hint": "Tepe noktası koordinat çifti"}],
  "caseInsensitive": true
}
```

### 11. pair-reveal (Eşleşen Çiftler)
```json
{
  "pairs": [{"id": "p1", "a": "3^2", "b": "9"}],
  "timeLimitSec": 60,
  "showMismatchForMs": 800
}
```

## Doğrulama Notları
- Boş config nesnesi gönderilirse controller varsayılanları ekleyebilir.
- Her item için kısa, benzersiz `id` (UUID veya nanoid) önerilir.
- Güvenlik: Öğrencinin verdiği cevapta sadece `questionId`, `interactionKind` ve `answerPayload` bulunacak.

## Geliştirme Önceliği
1. match
2. anagram
3. memory
4. grouping

## Örnek Tam Belge
```json
{
  "subject": "Matematik",
  "classLevel": "7. Sınıf",
  "topic": "Fonksiyonlar",
  "learningOutcome": "Aritmetik ifade yorumlama",
  "questionType": "interactive",
  "interactionKind": "match",
  "text": "Terimleri tanımlarıyla eşleştir.",
  "interactionConfig": {
    "items": [
      {"id": "i1", "left": "Parabola", "right": "İkinci derece fonksiyon grafiği"},
      {"id": "i2", "left": "Tepe Noktası", "right": "Grafiğin maksimum/minimum noktası"}
    ],
    "shuffleSides": true,
    "scoring": "perPair"
  },
  "difficulty": "Orta"
}
```
