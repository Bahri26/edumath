// Rol kontrolü için middleware
module.exports = function(requiredRoles = []) {
  return (req, res, next) => {
    if (!req.user || !requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
    }
    next();
  };
};
