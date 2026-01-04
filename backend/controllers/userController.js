const User = require('../models/User');

// 1. ÖĞRENCİ ARA (İsim veya E-posta ile)
exports.searchStudents = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const users = await User.find({
      role: 'student', // Sadece öğrencileri ara
      $or: [
        { name: { $regex: query, $options: 'i' } }, // İsme göre (büyük/küçük harf duyarsız)
        { email: { $regex: query, $options: 'i' } } // Maile göre
      ]
    }).select('name email grade avatar'); // Şifreyi gönderme!

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. PROFİL BİLGİLERİNİ GETİR (GET /api/users/profile)
exports.getProfile = async (req, res) => {
  try {
    // req.user.id -> Auth Middleware'den geliyor
    const user = await User.findById(req.user.id).select('-password'); 
    
    if (!user) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. PROFİLİ GÜNCELLE (PUT /api/users/profile)
exports.updateProfile = async (req, res) => {
  try {
    console.log('✅ updateProfile çağrıldı');
    console.log('🔐 req.user:', req.user); // Debug: token'dan gelen user info
    console.log('📤 req.body:', req.body); // Debug: frontend'den gelen veriler
    
    // Frontend'den gelen tüm olası verileri al
    const { name, email, branch, grade, avatar, theme, language, notifications } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    // Ortak alanları güncelle (Boş gelirse eskisini koru)
    user.name = name || user.name;
    user.email = email || user.email;
    if (typeof avatar !== 'undefined') user.avatar = avatar;
    if (typeof theme !== 'undefined') user.theme = theme;
    if (typeof language !== 'undefined') user.language = language;
    if (typeof notifications !== 'undefined') user.notifications = notifications;

    // ROL BAZLI GÜNCELLEME
    if (user.role === 'teacher') {
        user.branch = branch || user.branch;
    } 
    else if (user.role === 'student') {
        user.grade = grade || user.grade;
    }

    const savedUser = await user.save().catch(err => {
      console.error('❌ Save error:', err);
      throw err;
    });
    // Güncel halini geri dön (Şifre hariç)
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json({ message: "Profil başarıyla güncellendi", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Güncelleme hatası: " + err.message });
  }
};

// Şifre değiştirme
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: "Eski ve yeni şifre gereklidir" });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    // Şifre kontrolü
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(400).json({ message: "Eski şifre yanlış" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "Şifre başarıyla değiştirildi" });
  } catch (err) {
    res.status(500).json({ message: "Şifre değiştirme hatası: " + err.message });
  }
};

// İsim veya Email ile kullanıcı ara
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query; // ?query=ahmet
    if (!query) return res.json([]);

    const users = await User.find({
      role: 'student', // Sadece öğrencileri ara
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name email avatar grade'); // Sadece gerekli alanlar

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Arama hatası" });
  }
};