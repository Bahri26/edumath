export const patternsCurriculum = {
  topic: "Örüntüler",
  grades: [
    {
      grade: 1,
      title: "Basit Tekrarlayan Örüntüler",
      objectives: [
        {
          id: "1-A-1",
          description: "En çok üç ögeli, tekrarlayan bir örüntüdeki kuralı bulur ve eksik bırakılan ögeyi tamamlar.",
          examples: ["A-B-A-B-?", "Elma-Armut-Elma-?"],
          activityType: "complete-the-sequence" // Wordwall'dan ilhamla
        },
        {
          id: "1-A-2",
          description: "Verilen bir örüntüyü model veya nesnelerle oluşturur.",
          activityType: "build-the-pattern"
        }
      ]
    },
    {
      grade: 4,
      title: "Sayı ve Şekil Örüntüleri",
      objectives: [
        {
          id: "4-A-1",
          description: "Sayı örüntülerinin kuralını bulur ve örüntüyü genişletir.",
          examples: ["5-10-15-20-?"],
          activityType: "whats-the-rule"
        },
        {
          id: "4-A-2",
          description: "Şekil örüntülerinde bir sonraki adımı belirler.",
          activityType: "next-shape"
        }
      ]
    },
    {
      grade: 8,
      title: "Doğrusal İlişkiler ve Cebirsel İfadeler",
      objectives: [
        {
          id: "8-A-1",
          description: "Verilen bir sayı örüntüsünün kuralını harfli ifade (cebirsel) olarak yazar.",
          examples: ["n -> 2n+1 kuralı"],
          activityType: "find-the-algebraic-rule"
        }
      ]
    },
    {
      grade: 12,
      title: "Diziler ve Seriler",
      objectives: [
        {
          id: "12-A-1",
          description: "Aritmetik bir dizinin genel terimini veya herhangi bir terimini bulur.",
          activityType: "arithmetic-sequence-formula"
        },
        {
          id: "12-A-2",
          description: "Geometrik bir dizinin genel terimini veya herhangi bir terimini bulur.",
          activityType: "geometric-sequence-formula"
        }
      ]
    }
    // Diğer sınıflar (2, 3, 5, 6, 7, 9, 10, 11) buraya eklenecek...
  ]
};
