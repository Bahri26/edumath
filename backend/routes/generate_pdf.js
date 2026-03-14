const express = require('express');
const router = express.Router();

// POST /api/generate_pdf
// body: { url?: string, html?: string, filename?: string }
router.post('/', async (req, res) => {
  const { url, html, filename = 'export.pdf' } = req.body || {};
  if (!url && !html) return res.status(400).json({ error: 'Provide url or html' });

  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    if (url) {
      await page.goto(url, { waitUntil: 'networkidle2' });
    } else {
      await page.setContent(html, { waitUntil: 'networkidle2' });
    }

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'PDF generation failed', details: err.message });
  }
});

module.exports = router;
