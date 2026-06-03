function buildInteractivePracticeQuestions(weakTopics = []) {
  const primaryTopic = weakTopics[0] || 'Oruntuler';
  return [
    {
      id: 'interactive-matching',
      type: 'matching',
      text: `${primaryTopic} konusunda kurallari dogru oruntulerle eslestir.`,
      explanation: 'Her oruntuyu artis veya tekrar turune gore eslestirmen gerekir.',
      interactionData: {
        prompts: [
          { id: 'repeat', label: '2, 4, 2, 4, ...' },
          { id: 'step', label: '5, 8, 11, 14, ...' },
          { id: 'square', label: '1, 4, 9, 16, ...' },
        ],
        options: ['Tekrarlayan oruntu', '+3 artan oruntu', 'Kare sayi oruntusu'],
        correctPairs: {
          repeat: 'Tekrarlayan oruntu',
          step: '+3 artan oruntu',
          square: 'Kare sayi oruntusu',
        },
      },
    },
    {
      id: 'interactive-sequence',
      type: 'sequence',
      text: 'Bir oruntuyu cozerken izlenecek adimlari dogru siraya koy.',
      explanation: 'Once kural bulunur, sonra artis tipi kontrol edilir, ardindan eksik terim hesaplanir.',
      interactionData: {
        items: [
          { id: 'find-rule', label: 'Oruntudeki kuralı bul' },
          { id: 'check-delta', label: 'Artis veya azalis farkini kontrol et' },
          { id: 'apply-rule', label: 'Kurali eksik terime uygula' },
          { id: 'verify', label: 'Buldugun sonucun oruntuye uydugunu dogrula' },
        ],
        correctOrder: ['find-rule', 'check-delta', 'apply-rule', 'verify'],
      },
    },
  ];
}

function buildFallbackPracticeQuestions(weakTopics = []) {
  const primaryTopic = weakTopics[0] || 'Oruntuler';
  return [
    {
      id: 'fallback-practice-1',
      type: 'multiple-choice',
      text: `${primaryTopic} konusunda 6, 9, 12, 15, ... oruntusunun sonraki terimi nedir?`,
      options: ['18', '17', '21', '16'],
      correctAnswer: '18',
      explanation: 'Oruntu her adimda 3 artiyor. 15 sayisindan sonra 18 gelir.',
    },
    {
      id: 'fallback-practice-2',
      type: 'multiple-choice',
      text: `${primaryTopic} icin 20, 18, 16, 14, ... dizisinde eksik kural hangisidir?`,
      options: ['Her adimda 2 azalir', 'Her adimda 2 artar', 'Tekrarli oruntu vardir', 'Kare sayilar ilerler'],
      correctAnswer: 'Her adimda 2 azalir',
      explanation: 'Ardisik terimler arasindaki fark -2 oldugu icin kural her adimda 2 azalma seklindedir.',
    },
    {
      id: 'fallback-practice-3',
      type: 'multiple-choice',
      text: `${primaryTopic} icin 3, 6, 12, 24, ... oruntusunda sonraki terim hangisidir?`,
      options: ['48', '30', '36', '42'],
      correctAnswer: '48',
      explanation: 'Her terim bir oncekinin 2 kati oldugu icin 24 sonrasinda 48 gelir.',
    },
  ];
}

module.exports = {
  buildInteractivePracticeQuestions,
  buildFallbackPracticeQuestions,
};
