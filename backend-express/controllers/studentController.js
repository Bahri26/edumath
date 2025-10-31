// backend-express/controllers/studentController.js

const Assignment = require('../models/Assignment');
const Result = require('../models/Result'); // Sınavın tamamlanıp tamamlanmadığını kontrol etmek için
const User = require('../models/User'); // Kullanıcı bilgilerine erişim için

// GET /api/student/assignments
// Giriş yapan öğrenciye atanmış aktif sınavları listeler
exports.getAssignedExams = async (req, res) => {
    const studentId = req.user.id; // Token'dan gelen ID
    
    try {
        // Öğrencinin sınıf ID'sini bul (Sadece Class tabanlı atamalar için gerekli)
        const student = await User.findById(studentId).select('classId'); 
        if (!student) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        const studentClassId = student.classId; 
        
        // --- 1. Sınıfa Atanmış Aktif Sınavları Çek ---
        const classAssignments = await Assignment.find({ 
            targetType: 'Class',
            targetId: studentClassId,
            isActive: true
        });

        // --- 2. Bireysel Atanmış Aktif Sınavları Çek ---
        const individualAssignments = await Assignment.find({
            targetType: 'Student',
            targetId: studentId,
            isActive: true
        });

        // --- 3. İki listeyi birleştir ve tekrarları temizle ---
        const allAssignments = [...classAssignments, ...individualAssignments];

        // --- 4. Daha önce tamamlanmış sınavları filtrele ---
        const completedExams = await Result.find({ studentId }).select('examId');
        const completedExamIds = completedExams.map(result => result.examId.toString());

        const activeAssignments = allAssignments.filter(assignment => {
            // Teslim tarihi geçmiş mi kontrolü
            const isDue = new Date(assignment.dueDate) < new Date();
            // Daha önce tamamlanmış mı kontrolü
            const isCompleted = completedExamIds.includes(assignment.examId.toString());
            
            return !isDue && !isCompleted;
        });

        // Sınav başlıklarını ve sürelerini eklemek için populate et
        await Assignment.populate(activeAssignments, {
            path: 'examId', 
            select: 'title duration' 
        });

        res.status(200).json(activeAssignments);

    } catch (error) {
        console.error('Atama listeleme hatası (Öğrenci):', error);
        res.status(500).json({ message: 'Atanan sınavlar listelenirken bir hata oluştu.' });
    }
};