// Mevcut Student kayıtlarını kontrol et
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkStudents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB\'ye bağlandı\n');

    // Tüm Student kayıtlarını getir
    const students = await Student.find()
      .populate('userId', 'name email role')
      .populate('teacherId', 'name email role');

    console.log(`📊 Toplam Student Kaydı: ${students.length}\n`);

    if (students.length === 0) {
      console.log('❌ Hiç Student kaydı bulunamadı!\n');
      
      // Kullanıcıları göster
      const teachers = await User.find({ role: 'teacher' }).select('name email');
      const studentUsers = await User.find({ role: 'student' }).select('name email');
      
      console.log(`👨‍🏫 Öğretmenler (${teachers.length}):`);
      teachers.forEach(t => console.log(`  - ${t.name} (${t.email})`));
      
      console.log(`\n👨‍🎓 Öğrenci Kullanıcılar (${studentUsers.length}):`);
      studentUsers.forEach(s => console.log(`  - ${s.name} (${s.email})`));
      
    } else {
      console.log('Student Kayıtları:\n');
      students.forEach((s, i) => {
        console.log(`${i+1}. ${s.userId?.name} (${s.userId?.role})`);
        console.log(`   → Öğretmen: ${s.teacherId?.name} (${s.teacherId?.role})`);
        console.log(`   → Sınıf: ${s.grade}, Ortalama: ${s.averageScore}\n`);
      });

      // Öğretmen bazında grupla
      const byTeacher = {};
      students.forEach(s => {
        const teacherName = s.teacherId?.name || 'Bilinmiyor';
        if (!byTeacher[teacherName]) byTeacher[teacherName] = [];
        byTeacher[teacherName].push(s.userId?.name || 'Bilinmiyor');
      });

      console.log('\n📚 Öğretmen Bazında Öğrenci Dağılımı:');
      for (const [teacher, studentList] of Object.entries(byTeacher)) {
        console.log(`\n${teacher}: ${studentList.length} öğrenci`);
        studentList.forEach(st => console.log(`  - ${st}`));
      }
    }

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n\n🔌 MongoDB bağlantısı kapatıldı');
  }
};

checkStudents();
