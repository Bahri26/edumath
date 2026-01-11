// Backend route'larını test et
const surveyRoutes = require('../routes/surveyRoutes');

console.log('📋 Survey Routes Testi:\n');
console.log('surveyRoutes tipi:', typeof surveyRoutes);
console.log('surveyRoutes.stack uzunluğu:', surveyRoutes?.stack?.length);

if (surveyRoutes && surveyRoutes.stack) {
  console.log('\n✅ Route\'lar yüklendi:\n');
  
  surveyRoutes.stack.forEach((layer, i) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
      const path = layer.route.path;
      console.log(`  ${i+1}. ${methods.padEnd(10)} /api/surveys${path}`);
    }
  });
  
  console.log(`\n✅ Toplam ${surveyRoutes.stack.filter(l => l.route).length} route bulundu`);
} else {
  console.log('❌ Route\'lar yüklenemedi!');
}
