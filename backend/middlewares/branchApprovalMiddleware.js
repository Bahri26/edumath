const User = require('../models/User');

module.exports = async function(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Bu işlem için öğretmen rolü gerekli.' });
    }
    const user = await User.findById(req.user.id).select('branch branchApproval');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    if (!user.branch) return res.status(403).json({ message: 'Branş seçimi gerekli.' });
    if (user.branchApproval !== 'approved') {
      return res.status(403).json({ message: 'Branş onayı bekleniyor. Admin onayı sonrası erişebilirsiniz.' });
    }
    // İleride filtrelemek için istek objesine branşı ekleyelim
    req.userBranch = user.branch;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Branş kontrol hatası: ' + err.message });
  }
}
