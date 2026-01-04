// config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MONGO_URI, .env dosyasından process.env ile okunur
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // Bağlantının başarılı olduğunu konsola yazdır
    console.log(`MongoDB Bağlantısı Başarılı: ${conn.connection.host} adlı sunucuda.`);
    
  } catch (error) {
    // Bağlantı hatası durumunda mesajı göster
    console.error(`MongoDB Bağlantı Hatası: ${error.message}`);
    
    // Uygulamayı durdur (Hata kodu 1)
    process.exit(1); 
  }
};

module.exports = connectDB;