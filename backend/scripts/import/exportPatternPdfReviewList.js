/**
 * PDF içe aktarım soruları için düzeltme listesi üretir.
 * Kullanım: node scripts/import/exportPatternPdfReviewList.js
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const Question = require('../../models/Question');
const { assessQuestion } = require('./patternPdfQuality');

const OUTPUT_MD = path.join(__dirname, '..', '..', '..', 'docs', 'pattern-pdf-duzeltme-listesi.md');
const OUTPUT_CSV = path.join(__dirname, '..', '..', '..', 'docs', 'pattern-pdf-duzeltme-ozet.csv');
const CLASS_LEVELS = ['5. Sınıf', '6. Sınıf', '7. Sınıf', '9. Sınıf'];

const ISSUE_LABELS = {
  'metin-eksik': 'Soru metni OCR ile alınamadı (varsayılan başlık)',
  'metin-kisa': 'Metin çok kısa',
  'metin-gurultu': 'Metinde OCR gürültüsü',
  'sik-zayif': 'Şıklar eksik veya bozuk',
  'cevap-zayif': 'Doğru cevap şüpheli / OCR hatası',
  'cozum-jenerik': 'Çözüm adımı otomatik üretilemedi',
  'gorsel-yok': 'Görsel eklenmemiş',
  'anahtar-uyumsuz': 'PDF anahtarı ile şık eşleşmiyor (9. sınıf)',
};

function formatOptions(options) {
  return (options || [])
    .map((o, i) => `${String.fromCharCode(65 + i)}) ${String(o.text || '').trim()}`)
    .filter((line) => line.length > 3)
    .join(' · ');
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI tanımlı değil.');
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: (process.env.MONGODB_DB || 'Edumath').trim() });

  const lines = [
    '# Örüntü PDF İçe Aktarım — Düzeltme Listesi',
    '',
    `Oluşturulma: ${new Date().toISOString().slice(0, 10)}`,
    '',
    'Bu liste `assessmentMeta.importSource = pattern-pdf-pack` olan soruları içerir.',
    'Öncelik: **kritik** → öğretmen panelinden metin/şık/cevap düzeltmesi gerekir.',
    '',
    '---',
    '',
  ];

  let totalReview = 0;
  let totalCritical = 0;
  const csvRows = [['sinif', 'sira', 'zorluk', 'oncelik', 'pdf_anahtar', 'dogru_cevap', 'sorunlar', 'soru_id'].join(',')];

  for (const classLevel of CLASS_LEVELS) {
    const questions = await Question.find({
      classLevel,
      subject: 'Matematik',
      'assessmentMeta.importSource': 'pattern-pdf-pack',
    })
      .sort({ 'assessmentMeta.sequenceIndex': 1 })
      .lean();

    if (!questions.length) {
      lines.push(`## ${classLevel}`, '', '_Bu sınıf için PDF içe aktarım sorusu bulunamadı._', '', '---', '');
      continue;
    }

    const byDiff = { Kolay: [], Orta: [], Zor: [] };
    for (const q of questions) {
      const { issues, severity, needsReview } = assessQuestion(q);
      const row = { q, issues, severity, needsReview };
      byDiff[q.difficulty]?.push(row);
      if (needsReview) {
        totalReview += 1;
        if (severity === 'kritik') totalCritical += 1;
      }
    }

    lines.push(`## ${classLevel} (${questions.length} soru)`);
    lines.push('');
    lines.push(`| Özet | Sayı |`);
    lines.push(`|------|------|`);
    lines.push(`| İnceleme gerekli | ${questions.filter((q) => assessQuestion(q).needsReview).length} |`);
    lines.push(`| Kritik | ${questions.filter((q) => assessQuestion(q).severity === 'kritik').length} |`);
    lines.push(`| PDF cevap anahtarı | ${classLevel === '9. Sınıf' ? 'Var (PDF metin katmanı)' : 'Yok — manuel veya ML tahmini'} |`);
    lines.push('');

    for (const diff of ['Kolay', 'Orta', 'Zor']) {
      const rows = byDiff[diff] || [];
      lines.push(`### ${diff} (${rows.length} soru)`);
      lines.push('');

      for (const { q, issues, severity } of rows) {
        const seq = q.assessmentMeta?.sequenceIndex || '?';
        csvRows.push([
          classLevel,
          seq,
          diff,
          severity,
          q.assessmentMeta?.answerLetter || '',
          `"${String(q.correctAnswer || '').replace(/"/g, '""').slice(0, 80)}"`,
          `"${issues.join(';')}"`,
          q._id,
        ].join(','));
        const flag = issues.length ? `⚠ ${severity.toUpperCase()}` : '✓';
        lines.push(`#### Soru ${seq} — ${flag}`);
        lines.push('');
        if (issues.length) {
          lines.push('**Sorunlar:** ' + issues.map((i) => ISSUE_LABELS[i] || i).join(' · '));
          lines.push('');
        }
        lines.push(`- **ID:** \`${q._id}\``);
        if (q.assessmentMeta?.answerLetter) {
          lines.push(`- **PDF anahtarı:** ${q.assessmentMeta.answerLetter}`);
        }
        lines.push(`- **Doğru cevap (sistem):** ${q.correctAnswer || '—'}`);
        lines.push(`- **Şıklar:** ${formatOptions(q.options) || '—'}`);
        lines.push(`- **Görsel:** ${q.image ? 'Var' : 'Yok'}`);
        lines.push('');
        lines.push('**Metin:**');
        lines.push('');
        lines.push('```');
        lines.push((q.text || '').slice(0, 600));
        lines.push('```');
        lines.push('');
        if (q.solution && !assessQuestion(q).issues.includes('cozum-jenerik')) {
          lines.push('<details><summary>Çözüm</summary>');
          lines.push('');
          lines.push('```');
          lines.push(q.solution.slice(0, 400));
          lines.push('```');
          lines.push('');
          lines.push('</details>');
          lines.push('');
        } else {
          lines.push('_Çözüm: öğretmen panelinden eklenmeli._');
          lines.push('');
        }
        lines.push('**Yapılacak:** Metni PDF ile karşılaştır · şıkları düzelt · doğru cevabı işaretle · çözüm adımlarını yaz.');
        lines.push('');
      }
    }
    lines.push('---');
    lines.push('');
  }

  lines.push('## Genel özet');
  lines.push('');
  lines.push(`- Toplam inceleme önerilen: **${totalReview}**`);
  lines.push(`- Kritik öncelik: **${totalCritical}**`);
  lines.push(`- 5–7. sınıf: ayrı cevap anahtarı PDF\'i yok; şık/cevap OCR + ML tahminidir.`);
  lines.push(`- 9. sınıf: PDF alt bilgi anahtarı kullanıldı; şık metinleri yine OCR ile kontrol edilmeli.`);
  lines.push('');

  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_MD, lines.join('\n'), 'utf8');
  fs.writeFileSync(OUTPUT_CSV, csvRows.join('\n'), 'utf8');
  console.log('Yazıldı:', OUTPUT_MD);
  console.log('Yazıldı:', OUTPUT_CSV);
  console.log(JSON.stringify({ totalReview, totalCritical }, null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
