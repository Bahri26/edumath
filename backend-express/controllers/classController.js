// backend-express/controllers/classController.js (YENİ DOSYA)

const Class = require('../models/Class');

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
    if (!gradeLevel) {
      return res.status(400).json({ message: 'Sınıf seviyesi (gradeLevel) sorgusu gerekli.' });
    }

    const classes = await Class.find({
      createdBy: req.user._id,
      gradeLevel: gradeLevel
    }).sort({ createdAt: -1 });

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

// TODO: updateClass fonksiyonu da eklenebilir

module.exports = {
  createClass,
  getClassesByGrade,
  deleteClass
};