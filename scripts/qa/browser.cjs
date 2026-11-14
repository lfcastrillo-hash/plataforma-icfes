const fs = require('node:fs');
const { chromium } = require('playwright');
const paths = {
  chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  edge: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
};
async function browser(name = 'chrome') {
  const executablePath = process.env.BROWSER_EXECUTABLE || paths[name];
  return chromium.launch({ ...(fs.existsSync(executablePath || '') ? { executablePath } : {}), headless:true });
}
module.exports = { browser, paths };
