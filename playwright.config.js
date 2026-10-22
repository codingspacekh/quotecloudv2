// Settings for the tests in tests/ (run them with: npm test)
const { defineConfig, devices } = require('@playwright/test')

const PORT = 8765

module.exports = defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: 'list',

  use: {
    baseURL: `http://localhost:${PORT}/`,
    // the service worker would answer with saved copies instead of the pretend API (tests/fake-api.js)
    serviceWorkers: 'block',
    // scrolling jumps straight away, so the tests don't wait for animations
    reducedMotion: 'reduce',
    colorScheme: 'light',
    // when a test fails, keep a recording of it (open with: npx playwright show-trace)
    trace: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // the same small server as in the README, started before the tests
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    // the server prints every file it sends, that's too much next to the test results
    stderr: 'ignore',
  },
})
