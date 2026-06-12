require('dotenv').config();
const https = require('https');

const url = process.argv[2];
if (!url) {
  console.error('Usage: node verifyCloudinarySvg.js <url>');
  process.exit(1);
}

https.get(url, (res) => {
  let data = '';
  res.on('data', (c) => { data += c; });
  res.on('end', () => {
    console.log(JSON.stringify({
      status: res.statusCode,
      contentType: res.headers['content-type'],
      startsWithSvg: data.trimStart().startsWith('<svg') || data.includes('<svg'),
      preview: data.slice(0, 120),
    }, null, 2));
  });
}).on('error', (e) => console.error(e.message));
