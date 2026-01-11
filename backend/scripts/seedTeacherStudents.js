// Backend'de öğrenci-öğretmen ilişkisi oluşturma scripti
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const dotenv = require('dotenv');

dotenv.config();

const seedTeacherStudents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB\'ye bağlandı\n');

    // 1. Tüm öğretmenleri bul
    const teachers = await User.find({ role: 'teacher' });
    console.log(`👨‍🏫 Toplam Öğretmen: ${teachers.length}`);

    if (teachers.length === 0) {
      console.log('❌ Hiç öğretmen bulunamadı!');
      return;
    }

    // 2. Tüm öğrenci kullanıcılarını bul
    const studentUsers = await User.find({ role: 'student' });
    console.log(`👨‍🎓 Toplam Öğrenci Kullanıcı: ${studentUsers.length}\n`);

    if (studentUsers.length === 0) {
      console.log('❌ Hiç öğrenci kullanıcısı bulunamadı!');
      return;
    }

    // 3. Her öğretmen için rastgele öğrenciler ata
    for (const teacher of teachers) {
      console.log(`\n🔄 ${teacher.name} için öğrenciler ekleniyor...`);

      // Bu öğretmenin mevcut öğrencilerini kontrol et
      const existingStudents = await Student.find({ teacherId: teacher._id });
      console.log(`  Mevcut öğrenci sayısı: ${existingStudents.length}`);

      // Hedef: En az 5 öğrenci olmalı
      const targetCount = 8;
      if (existingStudents.length >= targetCount) {
        console.log(`  ✅ Yeterli öğrenci var (${existingStudents.length}/${targetCount}), atlıyorum...`);
        continue;
      }

      const neededCount = targetCount - existingStudents.length;
      console.log(`  📝 ${neededCount} öğrenci daha eklenecek...`);

      // Henüz bu öğretmene eklenmemiş öğrencileri bul
      const existingUserIds = existingStudents.map(s => s.userId.toString());
      const availableStudents = studentUsers.filter(
        su => !existingUserIds.includes(su._id.toString())
      );

      if (availableStudents.length === 0) {
        console.log('  ⚠️  Eklenecek başka öğrenci kalmadı');
        continue;
      }

      // Rastgele seç
      const numToAdd = Math.min(neededCount, availableStudents.length);
      const selectedStudents = availableStudents
        .sort(() => Math.random() - 0.5)
        .slice(0, numToAdd);

      // Öğrencileri ekle
      let addedCount = 0;
      for (const studentUser of selectedStudents) {
        try {
          // Zaten bu ilişki var mı kontrol et
          const exists = await Student.findOne({
            userId: studentUser._id,
            teacherId: teacher._id
          });

          if (exists) {
            console.log(`    ⏭️  ${studentUser.name} zaten ekli`);
            continue;
          }

          await Student.create({
            userId: studentUser._id,
            teacherId: teacher._id,
            grade: studentUser.grade || '10. Sınıf',
            schoolNumber: Math.floor(Math.random() * 9000 + 1000).toString(),
            averageScore: Math.floor(Math.random() * 40 + 60) // 60-100 arası
          });

          addedCount++;
          console.log(`    ✅ ${studentUser.name} eklendi`);
        } catch (err) {
          if (err.code === 11000) {
            console.log(`    ⚠️  ${studentUser.name} zaten ekli (unique constraint)`);
          } else {
            console.log(`    ❌ Hata: ${err.message}`);
          }
        }
      }

      console.log(`  ✅ ${addedCount} yeni öğrenci eklendi`);
    }

    // 4. Özet istatistik
    console.log('\n\n📊 ÖZET İSTATİSTİK:');
    for (const teacher of teachers) {
      const count = await Student.countDocuments({ teacherId: teacher._id });
      console.log(`  ${teacher.name}: ${count} öğrenci`);
    }

    console.log('\n✅ İşlem tamamlandı!');
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
};

seedTeacherStudents();
