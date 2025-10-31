// backend-express/controllers/assignmentController.js

const Assignment = require('../models/Assignment');
const Exam = require('../models/Exam');

// POST /api/assignments
exports.createAssignment = async (req, res) => {
    const { examId, targetType, targetId, dueDate } = req.body;
    const assignedBy = req.user.id; // Token'dan gelen öğretmen ID'si

    if (!examId || !targetType || !targetId || !dueDate) {
        return res.status(400).json({ message: 'Sınav, hedef tipi, hedef ID ve teslim tarihi zorunludur.' });
    }

    try {
        // Exam'ın varlığını kontrol et
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Atanmaya çalışılan sınav bulunamadı.' });
        }
        
        // Yeni atama objesini oluştur
        const newAssignment = new Assignment({
            examId,
            targetType,
            targetId,
            dueDate,
            assignedBy,
        });

        const assignment = await newAssignment.save();

        res.status(201).json(assignment);

    } catch (error) {
        console.error('Atama oluşturma hatası:', error);
        // Genellikle burada Mongoose validasyon hatası dönebilir
        res.status(500).json({ message: 'Atama oluşturulurken sunucu hatası oluştu.' });
    }
};

// GET /api/assignments
exports.getAssignmentsByTeacher = async (req, res) => {
    const assignedBy = req.user.id;

    try {
        const assignments = await Assignment.find({ assignedBy })
            .populate('examId', 'title duration') // Sınav başlıklarını ve süresini ekle
            .populate('targetId', 'name email') // Öğrenci/Sınıf bilgilerini ekle
            .sort({ dueDate: 1 }); // Teslim tarihine göre sırala

        res.status(200).json(assignments);
        
    } catch (error) {
        console.error('Atama listeleme hatası:', error);
        res.status(500).json({ message: 'Atamalar listelenirken sunucu hatası oluştu.' });
    }
};