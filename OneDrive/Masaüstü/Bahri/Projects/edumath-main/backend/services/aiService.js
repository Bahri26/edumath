

const pdfjsLib = require('pdfjs-dist');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

async function pdfToImages(pdfBuffer) {
  // pdfjs-dist ile PDF'i yükle ve her sayfanın canvas görüntüsünü base64 PNG olarak döndür
  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  const images = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    // Node ortamında canvas yok, bu yüzden saf metin çıkarımı yapılabilir veya headless-canvas gibi ek paket gerekir.
    // Burada örnek olarak sadece metin çıkarımı yapılacak:
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join(' ');
    // Gerçek görsel çıkarımı için ek native bağımlılık gerekir, bu örnek sadece metinle çalışır.
    images.push({ text });
  }
  return images;
}


async function analyzePdfPage(pdfBuffer) {
  try {
    // 1. PDF'i sayfa metinlerine çevir
    const outputPages = await pdfToImages(pdfBuffer);
    let allQuestions = [];

    // 2. Her sayfa metnini Gemini AI'a gönder
    for (const page of outputPages) {
      const prompt = `Sen uzman bir matematik öğretmenisin. Görevin bu sınav kağıdındaki soruları dijitalleştirmek.\n\nKurallar:\n1. Metindeki tüm soruları tek tek ayıkla.\n2. Eğer soruda bir ŞEKİL, GRAFİK veya GÖRSEL varsa, metnin başına "[GÖRSEL]" etiketi ekle ve şekli kısaca betimle.\n3. Şıkları (A, B, C, D) ayır.\n4. Doğru cevabı tahmin et ve işaretle.\n5. Zorluk seviyesini (Kolay, Orta, Zor) içeriğe göre belirle.\nÇıktıyı SADECE şu JSON formatında ver (Başka hiçbir kelime etme):\n[\n  {\n    "text": "Soru metni buraya...",\n    "options": ["Şık A", "Şık B", "Şık C", "Şık D"],\n    "correctAnswer": "Şık A",\n    "difficulty": "Orta",\n    "subject": "Matematik"\n  }\n]`;
      const geminiBody = {
        contents: [
          { role: "user", parts: [ { text: prompt + "\n\n" + page.text } ] }
        ]
      };
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      });
      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        throw new Error('Gemini API yanıtı beklenen formatta değil.');
      }
      const content = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '');
      const questions = JSON.parse(content);
      allQuestions = [...allQuestions, ...questions];
    }
    return allQuestions;
  } catch (error) {
    console.error("Gemini AI Hatası:", error);
    throw new Error("PDF analiz edilirken hata oluştu.");
  }
}

module.exports = { analyzePdfPage };
