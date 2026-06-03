function formatTopicLines(topicReport = []) {
  if (!topicReport.length) return '- Henüz yeterli konu verisi yok.';
  return topicReport
    .map(
      (t) =>
        `- **${t.topic}**: ${t.correct}/${t.total} doğru (%${t.percent ?? Math.round((100 * t.correct) / Math.max(1, t.total))})`
    )
    .join('\n');
}

function buildExamAnalysis({ studentName, correct, total, topicReport, slowQuestions = [] }) {
  const score = Math.round((100 * correct) / Math.max(1, total));
  const weak = topicReport.filter((t) => (t.percent ?? 0) < 55);
  const strong = topicReport.filter((t) => (t.percent ?? 0) >= 80);

  let tips = [];
  if (score >= 85) tips.push('Genel performansın çok iyi; zor sorularda hızını koruyarak devam et.');
  else if (score >= 60) tips.push('Orta seviyedesin; zayıf konularda kısa tekrar setleri işe yarar.');
  else tips.push('Temel kavramları günlük 20–30 dk tekrar ederek başlangıç yapabilirsin.');

  if (weak.length) {
    tips.push(`Öncelik konuları: ${weak.map((w) => w.topic).join(', ')}.`);
  }
  if (slowQuestions.length) {
    tips.push(`${slowQuestions.length} soruda süre uzun; benzer tiplerde zamanlayıcı ile pratik yap.`);
  }

  return `## ${studentName || 'Öğrenci'} — Sınav özeti (yerel analiz)

**Skor:** ${correct}/${total} (%${score})

### Konu bazlı
${formatTopicLines(topicReport)}

${strong.length ? `**Güçlü alanlar:** ${strong.map((s) => s.topic).join(', ')}\n` : ''}
${weak.length ? `**Geliştirilmesi gereken:** ${weak.map((w) => w.topic).join(', ')}\n` : ''}

### Öneriler
${tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}
`;
}

function buildTeacherSummary({ topicReport, allScores, allSlow }) {
  const avg =
    allScores.length > 0
      ? Math.round(allScores.reduce((s, x) => s + (x.score || 0), 0) / allScores.length)
      : 0;
  const weakTopics = topicReport.filter((t) => (t.percent ?? 0) < 55);

  return `## Sınıf özeti (yerel analiz)

**Ortalama skor:** %${avg} (${allScores.length} öğrenci)

### Konu başarıları
${formatTopicLines(topicReport)}

${weakTopics.length ? `**Sınıf geneli zayıf konular:** ${weakTopics.map((t) => t.topic).join(', ')}\n` : ''}

### Öneriler
1. Zayıf konularda 10–15 dakikalık mini tekrar slaytları hazırlayın.
2. Yavaş çözülen soru tiplerinde (${Object.keys(allSlow || {}).length} öğrenci) ortak çözüm videosu paylaşın.
3. Bir sonraki sınavda zayıf konulardan %40 soru oranı hedefleyin.
`;
}

function buildPerformanceAnalysis({ studentName, examHistory = [] }) {
  const recent = examHistory.slice(-8);
  if (!recent.length) {
    return `## ${studentName}\n\nHenüz sınav geçmişi yok. İlk sınavdan sonra burada kişisel özet görünecek.`;
  }
  const avg =
    recent.reduce((s, e) => s + (e.score ?? e.percent ?? 0), 0) / recent.length;
  const trend =
    recent.length >= 2 && (recent[recent.length - 1].score ?? 0) > (recent[0].score ?? 0)
      ? 'yükseliş'
      : 'dalgalı';

  return `## ${studentName} — Gelişim raporu

Son ${recent.length} sınav ortalaması: **%${Math.round(avg)}** (trend: ${trend}).

### Tavsiyeler
1. Her gün 1 konu tekrarı + 5 soru çözümü.
2. Yanlış yaptığın konuları Çalışma Merkezinden işaretle.
3. Haftada bir deneme sınavı ile ilerlemeni ölç.
`;
}

function buildStudyPlan({ goal, hoursPerDay, daysLeft, weakTopics = [] }) {
  const days = Math.max(1, Math.min(30, Number(daysLeft) || 7));
  const hours = Math.max(0.5, Math.min(8, Number(hoursPerDay) || 1));
  const topics = weakTopics.length ? weakTopics : ['Genel tekrar'];
  const blocks = [];

  for (let d = 1; d <= days; d += 1) {
    const topic = topics[(d - 1) % topics.length];
    blocks.push(
      `| Gün ${d} | ${topic} | ${hours} saat çalışma, 10 dk mola, 15 soru |`
    );
  }

  return `## Çalışma planı: ${goal || 'Matematik hedefi'}

**Süre:** ${days} gün · **Günlük:** ~${hours} saat

| Gün | Konu | Program |
|-----|------|---------|
${blocks.join('\n')}

### İpuçları
- Zayıf konular: ${topics.join(', ')}
- Her oturum sonunda 3 cümle özet yaz.
- Pazar günü hafif tekrar + dinlenme.
`;
}

