const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { ensureStudentLinkedToTeacher } = require('../utils/studentRosterSync');
const Notification = require('../models/Notification');
const notificationController = require('./notificationController');
const { recordUserActivity } = require('../services/activityLogger');

// ✅ 1. ÖĞRETMENİN ÖDEV OLUŞTUR
exports.createAssignment = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { title, description, subject, dueDate, duration, classLevel } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ message: 'Başlık ve ders zorunludur' });
    }

    const newAssignment = new Assignment({
      title,
      description,
      subject,
      dueDate,
      duration: duration || 60,
      classLevel,
      createdBy: teacherId,
      submissions: []
    });

    await newAssignment.save();

    const teacher = await User.findById(teacherId).select('name email role').lean();
    await recordUserActivity(req, {
      user: teacher,
      action: 'assignment_create',
      category: 'content',
      summary: `Ödev oluşturdu: ${title}`,
      targetType: 'assignment',
      targetId: newAssignment._id,
      targetLabel: title,
    });

    // 📢 Öğrencilere bildirim gönder
    const notifyResult = await notificationController.notifyStudentsForAssignment(newAssignment);
    
    res.status(201).json({ 
      message: 'Ödev oluşturuldu', 
      data: newAssignment,
      notified: notifyResult
    });
  } catch (err) {
    res.status(500).json({ message: 'Ödev oluşturulamadı', error: err.message });
  }
};

// ✅ 2. ÖĞRETMENİN TÜM ÖDEVLERİNİ GETIR (PAGINATION)
exports.getTeacherAssignments = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { page = 1, limit = 10, subject } = req.query;
    const skip = (page - 1) * limit;

    const query = { createdBy: teacherId };
    if (subject && subject !== 'Tümü') query.subject = subject;

    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Assignment.countDocuments(query);

    res.json({
      data: assignments,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ message: 'Ödevler alınamadı', error: err.message });
  }
};

// ✅ 3. ÖĞRENCİNİN ÖDEVLERİNİ GETIR (STUDENT ROLÜ İÇİN)
exports.getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Tüm ödevleri getir (tüm öğretmenler tarafından verilen)
    const assignments = await Assignment.find()
      .sort({ dueDate: 1 }) // En yakın deadline'ı başa al
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    // Her ödev için bu öğrencinin submission'ını kontrol et
    const assignmentsWithStatus = assignments.map(assignment => {
      const submission = assignment.submissions?.find(
        s => s.studentId.toString() === studentId
      );

      return {
        ...assignment.toObject(),
        completed: !!submission,
        submission: submission || null,
        submitted: submission?.submittedAt || null
      };
    });

    const total = await Assignment.countDocuments();

    res.json({
      data: assignmentsWithStatus,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ message: 'Ödevler alınamadı', error: err.message });
  }
};

// ✅ 4. ÖDEV DETAYLARı GETIR
exports.getAssignmentDetails = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId)
      .populate('createdBy', 'name email')
      .populate('submissions.studentId', 'name email');

    if (!assignment) {
      return res.status(404).json({ message: 'Ödev bulunamadı' });
    }

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: 'Ödev detayları alınamadı', error: err.message });
  }
};

// ✅ 5. ÖĞRENCİ ÖDEVI GÖNDERİR
exports.submitAssignment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { assignmentId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'İçerik zorunludur' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Ödev bulunamadı' });
    }

    // Var olan submission'ı kontrol et (güncellemek mi, yeni eklemek mi)
    const existingSubmission = assignment.submissions.find(
      s => s.studentId.toString() === studentId
    );

    if (existingSubmission) {
      // Güncelle
      existingSubmission.content = content;
      existingSubmission.submittedAt = new Date();
    } else {
      // Yeni ekle
      assignment.submissions.push({
        studentId,
        content,
        submittedAt: new Date()
      });
    }

    await assignment.save();

    if (assignment.createdBy) {
      await ensureStudentLinkedToTeacher(assignment.createdBy, studentId);
    }

    const student = await User.findById(studentId).select('name email role').lean();
    await recordUserActivity(req, {
      user: student,
      action: 'assignment_submit',
      category: 'learning',
      summary: `Ödev teslim etti: ${assignment.title}`,
      targetType: 'assignment',
      targetId: assignment._id,
      targetLabel: assignment.title,
    });

    res.json({ message: 'Ödev gönderildi', data: assignment });
  } catch (err) {
    res.status(500).json({ message: 'Ödev gönderilemedi', error: err.message });
  }
};

// ✅ 6. ÖĞRETMEN ÖDEVI NOT VERİR (GRADE & FEEDBACK)
exports.gradeAssignment = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;
    const { grade, feedback } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Ödev bulunamadı' });
    }

    const submission = assignment.submissions.find(
      s => s.studentId.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({ message: 'Submission bulunamadı' });
    }

    submission.grade = grade || submission.grade;
    submission.feedback = feedback || submission.feedback;

    await assignment.save();
    res.json({ message: 'Not verildi', data: assignment });
  } catch (err) {
    res.status(500).json({ message: 'Not verilemedi', error: err.message });
  }
};

// ✅ 7. ÖDEV SİL
exports.deleteAssignment = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Ödev bulunamadı' });
    }

    if (assignment.createdBy.toString() !== teacherId) {
      return res.status(403).json({ message: 'Bu ödevi silmeye izniniz yok' });
    }

    await Assignment.findByIdAndDelete(assignmentId);
    res.json({ message: 'Ödev silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Ödev silinemedi', error: err.message });
  }
};

// ✅ 8. ÖDEV GÜNCELLE (TEACHER ONLY)
exports.updateAssignment = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { assignmentId } = req.params;
    const { title, description, subject, dueDate, duration } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Ödev bulunamadı' });
    }

    if (assignment.createdBy.toString() !== teacherId) {
      return res.status(403).json({ message: 'Bu ödevi güncellemeye izniniz yok' });
    }

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (subject) assignment.subject = subject;
    if (dueDate) assignment.dueDate = dueDate;
    if (duration) assignment.duration = duration;

    await assignment.save();
    res.json({ message: 'Ödev güncellendi', data: assignment });
  } catch (err) {
    res.status(500).json({ message: 'Ödev güncellenemedi', error: err.message });
  }
};
