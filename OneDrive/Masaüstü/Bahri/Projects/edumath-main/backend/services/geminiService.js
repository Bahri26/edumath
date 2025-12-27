const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require('fs');
const path = require('path');
const os = require('os');

async function analyzePdfWithGemini(pdfBuffer) {
  let tempFilePath = null;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY bulunamadı!");

    const genAI = new GoogleGenerativeAI(apiKey);
    const fileManager = new GoogleAIFileManager(apiKey);

    // --- KRİTİK AYARLAR ---
    // 1. Model: 'gemini-1.5-flash' (En uyumlu ve hızlı model)
    // 2. Güvenlik: Tüm filtreleri KAPATIYORUZ (BLOCK_NONE) ki boş cevap dönmesin.
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
        generationConfig: { responseMimeType: "application/json" },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
    });

    console.log("1. PDF İşleniyor...");
    const tempFileName = `upload_${Date.now()}.pdf`;
    tempFilePath = path.join(os.tmpdir(), tempFileName);
    fs.writeFileSync(tempFilePath, pdfBuffer);

    console.log("2. Dosya Google'a Yükleniyor...");
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: "application/pdf",
      displayName: "Math Exam PDF",
    });

    const fileUri = uploadResult.file.uri;
    console.log(`3. Dosya Yüklendi: ${fileUri}`);

    // Google'ın dosyayı işlemesi için kısa bir bekleme (Önemli!)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const prompt = `
    Sen uzman bir matematik öğretmenisin. Bu PDF dosyasındaki soruları analiz et.
    
    Lütfen şu kurallara uyarak JSON formatında yanıt ver:
    1. Soruları tek tek ayıkla.
    2. Soruda şekil varsa "text" içine "[ŞEKİL] ..." notu düş.
    3. Şıkları (A, B, C, D) "options" dizisine koy.
    4. Soruyu çöz ve doğru cevabı "correctAnswer" alanına yaz (Örn: "A").
    5. Konu başlığını "subject" alanına yaz.

    Beklenen JSON Formatı:
    [
      {
        "text": "Soru metni...",
        "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
        "correctAnswer": "A",
        "difficulty": "Orta",
        "subject": "Matematik"
      }
    ]
    `;

    console.log("4. Analiz Başlatılıyor...");
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: fileUri
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    const responseText = response.text();
    console.log("5. Analiz Bitti. Cevap Uzunluğu:", responseText.length);

    try {
        let cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        // Olası baştaki/sondaki fazlalıkları temizle
        const firstBracket = cleanedText.indexOf('[');
        const lastBracket = cleanedText.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanedText = cleanedText.substring(firstBracket, lastBracket + 1);
        }
        
        const questions = JSON.parse(cleanedText);
        return Array.isArray(questions) ? questions : [];
    } catch (e) {
        console.error("JSON Parse Hatası. Gelen Veri:", responseText);
        throw new Error("AI yanıtı okunamadı.");
    }

  } catch (error) {
    // Hata detayını backend terminaline yazdır
    console.error("🔥 GEMINI SERVİS HATASI:", error);
    if (error.response?.promptFeedback) {
        console.error("🔒 Güvenlik Bloğu:", error.response.promptFeedback);
    }
    throw error;
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

module.exports = { analyzePdfWithGemini };