const pdfParse = require('pdf-parse');
const fs = require('fs');

exports.extractQuestionsFromPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF dosyası gerekli.' });
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    // TODO: Burada PDF'den soruları ayrıştırma işlemini yapın
    // Şimdilik her satırı bir "soru" olarak dönüyoruz (örnek)
    const questions = data.text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => ({ text: line }));
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: 'PDF analiz edilemedi.' });
  }
};
