// backend-express/controllers/classController.js (YENİ DOSYA)

const Class = require('../models/Class');
const User = require('../models/User'); // User modelini dahil et
const Result = require('../models/Result'); // Başarı durumları için Result modelini dahil et
const mongoose = require('mongoose'); // Mongoose'u dahil et

// Basit bir 6 haneli rastgele kod üretici
function generateClassCode() {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * @desc    Yeni bir Sınıf (Şube) oluşturur
 * @route   POST /api/classes
 * @access  Private (Teacher)
 */
const createClass = async (req, res) => {
  try {
    const { name, subject, gradeLevel } = req.body;
    
    if (!name || !subject || !gradeLevel) {
      return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
    }

    // TODO: Benzersiz bir sınıf kodu üret (eğer DB'de varsa tekrar dene)
    const classCode = generateClassCode(); 

    const newClass = new Class({
      name,
      subject,
      gradeLevel,
      classCode,
      createdBy: req.user._id, // 'protect' middleware'inden
      students: []
    });

    const savedClass = await newClass.save();
    res.status(201).json(savedClass);

  } catch (error) {
    console.error('Sınıf oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * @desc    Bir öğretmenin belirli bir seviyedeki sınıflarını listeler
 * @route   GET /api/classes
 * @query   ?gradeLevel=9
 * @access  Private (Teacher)
 */
const getClassesByGrade = async (req, res) => {
  try {
    const gradeLevel = req.query.gradeLevel;
    const query = { createdBy: req.user._id };
    if (gradeLevel) query.gradeLevel = gradeLevel;

    const classes = await Class.find(query).sort({ createdAt: -1 });

    res.status(200).json(classes);

  } catch (error) {
    console.error('Sınıflar listelenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * @desc    Bir Sınıfı (Şubeyi) siler
 * @route   DELETE /api/classes/:id
 * @access  Private (Teacher)
 */
const deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const classToDelete = await Class.findById(classId);

    if (!classToDelete) {
      return res.status(404).json({ message: 'Sınıf bulunamadı.' });
    }

    // Yetkilendirme: Sınıfı silen kişi, onu oluşturan kişi mi?
    if (classToDelete.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu sınıfı silme yetkiniz yok.' });
    }

    await Class.findByIdAndDelete(classId);
    res.status(200).json({ message: 'Sınıf başarıyla silindi.', id: classId });

  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * @desc    Bir Sınıfı (Şubeyi) günceller
 * @route   PUT /api/classes/:id
 * @access  Private (Teacher)
 */
const updateClass = async (req, res) => {
  try {
    const { name, subject, gradeLevel } = req.body;
    const classId = req.params.id;

    const classToUpdate = await Class.findById(classId);

    if (!classToUpdate) {
      return res.status(404).json({ message: 'Sınıf bulunamadı.' });
    }

    // Yetkilendirme: Sınıfı güncelleyen kişi, onu oluşturan kişi mi?
    if (classToUpdate.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu sınıfı güncelleme yetkiniz yok.' });
    }

    // Alanları güncelle
    classToUpdate.name = name || classToUpdate.name;
    classToUpdate.subject = subject || classToUpdate.subject;
    classToUpdate.gradeLevel = gradeLevel || classToUpdate.gradeLevel;

    const updatedClass = await classToUpdate.save();
    res.status(200).json(updatedClass);

  } catch (error) {
    console.error('Sınıf güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * @desc    Bir öğrencinin sınıf kodunu kullanarak sınıfa katılması
 * @route   POST /api/classes/join
 * @access  Private (Student)
 */
const joinClass = async (req, res) => {
  const { classCode } = req.body;
  const studentId = req.user._id;

  if (!classCode) {
    return res.status(400).json({ message: 'Sınıf kodu zorunludur.' });
  }

  try {
    // 1. Sınıf koduna göre sınıfı bul
    const targetClass = await Class.findOne({ classCode });
    if (!targetClass) {
      return res.status(404).json({ message: 'Bu koda sahip bir sınıf bulunamadı.' });
    }

    // 2. Öğrencinin zaten bu sınıfta olup olmadığını kontrol et
    if (targetClass.students.includes(studentId)) {
      return res.status(400).json({ message: 'Zaten bu sınıfa kayıtlısınız.' });
    }

    // 3. Öğrenciyi sınıfın listesine ve öğrencinin profiline ekle
    targetClass.students.push(studentId);
    await targetClass.save();

    await User.findByIdAndUpdate(studentId, { classId: targetClass._id });

    res.status(200).json({ message: `Başarıyla '${targetClass.name}' sınıfına katıldınız.` });

  } catch (error) {
    console.error('Sınıfa katılma hatası:', error);
    res.status(500).json({ message: 'Sınıfa katılırken bir sunucu hatası oluştu.' });
  }
};

/**
 * @desc    Bir sınıftaki öğrencileri ve genel başarı istatistiklerini listeler
 * @route   GET /api/classes/:id/students
 * @access  Private (Teacher)
 */
const getClassStudentsWithStats = async (req, res) => {
  const { id: classId } = req.params;
  const teacherId = req.user._id;

  try {
    // --- OPTİMİZE EDİLMİŞ YAKLAŞIM: Tek Aggregation Sorgusu ---
    // Bu pipeline, sınıfı bulur, öğrencileri ve onların istatistiklerini tek seferde birleştirir.

    const classWithStudentStats = await Class.aggregate([
      // Adım 1: İlgili sınıfı ID'sine göre bul
      { $match: { _id: new mongoose.Types.ObjectId(classId) } },

      // Adım 2: Yetkilendirme kontrolü (sadece sınıfı oluşturan öğretmen görebilir)
      { $match: { createdBy: new mongoose.Types.ObjectId(teacherId) } },

      // Adım 3: 'students' dizisindeki User ID'lerini kullanarak 'users' koleksiyonundan öğrenci bilgilerini çek (populate gibi)
      {
        $lookup: {
          from: 'users', // 'users' koleksiyonu (User modelinin koleksiyon adı)
          localField: 'students',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },

      // Adım 4: 'results' koleksiyonundan her öğrencinin sınav sonuçlarını çek
      {
        $lookup: {
          from: 'results', // 'results' koleksiyonu
          localField: 'students',
          foreignField: 'studentId',
          as: 'studentResults'
        }
      },

      // Adım 5: Çekilen verileri yeniden şekillendirerek son çıktıyı oluştur
      {
        $project: {
          // Sınıf bilgilerini koru
          name: 1,
          classCode: 1,
          // Her öğrenci için istatistikleri hesapla
          students: {
            $map: {
              input: '$studentDetails',
              as: 'student',
              in: {
                _id: '$student._id',
                firstName: '$student.firstName',
                lastName: '$student.lastName',
                email: '$student.email',
                // Bu öğrenciye ait sonuçları filtrele ve istatistikleri hesapla
                completedExams: { $size: { $filter: { input: '$studentResults', cond: { $eq: ['$this.studentId', '$student._id'] } } } },
                averageScore: { $round: [{ $avg: { $filter: { input: '$studentResults', cond: { $eq: ['$this.studentId', '$student._id'] } }.score } }, 0] },
                passedExams: { $size: { $filter: { input: '$studentResults', cond: { $and: [{ $eq: ['$this.studentId', '$student._id'] }, { $eq: ['$this.passed', true] }] } } } }
              }
            }
          }
        }
      }
    ]);

    // Eğer aggregation sonucu boşsa veya sınıf bulunamadıysa
    if (!classWithStudentStats || classWithStudentStats.length === 0) {
      return res.status(404).json({ message: 'Sınıf bulunamadı.' });
    }

    // Aggregation bir dizi döndürür, ilk elemanı alıp içindeki öğrenci listesini gönderiyoruz.
    res.status(200).json(classWithStudentStats[0].students);

  } catch (error) {
    console.error('Sınıf öğrencileri listeleme hatası:', error);
    res.status(500).json({ message: 'Öğrenciler listelenirken bir sunucu hatası oluştu.' });
  }
};

/**
 * @desc    Bir öğrenciyi sınıftan çıkarır
 * @route   DELETE /api/classes/:id/students/:studentId
 * @access  Private (Teacher)
 */
const removeStudentFromClass = async (req, res) => {
  const { id: classId, studentId } = req.params;
  const teacherId = req.user._id;

  try {
    const targetClass = await Class.findById(classId);

    // Sınıf var mı?
    if (!targetClass) {
      return res.status(404).json({ message: 'Sınıf bulunamadı.' });
    }

    // Yetkilendirme: İşlemi yapan öğretmen, sınıfı oluşturan kişi mi?
    if (targetClass.createdBy.toString() !== teacherId.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
    }

    // Öğrenci bu sınıfta mı?
    const studentIndex = targetClass.students.indexOf(studentId);
    if (studentIndex === -1) {
      return res.status(404).json({ message: 'Öğrenci bu sınıfta bulunamadı.' });
    }

    // Öğrenciyi sınıfın 'students' dizisinden çıkar
    targetClass.students.pull(studentId);
    await targetClass.save();

    // Öğrencinin 'classId' alanını temizle
    await User.findByIdAndUpdate(studentId, { $unset: { classId: 1 } });

    res.status(200).json({ message: 'Öğrenci sınıftan başarıyla çıkarıldı.' });

  } catch (error) {
    console.error('Öğrenciyi sınıftan çıkarma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * @desc    Bir öğretmene ait toplam sınıf sayısını verir
 * @route   GET /api/classes/count
 * @access  Private (Teacher)
 */
const getClassesCount = async (req, res) => {
  try {
    const count = await Class.countDocuments({ createdBy: req.user._id });
    res.status(200).json({ count });
  } catch (error) {
    console.error('Sınıf sayısı alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * @desc   Öğretmenin sınıflarını seviye bazında özetler
 * @route  GET /api/classes/summary
 * @access Private (Teacher)
 */
const getClassesSummary = async (req, res) => {
  try {
    const agg = await Class.aggregate([
      { $match: { createdBy: req.user._id } },
      {
        $project: {
          gradeLevel: 1,
          studentCount: { $size: { $ifNull: ['$students', []] } }
        }
      },
      {
        $group: {
          _id: '$gradeLevel',
          classCount: { $sum: 1 },
          studentCount: { $sum: '$studentCount' }
        }
      },
      { $project: { _id: 0, gradeLevel: '$_id', classCount: 1, studentCount: 1 } },
      { $sort: { gradeLevel: 1 } }
    ]);
    res.status(200).json(agg);
  } catch (error) {
    console.error('Sınıf özeti alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  createClass,
  getClassesByGrade,
  deleteClass,
  updateClass,
  joinClass,
  getClassStudentsWithStats,
  removeStudentFromClass,
  getClassesCount
  ,getClassesSummary
};