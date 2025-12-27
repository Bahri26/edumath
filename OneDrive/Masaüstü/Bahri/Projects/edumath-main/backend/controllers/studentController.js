const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const StudentExam = require('../models/StudentExam'); // Sınav sonuçları modeli
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. ÖĞRETMENİN LİSTESİNİ GETİR
exports.getMyStudents = async (req, res) => {
  try {
    const teacherId = req.user?.id || req.user?._id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Yetkisiz erişim: Öğretmen ID bulunamadı.' });
    }

    // Öğretmene bağlı öğrencileri getir
    const students = await Student.find({ teacherId: teacherId })
      .populate('userId', 'name email avatar') // User tablosundan isim ve resim al
      .sort({ createdAt: -1 });

    res.status(200).json(students);

  } catch (err) {
    console.error("Öğrenci Listesi Hatası:", err);
    res.status(500).json({ message: "Liste getirilemedi.", error: err.message });
  }
};

// 2. ÖĞRENCİ DETAYI VE GENEL ANALİZİ (AI Destekli)
exports.getStudentDetails = async (req, res) => {
  try {
    const { id } = req.params; // Student Tablosundaki ID (Öğrenci ID'si değil, Kayıt ID'si)

    // 1. Öğrenci Bilgilerini Çek
    const student = await Student.findById(id).populate('userId', 'name email avatar bio phone');
    
    if (!student) {
      return res.status(404).json({ message: "Öğrenci bulunamadı." });
    }

    // 2. Öğrencinin Girdiği Tüm Sınavları Çek (StudentExam tablosundan)
    // Not: student.userId._id kullanıyoruz çünkü StudentExam tablosunda 'student' alanı User ID'sini tutar.
    const exams = await StudentExam.find({ student: student.userId._id })
        .populate('exam', 'title subject') // Sınavın adını ve dersini al
        .sort({ completedAt: -1 }); // En yeniden eskiye

    // 3. İstatistikleri Hesapla
    const totalExams = exams.length;
    let averageScore = 0;
    let recentActivity = [];
    
    if (totalExams > 0) {
        const totalScore = exams.reduce((sum, record) => sum + (record.score || 0), 0);
        averageScore = Math.round(totalScore / totalExams);

        // Son 5 aktiviteyi formatla
        recentActivity = exams.slice(0, 5).map(record => ({
            type: 'exam',
            title: record.exam ? record.exam.title : 'Silinmiş Sınav',
            score: record.score,
            date: record.completedAt
        }));
    }

    // 4. --- YAPAY ZEKA (GEMINI) GENEL RAPORU ---
    let aiReport = "Öğrenci verisi yeterli olmadığı için rapor oluşturulamadı.";

    if (totalExams > 0 && process.env.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
            Öğrenci Adı: ${student.userId.name}
            Toplam Girilen Sınav: ${totalExams}
            Genel Ortalama: ${averageScore}
            Son Sınav Puanları: ${exams.slice(0, 3).map(e => e.score).join(', ')}
            
            Sen bir rehberlik öğretmenisin. Bu öğrencinin genel akademik durumu hakkında 
            velisine veya kendisine sunulmak üzere 2-3 cümlelik, motive edici ve 
            durum tespitli bir "Gelişim Özeti" yaz.
            `;

            const result = await model.generateContent(prompt);
            aiReport = result.response.text();
        } catch (aiError) {
            console.error("AI Rapor Hatası:", aiError.message);
            aiReport = "Yapay zeka raporu şu an oluşturulamadı.";
        }
    }

    // 5. Sonucu Döndür
    res.status(200).json({ 
      student, 
      analytics: {
          averageScore,
          completedExams: totalExams,
          pendingHomeworks: 0, // Ödev sistemi gelince burası güncellenir
          lastActive: exams.length > 0 ? exams[0].completedAt : student.createdAt,
          recentActivity
      },
      aiReport // Frontend'de göstereceğimiz genel yorum
    });

  } catch (err) {
    console.error("Öğrenci Detay Hatası:", err);
    res.status(500).json({ message: "Detaylar alınamadı.", error: err.message });
  }
};