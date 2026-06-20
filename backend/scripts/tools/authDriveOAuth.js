require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { authorizeInteractive } = require('../services/storage/driveOAuth');

authorizeInteractive()
  .then(() => {
    console.log('\nSonraki adım: npm run verify:drive');
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
