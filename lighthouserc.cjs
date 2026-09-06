const fs = require('fs');

if (!process.env.CHROME_PATH) {
  const winChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const winEdge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(winChrome)) {
    process.env.CHROME_PATH = winChrome;
  } else if (fs.existsSync(winEdge)) {
    process.env.CHROME_PATH = winEdge;
  }
}

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      isSinglePageApplication: true,
      numberOfRuns: 1,
      puppeteerScript: 'scripts/lhci-auth.cjs',
      puppeteerLaunchOptions: {
        args: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--no-zygote',
        ],
      },
      settings: {
        preset: 'desktop',
        throttlingMethod: 'provided',
        skipAudits: [
          'uses-http2',
          'is-on-https',
          'service-worker',
          'splash-screen',
          'themed-omnibox',
        ],
      },
      url: [
        'http://localhost/login',
        'http://localhost/home',
        'http://localhost/dashboard',
        'http://localhost/generator',
        'http://localhost/study',
        'http://localhost/simulation-study',
        'http://localhost/deck/demo-deck',
        'http://localhost/help',
        'http://localhost/calendar',
        'http://localhost/statistics',
        'http://localhost/simulations',
        'http://localhost/simulation/demo-sim',
        'http://localhost/topicogram',
      ],
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
