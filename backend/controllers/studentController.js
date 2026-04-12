const Student = require('../models/Student');
const User = require('../models/User');

// 1. ÖĞRETMENİN LİSTESİNİ GETİR
exports.getMyStudents = async (req, res) => {
  try {

    // DEBUG: Log the user object from the token
    console.log('User object from token:', req.user);


    // Token'dan öğretmen id'sini al
    const teacherId = req.user?.id || req.user?._id;
    if (!teacherId) {
      return res.status(401).json({ message: 'Authentication required: Could not find user ID in token.' });
    }

    // teacherId'yi ObjectId'ye zorla (her zaman doğru tip)
    const mongoose = require('mongoose');
    let teacherObjectId;
    try {
      teacherObjectId = mongoose.Types.ObjectId(teacherId);
    } catch (e) {
      return res.status(400).json({ message: 'Geçersiz öğretmen ID formatı.' });
    }

    const students = await Student.find({ teacherId: teacherObjectId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(students);

  } catch (err) {
    console.error("Backend Hatası:", err); // Terminale hatayı yazdır
    res.status(500).json({ message: "Liste getirilemedi.", error: err.message });
  }
};

// 2. ÖĞRENCİ DETAYI VE ANALİZİ (Karne)
exports.getStudentDetails = async (req, res) => {
  try {
    const { id } = req.params; // Student tablosundaki ID

    const student = await Student.findById(id).populate('userId', 'name email avatar bio phone');
    
    if (!student) {
      return res.status(404).json({ message: "Öğrenci bulunamadı." });
    }

    // --- BURASI İLERİDE 'ExamResult' TABLOSUNDAN GELECEK ---
    // Şimdilik öğretmenin arayüzünü doldurmak için "Mock Data" (Örnek Veri) dönüyoruz.
    const analytics = {
      averageScore: 78,
      completedExams: 12,
      pendingHomeworks: 2,
      lastActive: new Date(),
      recentActivity: [
        { type: 'exam', title: 'Türev Tarama', score: 85, date: '2023-10-05' },
        { type: 'exam', title: 'Limit', score: 60, date: '2023-09-28' },
        { type: 'homework', title: 'Trigonometri Alıştırma', status: 'Tamamlandı', date: '2023-09-20' }
      ]
    };

    res.status(200).json({ 
      student, 
      analytics 
    });

  } catch (err) {
    res.status(500).json({ message: "Detaylar alınamadı.", error: err.message });
  }
};