const { defineConfig, devices } = require('@playwright/test')

const PORT = 8765

module.exports = defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: 'list',

  use: {
    baseURL: `http://localhost:${PORT}/`,
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: `python3 -m http.server ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    stderr: 'ignore',
  },
})
