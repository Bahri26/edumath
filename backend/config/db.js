// config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const defaultDbName = 'Edumath';
    const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || defaultDbName).trim();
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${dbName}`;
    const conn = await mongoose.connect(mongoURI, { dbName });
    
    // Bağlantının başarılı olduğunu konsola yazdır
    console.log(`MongoDB Bağlantısı Başarılı: ${conn.connection.host} adlı sunucuda / DB: ${conn.connection.name}.`);
    
  } catch (error) {
    // Bağlantı hatası durumunda mesajı göster
    console.error(`MongoDB Bağlantı Hatası: ${error.message}`);
    
    // Uygulamayı durdur (Hata kodu 1)
    process.exit(1); 
  }
};

module.exports = connectDB;