// Student tablosunu temizle ve yeniden oluştur
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const resetAndSeedStudents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB\'ye bağlandı\n');

    // 1. Mevcut Student kayıtlarını göster
    const existingStudents = await Student.find();
    console.log(`📊 Mevcut Student Kayıtları: ${existingStudents.length}`);
    
    // 2. Tümünü sil
    await Student.deleteMany({});
    console.log('🗑️  Tüm Student kayıtları silindi\n');

    // 3. Index'leri yeniden oluştur
    await Student.collection.dropIndexes();
    await Student.createIndexes();
    console.log('🔄 Index\'ler yeniden oluşturuldu\n');

    // 4. Öğretmen ve öğrencileri bul
    const teachers = await User.find({ role: 'teacher' });
    const studentUsers = await User.find({ role: 'student' });

    console.log(`👨‍🏫 Öğretmen: ${teachers.length}`);
    console.log(`👨‍🎓 Öğrenci Kullanıcı: ${studentUsers.length}\n`);

    if (teachers.length === 0 || studentUsers.length === 0) {
      console.log('❌ Yetersiz kullanıcı!');
      return;
    }

    // 5. Her öğretmene 8'er öğrenci ekle
    for (const teacher of teachers) {
      console.log(`\n📝 ${teacher.name} için öğrenciler ekleniyor...`);

      const numToAdd = Math.min(8, studentUsers.length);
      const selected = studentUsers.slice(0, numToAdd);

      let addedCount = 0;
      for (const studentUser of selected) {
        try {
          await Student.create({
            userId: studentUser._id,
            teacherId: teacher._id,
            grade: studentUser.grade || ['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf'][Math.floor(Math.random() * 4)],
            schoolNumber: (1000 + addedCount).toString(),
            averageScore: Math.floor(Math.random() * 40 + 60)
          });
          addedCount++;
          console.log(`  ✅ ${studentUser.name}`);
        } catch (err) {
          console.log(`  ❌ ${studentUser.name}: ${err.message}`);
        }
      }

      console.log(`  ✅ Toplam ${addedCount} öğrenci eklendi`);
    }

    // 6. Sonuç
    console.log('\n\n📊 SONUÇ:');
    const finalCount = await Student.countDocuments();
    console.log(`✅ Toplam Student kaydı: ${finalCount}`);

    for (const teacher of teachers) {
      const count = await Student.countDocuments({ teacherId: teacher._id });
      console.log(`  ${teacher.name}: ${count} öğrenci`);
    }

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
};

resetAndSeedStudents();
