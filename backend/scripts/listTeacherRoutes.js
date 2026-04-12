const teacherRoutes = require('../routes/teacherRoutes');

console.log('📋 Teacher Routes');
if (teacherRoutes && teacherRoutes.stack) {
  teacherRoutes.stack.forEach((layer, i) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
      console.log(`${i+1}. ${methods.padEnd(10)} /api/teacher${layer.route.path}`);
    }
  });
} else {
  console.log('❌ teacherRoutes has no stack (did not export an express router?)');
}
