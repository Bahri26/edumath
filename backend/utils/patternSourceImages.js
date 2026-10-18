const path = require('path');
const SOURCE_ROOT = path.resolve(__dirname, '../data/pattern-pdf-import');
function registerPatternSourceImages(app) {
  app.get('/uploads/pattern-pdf-source/:grade/:file', (req, res) => {
    const { grade, file } = req.params;
    if (!/^(5|6|7|9)-sinif$/.test(grade) || !/^source-p\d+-q\d+\.png$/.test(file)) return res.sendStatus(404);
    res.set('Cache-Control', 'public, max-age=3600');
    return res.sendFile(path.join(SOURCE_ROOT, grade, file), {dotfiles:'deny'});
  });
}
module.exports={registerPatternSourceImages};
