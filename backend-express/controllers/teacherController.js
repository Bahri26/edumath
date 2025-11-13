// backend-express/controllers/teacherController.js

const Class = require('../models/Class');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');

// GET /api/teacher/dashboard-stats
// Auth: teacher - Returns comprehensive dashboard statistics
exports.getDashboardStats = async (req, res) => {
  const teacherId = req.user._id || req.user.id;
  
  try {
    // Paralel olarak tüm verileri çek
    const [classes, questions, exams, results] = await Promise.all([
      Class.find({ createdBy: teacherId }),
      Question.find({ createdBy: teacherId }),
      Exam.find({ createdBy: teacherId }),
      Result.find({ exam: { $exists: true } }).populate('exam')
    ]);

    // Öğrenci sayısını hesapla
    const studentSet = new Set();
    classes.forEach(cls => {
      (cls.students || []).forEach(studentId => {
        studentSet.add(studentId.toString());
      });
    });

    // Aktif ve tamamlanmış sınavları ayır
    const activeExams = exams.filter(e => e.isPublished && new Date(e.endDate) > new Date());
    const completedExams = exams.filter(e => !e.isPublished || new Date(e.endDate) <= new Date());

    // Ortalama puanı hesapla
    const validResults = results.filter(r => r.score !== undefined && r.score !== null);
    const avgScore = validResults.length > 0
      ? Math.round(validResults.reduce((sum, r) => sum + r.score, 0) / validResults.length)
      : 0;

    // Son aktiviteleri hazırla (gerçek verilerle)
    const recentActivity = [];
    
    // Son eklenen sorular
    const recentQuestions = questions.slice(-3).reverse();
    recentQuestions.forEach(q => {
      recentActivity.push({
        text: `Yeni soru eklendi: ${q.text?.substring(0, 30)}...`,
        time: getTimeAgo(q.createdAt),
        type: 'question'
      });
    });

    // Son oluşturulan sınavlar
    const recentExams = exams.slice(-2).reverse();
    recentExams.forEach(exam => {
      recentActivity.push({
        text: `Sınav oluşturuldu: ${exam.title}`,
        time: getTimeAgo(exam.createdAt),
        type: 'exam'
      });
    });

    // Yaklaşan sınavlar
    const upcomingExams = exams
      .filter(e => e.isPublished && e.startDate && new Date(e.startDate) > new Date())
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 3)
      .map(exam => ({
        id: exam._id,
        title: exam.title,
        startDate: exam.startDate,
        duration: exam.duration,
        classLevel: exam.classLevel
      }));

    res.json({
      questionCount: questions.length,
      classCount: classes.length,
      studentCount: studentSet.size,
      examCount: exams.length,
      activeExams: activeExams.length,
      completedExams: completedExams.length,
      avgScore,
      recentActivity: recentActivity.slice(0, 5),
      upcomingExams
    });

  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Dashboard istatistikleri alınırken hata oluştu.' });
  }
};

