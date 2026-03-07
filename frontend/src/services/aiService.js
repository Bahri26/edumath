const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

// API Anahtarını .env dosyasından almalısın
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Dosyayı Base64'e çeviren yardımcı fonksiyon
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

exports.extractQuestionsFromPDF = async (filePath) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Sen uzman bir matematik öğretmenisin. Sana verdiğim bu PDF dosyasındaki matematik sorularını analiz et.
            Soruları, şıkları, doğru cevabı ve tahmini zorluk seviyesini (1: Kolay, 2: Orta, 3: Zor) çıkar.
            
            Çıktıyı SADECE geçerli bir JSON formatında ver. Başka hiçbir metin yazma.
            JSON Formatı tam olarak şöyle olmalı (Array içinde objeler):
            [
                {
                    "content_text": "Soru metni buraya",
                    "difficulty_level": 1,
                    "topic": "Tahmini Konu Başlığı (Örn: Örüntüler)",
                    "options": [
                        {"option_text": "A şıkkı metni", "is_correct": 0},
                        {"option_text": "B şıkkı metni (Doğruysa)", "is_correct": 1},
                        {"option_text": "C şıkkı metni", "is_correct": 0},
                        {"option_text": "D şıkkı metni", "is_correct": 0}
                    ]
                }
            ]
            Eğer resimli bir soruysa, metin kısmına "Görsel soru: [Soru metni]" şeklinde not düş.
        `;

        const pdfPart = fileToGenerativePart(filePath, "application/pdf");

        const result = await model.generateContent([prompt, pdfPart]);
        const response = await result.response;
        let text = response.text();

        // Gemini bazen JSON'ı ```json ... ``` blokları arasına koyar, onları temizleyelim
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(text);

    } catch (error) {
        console.error("AI İşleme Hatası:", error);
        throw new Error("PDF analiz edilirken hata oluştu.");
    }
};