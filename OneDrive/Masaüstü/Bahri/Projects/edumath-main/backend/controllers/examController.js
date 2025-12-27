const Exam = require('../models/Exam');
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.getExamAnalysis = async (req, res) => {
  console.log("🔍 ANALİZ İSTEĞİ GELDİ..."); // LOG 1

  try {
    const examId = req.params.id;
    // Kullanıcı ID'sini güvenli al
    const userId = req.user ? (req.user._id || req.user.id) : null;

    console.log(`👤 Kullanıcı: ${userId}, 📝 Sınav: ${examId}`); // LOG 2

    if (!userId) {
        return res.status(401).json({ message: 'Oturum hatası: Kullanıcı bulunamadı.' });
    }

    // 1. Sınavı bul
    const exam = await Exam.findById(examId).populate('questions');
    
    if (!exam) {
        console.error("❌ Sınav veritabanında yok.");
        return res.status(404).json({ message: 'Sınav bulunamadı' });
    }

    // 2. Results dizisi var mı kontrol et
    if (!exam.results || !Array.isArray(exam.results)) {
        console.error("❌ Sınav objesinde 'results' dizisi yok veya hatalı.");
        return res.status(404).json({ message: 'Sınav sonuç verisi bozuk.' });
    }

    // 3. Öğrencinin sonucunu GÜVENLİ şekilde bul
    const result = exam.results.find(r => {
        // r veya r.studentId null ise hata vermesin diye kontrol ediyoruz
        return r && r.studentId && r.studentId.toString() === userId.toString();
    });

    if (!result) {
        console.error("❌ Kullanıcının bu sınavda sonucu yok.");
        return res.status(404).json({ message: 'Henüz bu sınavı çözmemişsiniz.' });
    }

    console.log("✅ Sonuç Bulundu:", result); // LOG 3

    // 4. İstatistikleri Hesapla (NaN hatasını önlemek için || 0 kullanıyoruz)
    const totalQuestions = exam.questions ? exam.questions.length : 0;
    const correct = result.correctCount || 0;
    const wrong = result.wrongCount || 0;
    const blankCount = totalQuestions - (correct + wrong);

    // Zorluk dağılımı
    let easyCount = 0, mediumCount = 0, hardCount = 0;
    if (exam.questions && Array.isArray(exam.questions)) {
        exam.questions.forEach(q => {
          if (!q) return; // Soru silinmişse atla
          if (q.difficulty === 'Kolay') easyCount++;
          else if (q.difficulty === 'Orta') mediumCount++;
          else if (q.difficulty === 'Zor') hardCount++;
        });
    }

    // 5. --- YAPAY ZEKA (GEMINI) ---
    let aiComment = "Yapay zeka yorumu şu an oluşturulamadı.";

    try {
        if (process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
            Bir öğrenci matematik sınavından ${result.score || 0} puan aldı.
            İstatistikler: ${correct} Doğru, ${wrong} Yanlış, ${blankCount} Boş.
            Zorluk Dağılımı: ${easyCount} Kolay, ${mediumCount} Orta, ${hardCount} Zor.
            
            Öğretmen gibi "Sen" diliyle, 3 cümleyi geçmeyen motive edici ve yönlendirici bir karne yorumu yaz.
            `;
            
            // Timeout ekleyelim ki AI çok bekletirse sistem çökmesin
            const aiPromise = model.generateContent(prompt);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Zaman aşımı")), 4000));
            
            const aiResult = await Promise.race([aiPromise, timeoutPromise]);
            
            if (aiResult && aiResult.response) {
                 aiComment = aiResult.response.text();
            }
        }
    } catch (aiError) {
        console.error("⚠️ AI Yorum Hatası (Önemli değil, devam ediliyor):", aiError.message);
    }

    // 6. Cevabı Gönder
    res.json({
      score: result.score || 0,
      correctCount: correct,
      wrongCount: wrong,
      blankCount: blankCount < 0 ? 0 : blankCount, // Eksi çıkarsa 0 yap
      topicStats: [],
      easyCount,
      mediumCount,
      hardCount,
      weakTopics: result.weakTopics || [],
      aiFeedback: aiComment
    });

  } catch (err) {
    // BURASI ÇOK ÖNEMLİ: Gerçek hatayı terminale yaz
    console.error("🔥 KRİTİK SUNUCU HATASI:", err); 
    res.status(500).json({ message: 'Sunucu hatası: ' + err.message });
  }
};