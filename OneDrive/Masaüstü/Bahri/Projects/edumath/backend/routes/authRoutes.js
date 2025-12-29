const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // User modelini çağırıyoruz

const JWT_SECRET = process.env.JWT_SECRET || "gizli_anahtar_123";

// --- KAYIT OL ---
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, grade } = req.body;

    // Email kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Bu e-posta zaten kayıtlı." });
    }

    // Şifreleme
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Kayıt
    const newUser = new User({
      name, email, password: hashedPassword, role, grade
    });
    await newUser.save();

    res.status(201).json({ message: "Kayıt Başarılı" });
  } catch (error) {
    console.error("Register Hatası:", error); // Terminalde hatayı gösterir
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
});

// --- GİRİŞ YAP ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Şifre hatalı." });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login Hatası:", error);
    res.status(500).json({ message: "Giriş hatası: " + error.message });
  }
});

module.exports = router;