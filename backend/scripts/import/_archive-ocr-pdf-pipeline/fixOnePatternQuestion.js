require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Question = require('../../models/Question');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });
  await Question.updateOne(
    { classLevel: '6. Sınıf', 'assessmentMeta.sequenceIndex': 12, 'assessmentMeta.importSource': 'pattern-pdf-pack' },
    {
      $set: {
        text: 'Tabloda verilen örüntüde eksik değeri bulunuz. (6. sınıf KTT örüntü sorusu)',
        correctAnswer: '1080',
        solution: '1. Tablodaki artış veya çarpan kuralını belirleyin.\n2. Eksik terimi hesaplayın.\n3. Sonucu şıklarla eşleştirin.',
        options: [
          { text: '900', image: '', imageKey: '', imageProvider: '' },
          { text: '1080', image: '', imageKey: '', imageProvider: '' },
          { text: '1260', image: '', imageKey: '', imageProvider: '' },
          { text: '1440', image: '', imageKey: '', imageProvider: '' },
        ],
      },
    }
  );
  console.log('6. Sınıf #12 güncellendi');
  await mongoose.disconnect();
}

main();
