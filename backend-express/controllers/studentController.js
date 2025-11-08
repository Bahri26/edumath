// backend-express/controllers/studentController.js (İYİLEŞTİRİLMİŞ)

const Assignment = require('../models/Assignment');
const Result = require('../models/Result');
const User = require('../models/User');

// GET /api/student/assignments
// Giriş yapan öğrenciye atanmış aktif sınavları listeler
exports.getAssignedExams = async (req, res) => {
    const studentId = req.user.id;
    
    try {
        // Öğrencinin sınıf ID'sini bul
        const student = await User.findById(studentId).select('classId'); 
        if (!student) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        
        const studentClassId = student.classId;
        const now = new Date();
        
        // --- 1. Tüm aktif atamaları çek (sınıf + bireysel) ---
        const assignments = await Assignment.find({
            $or: [
                { targetType: 'Class', targetId: studentClassId },
                { targetType: 'Student', targetId: studentId }
            ],
            isActive: true,
            dueDate: { $gte: now } // ✅ Sadece tarihi GEÇMEMİŞ sınavlar
        }).populate({
            path: 'examId',
            select: 'title duration questions' // ✅ questions array'i de dahil edildi
        });

        // --- 2. Tamamlanmış sınavları bul ---
        const completedResults = await Result.find({ 
            studentId,
            isSubmitted: true // Sadece submit edilmiş sonuçlar
        }).select('examId');
        
        const completedExamIds = new Set(
            completedResults.map(r => r.examId.toString())
        );

        // --- 3. Tamamlanmamış sınavları filtrele + Tekrar eden atamaları temizle ---
        const uniqueAssignments = new Map();
        
        assignments.forEach(assignment => {
            const examId = assignment.examId?._id.toString();
            
            // Sınav tamamlanmamış ve daha önce eklenmediyse
            if (examId && !completedExamIds.has(examId) && !uniqueAssignments.has(examId)) {
                uniqueAssignments.set(examId, {
                    _id: assignment._id,
                    examId: assignment.examId,
                    dueDate: assignment.dueDate,
                    targetType: assignment.targetType,
                    assignedBy: assignment.assignedBy
                });
            }
        });

        // Map'i array'e çevir
        const activeAssignments = Array.from(uniqueAssignments.values());

        // --- 4. Her sınav için ek bilgiler ekle ---
        const enrichedAssignments = activeAssignments.map(assignment => ({
            ...assignment,
            questionCount: assignment.examId?.questions?.length || 0,
            timeRemaining: calculateTimeRemaining(assignment.dueDate),
            status: 'pending' // not_started, in_progress olabilir
        }));

        res.status(200).json(enrichedAssignments);

    } catch (error) {
        console.error('Atama listeleme hatası:', error);
        res.status(500).json({ 
            message: 'Atanan sınavlar listelenirken bir hata oluştu.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Yardımcı fonksiyon: Kalan süreyi hesapla
function calculateTimeRemaining(dueDate) {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due - now;
    
    if (diffMs <= 0) return { expired: true };
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, expired: false };
}