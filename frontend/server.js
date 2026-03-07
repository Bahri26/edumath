const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Statik dosyaları sun
app.use(express.static(path.join(__dirname, 'dist')));

// Tüm isteklerde index.html gönder
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend sunucu ${PORT} portunda başlatıldı.`);
});
