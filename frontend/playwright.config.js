const config = {
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 }
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
};

module.exports = config;
