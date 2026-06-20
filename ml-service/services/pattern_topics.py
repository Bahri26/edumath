"""
MEB örüntü alt konu etiketleri — backend/constants/patternTopics.js ile uyumlu.
"""

from __future__ import annotations

PATTERN_TOPIC_LABELS = {
    "GEOMETRIC": "Örüntüler — Geometrik (şekil)",
    "ARITHMETIC": "Örüntüler — Sayı (sabit adım)",
    "RULE": "Örüntüler — Sayı (karma kural)",
    "SQUARES": "Örüntüler — Kare sayılar",
    "TRIANGULAR": "Örüntüler — Üçgensel sayılar",
    "MATCHING": "Örüntüler — Sınıflama (eşleştirme)",
    "SEQUENCE": "Örüntüler — Çözüm adımları (sıralama)",
}

PATTERN_TOPIC_ORDER = [
    PATTERN_TOPIC_LABELS["GEOMETRIC"],
    PATTERN_TOPIC_LABELS["ARITHMETIC"],
    PATTERN_TOPIC_LABELS["RULE"],
    PATTERN_TOPIC_LABELS["SQUARES"],
    PATTERN_TOPIC_LABELS["TRIANGULAR"],
    PATTERN_TOPIC_LABELS["MATCHING"],
    PATTERN_TOPIC_LABELS["SEQUENCE"],
]

LEARNING_OUTCOME_BY_LABEL = {
    PATTERN_TOPIC_LABELS["GEOMETRIC"]: "Tekrar eden geometrik şekil örüntülerini oluşturur ve bir sonraki elemana karar verir.",
    PATTERN_TOPIC_LABELS["ARITHMETIC"]: "Sayı örüntüsündeki sabit artış ilişkisini fark eder ve eksik terimi bulur.",
    PATTERN_TOPIC_LABELS["RULE"]: "Sayı dizisinde ardışık farklı işlemlerden oluşan kuralı kullanarak geneller.",
    PATTERN_TOPIC_LABELS["SQUARES"]: "Kare sayılarla ifade edilen örüntüde sıradaki terimi belirler.",
    PATTERN_TOPIC_LABELS["TRIANGULAR"]: "Üçgensel sayı düzeninde ilişkiyi görür ve sıradaki değeri bulur.",
    PATTERN_TOPIC_LABELS["MATCHING"]: "Verilen örüntüleri türlerine göre sınıflar ve doğru seçenekle eşleştirir.",
    PATTERN_TOPIC_LABELS["SEQUENCE"]: "Bir örüntü problemini çözmek için uygun işlem sırasını kurar.",
}
