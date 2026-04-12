const adminRoutes = require('../routes/adminRoutes');

console.log('📋 Admin Routes');
if (adminRoutes && adminRoutes.stack) {
  adminRoutes.stack.forEach((layer, i) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
      console.log(`${i+1}. ${methods.padEnd(10)} /api/admin${layer.route.path}`);
    }
  });
  const count = adminRoutes.stack.filter(l => l.route).length;
  console.log(`\n✅ Toplam ${count} admin route bulundu`);
} else {
  console.log('❌ adminRoutes has no stack (did not export an express router?)');
}