function buildHint({ questionText, studentAnswer }) {
  const text = String(questionText || '').toLowerCase();
  const ans = String(studentAnswer || '').trim();

  if (!ans) {
    return 'Önce soruda verilen sayıları veya şekilleri sırayla yaz. Oradaki artış veya tekrar kuralını bulmaya çalış.';
  }
  if (/örüntü|oruntu|dizi|sıra/.test(text) || /\d+\s*,\s*\d+/.test(text)) {
    return 'Ardışık terimler arasındaki farka bak: sabit mi artıyor, azalıyor mu, yoksa tekrar mı ediyor? Bulduğun kuralı son boş terime uygula.';
  }
  if (/denklem|x|y=/.test(text)) {
    return 'Her iki tarafı da aynı işlemle sadeleştir. Bilinmeyeni yalnız bırakmayı adım adım dene.';
  }
  if (/geometri|açı|üçgen|alan/.test(text)) {
    return 'Şekildeki bilinen uzunluk ve açıları listele; hangi formül (alan, Pisagor vb.) uyuyorsa onu seç.';
  }
  return 'Soruyu küçük adımlara böl: verilenler → istenen → hangi kural/formül bağlar? Cevabı doğrudan yazmadan önce ara sonucu kontrol et.';
}

function buildAnswerAnalysis({ answer, topic, weakTopics = [] }) {
  const len = String(answer || '').trim().length;
  const onWeak = weakTopics.includes(topic);
  let analysis =
    len < 3
      ? `${topic} konusunda cevabın çok kısa; adımlarını yazarak ilerlemen faydalı olur.`
      : `${topic} için cevabını aldık. Çözüm adımlarını kontrol edip kuralı (artış, tekrar, formül) netleştir.`;

  if (onWeak) {
    analysis += ` Bu konu istatistiksel olarak zayıf görünüyor; Çalışma Merkezinden ek alıştırma önerilir.`;
  }

  return analysis;
}

function buildImageSolution(ocrText) {
  const parsed = String(ocrText || '').trim();
  if (!parsed) {
    return 'Görselden metin okunamadı. Daha net bir fotoğraf yükleyin veya soruyu metin olarak yapıştırın.';
  }
  return `### Okunan metin\n${parsed.slice(0, 800)}\n\n### Yerel çözüm rehberi\n1. Verilenleri listeleyin.\n2. Oruntu veya işlem kuralını bulun.\n3. Kuralı eksik adıma uygulayın.\n4. Sonucu seçeneklerle karşılaştırın.\n\n*Tam adım adım çözüm için soruyu "Akıllı yapıştır" alanına da ekleyebilirsiniz.*`;
}

function chatReply(message) {
  const m = String(message || '').toLowerCase();
  if (/merhaba|selam|hey/.test(m)) {
    return 'Merhaba! EduMath yerel asistanıyım. Dersler, ödevler veya çalışma merkezi hakkında sorabilirsin.';
  }
  if (/ödev|odev|assignment/.test(m)) {
    return 'Ödevler menüsünden bekleyen görevlerini görebilir ve teslim edebilirsin.';
  }
  if (/sınav|sinav|quiz|exam/.test(m)) {
    return 'Sınavlar bölümünde açık sınavlara katılır; sonuçların konu bazlı yerel analizle özetlenir.';
  }
  if (/örüntü|oruntu|pattern/.test(m)) {
    return 'Örüntü sorularında önce artış veya tekrar kuralını bul, sonra eksik terimi hesapla. Derslerim sayfasında örüntü konuları var.';
  }
  if (/ders|konu|course/.test(m)) {
    return 'Derslerim sayfasında sınıfına uygun konular ve ilerleme yüzden görünür.';
  }
  if (/yardım|help|nasıl/.test(m)) {
    return 'Sol menüden Ana Sayfa, Derslerim, Çalışma Merkezi ve Sınavlara gidebilirsin. Profil menüsünde Anketler ve Mesajlar var.';
  }
  return 'Sorunu anladım. Daha net yardım için hangi sayfada olduğunu (ör. ödev, sınav, ders) yazabilir misin?';
}

module.exports = {
  buildExamAnalysis,
  buildTeacherSummary,
  buildPerformanceAnalysis,
  buildStudyPlan,
  buildHint,
  buildAnswerAnalysis,
  buildImageSolution,
  chatReply,
};
