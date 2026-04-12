// Veritabanı test scripti - Öğretmen ve öğrenci ilişkisini test etmek için
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Survey = require('../models/Survey');
const Question = require('../models/Question');

const testTeacherStudentRelation = async () => {
  try {
    // Bağlan
    await mongoose.connect('mongodb://localhost:27017/edumath');

    console.log('✅ Veritabanına bağlandı');

    // 1. Öğretmen kontrolü
    const teachers = await User.find({ role: 'teacher' }).select('_id name email');
    console.log('\n📚 Kayıtlı Öğretmenler:', teachers.length);
    teachers.forEach(t => console.log(`  - ${t.name} (${t.email})`));

    if (teachers.length === 0) {
      console.log('\n⚠️  Hiç öğretmen bulunamadı!');
      return;
    }

    const firstTeacher = teachers[0];
    console.log(`\n🔍 "${firstTeacher.name}" için kontroller:\n`);

    // 2. Bu öğretmenin öğrencilerini kontrol et
    const students = await Student.find({ teacherId: firstTeacher._id })
      .populate('userId', 'name email');
    console.log(`👥 Toplam Öğrenci: ${students.length}`);
    if (students.length > 0) {
      students.forEach(s => {
        console.log(`  - ${s.userId?.name} (${s.grade})`);
      });
    } else {
      console.log('  ⚠️  Bu öğretmenin hiç öğrencisi yok!');
      
      // Öğrenci kullanıcılarını bul
      const studentUsers = await User.find({ role: 'student' }).limit(5);
      console.log(`\n💡 Sistemde ${studentUsers.length} öğrenci kullanıcı var.`);
      console.log('   Student tablosuna eklemek için bu öğrencileri kullanabilirsiniz.\n');
      
      if (studentUsers.length > 0) {
        console.log('Örnek ekle komutu:');
        console.log(`Student.create({`);
        console.log(`  userId: "${studentUsers[0]._id}",`);
        console.log(`  teacherId: "${firstTeacher._id}",`);
        console.log(`  grade: "10. Sınıf",`);
        console.log(`  schoolNumber: "12345"`);
        console.log(`});`);
      }
    }

    // 3. Sorular
    const questions = await Question.countDocuments({ createdBy: firstTeacher._id });
    console.log(`\n❓ Toplam Sorular: ${questions}`);

    // 4. Anketler
    const surveys = await Survey.countDocuments({ createdBy: firstTeacher._id });
    console.log(`📋 Toplam Anketler: ${surveys}`);

    // 5. Tüm öğrenci kullanıcıları
    console.log('\n\n👤 Tüm Öğrenci Kullanıcıları:');
    const allStudents = await User.find({ role: 'student' }).select('_id name email');
    console.log(`Toplam: ${allStudents.length}`);
    allStudents.slice(0, 5).forEach(s => console.log(`  - ${s.name} (${s.email})`));

    // 6. Student tablosundaki tüm kayıtlar
    console.log('\n\n📊 Student Tablosundaki Tüm İlişkiler:');
    const allStudentRecords = await Student.find()
      .populate('userId', 'name')
      .populate('teacherId', 'name');
    console.log(`Toplam: ${allStudentRecords.length}`);
    allStudentRecords.forEach(s => {
      console.log(`  - ${s.userId?.name} → ${s.teacherId?.name}`);
    });

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Bağlantı kapatıldı');
  }
};

testTeacherStudentRelation();