// Yardımcı fonksiyon - Zaman farkı hesapla
function getTimeAgo(date) {
  if (!date) return 'Bilinmiyor';
  
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return `${seconds} saniye önce`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} dakika önce`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
  return `${Math.floor(seconds / 86400)} gün önce`;
}

// GET /api/teacher/students
// Auth: teacher - Returns all students across the teacher's classes
exports.getMyStudents = async (req, res) => {
  const teacherId = req.user._id || req.user.id;
  try {
    const classes = await Class.find({ createdBy: teacherId })
      .populate({ path: 'students', select: 'firstName lastName email' })
      .select('name students gradeLevel');

    console.log(`[getMyStudents] Teacher ${teacherId} has ${classes.length} classes`);

    // Aggregate and de-duplicate students across classes
    const map = new Map();
    classes.forEach(cls => {
      console.log(`[getMyStudents] Class "${cls.name}" has ${cls.students?.length || 0} students`);
      (cls.students || []).forEach(stu => {
        if (!map.has(stu._id.toString())) {
          map.set(stu._id.toString(), {
            id: stu._id,
            firstName: stu.firstName,
            lastName: stu.lastName,
            email: stu.email,
            joinedClass: cls.name,
            classId: cls._id,
            gradeLevel: cls.gradeLevel
          });
        }
      });
    });

    const studentList = Array.from(map.values());
    console.log(`[getMyStudents] Returning ${studentList.length} unique students`);
    res.json(studentList);
  } catch (err) {
    console.error('Öğretmen öğrencileri listelenemedi:', err);
    res.status(500).json({ message: 'Öğrenciler listelenirken bir hata oluştu.' });
  }
};

// POST /api/teacher/seed-demo-data
// Auth: teacher - Seeds demo students and classes for testing
exports.seedDemoData = async (req, res) => {
  const teacherId = req.user._id || req.user.id;
  try {
    // Create demo students
    const demoStudents = [];
    const studentData = [
      { firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet@test.com', gradeLevel: 9 },
      { firstName: 'Ayşe', lastName: 'Demir', email: 'ayse@test.com', gradeLevel: 9 },
      { firstName: 'Mehmet', lastName: 'Kaya', email: 'mehmet@test.com', gradeLevel: 10 },
      { firstName: 'Fatma', lastName: 'Şahin', email: 'fatma@test.com', gradeLevel: 10 },
      { firstName: 'Ali', lastName: 'Çelik', email: 'ali@test.com', gradeLevel: 11 }
    ];

    for (const data of studentData) {
      // Check if student already exists
      let student = await User.findOne({ email: data.email });
      if (!student) {
        student = await User.create({
          ...data,
          password: '123456', // Demo password
          isStudent: true,
          birthDate: new Date('2005-01-01')
        });
      }
      demoStudents.push(student);
    }

    // Create demo classes if they don't exist
    const classData = [
      { name: '9-A', gradeLevel: 9, subject: 'Matematik', studentIndexes: [0, 1] },
      { name: '10-B', gradeLevel: 10, subject: 'Matematik', studentIndexes: [2, 3] },
      { name: '11-C', gradeLevel: 11, subject: 'Matematik', studentIndexes: [4] }
    ];

    const createdClasses = [];
    for (const data of classData) {
      const existingClass = await Class.findOne({ 
        name: data.name, 
        createdBy: teacherId 
      });

      if (!existingClass) {
        const classCode = `TEST${Math.floor(Math.random() * 1000)}`;
        const students = data.studentIndexes.map(idx => demoStudents[idx]._id);
        
        const newClass = await Class.create({
          name: data.name,
          gradeLevel: data.gradeLevel,
          subject: data.subject,
          classCode,
          createdBy: teacherId,
          students
        });
        createdClasses.push(newClass);
      }
    }

    res.json({
      message: 'Demo veriler başarıyla oluşturuldu!',
      studentsCreated: demoStudents.length,
      classesCreated: createdClasses.length
    });
  } catch (err) {
    console.error('Demo veri oluşturma hatası:', err);
    res.status(500).json({ message: 'Demo veriler oluşturulurken hata oluştu.', error: err.message });
  }
};

// POST /api/teacher/students/remove
// Body: { studentId, classId }
// Removes a student from a specific class owned by the logged-in teacher
exports.removeStudentFromClass = async (req, res) => {
  const teacherId = req.user._id || req.user.id;
  const { studentId, classId } = req.body || {};
  if (!studentId || !classId) {
    return res.status(400).json({ message: 'studentId ve classId zorunludur.' });
  }
  try {
    const cls = await Class.findOne({ _id: classId, createdBy: teacherId });
    if (!cls) return res.status(404).json({ message: 'Sınıf bulunamadı.' });
    const before = cls.students.length;
    cls.students = cls.students.filter(s => String(s) !== String(studentId));
    await cls.save();
    return res.json({ message: 'Öğrenci sınıftan çıkarıldı.', removed: before !== cls.students.length });
  } catch (err) {
    console.error('removeStudentFromClass error:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
