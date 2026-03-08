// ScamShield AI Popup Script

let currentTab = null;
let scanResult = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];

    if (currentTab) {
      await loadCurrentScan();
    }
  } catch (error) {
    showError('Failed to load current page information');
  }
});

// Load current scan result
async function loadCurrentScan() {
  try {
    // Show loading state
    showLoading();

    // Get cached result or scan current URL
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SCAN_RESULT',
      url: currentTab.url
    });

    if (response.success && response.result) {
      scanResult = response.result;
      showScanResult();
    } else {
      // Scan the URL
      await scanCurrentUrl();
    }
  } catch (error) {
    showError('Failed to scan current page');
  }
}

// Scan current URL
async function scanCurrentUrl() {
  try {
    showLoading();

    const response = await chrome.runtime.sendMessage({
      type: 'SCAN_URL',
      url: currentTab.url
    });

    if (response.success) {
      // Wait a moment for scan to complete
      setTimeout(async () => {
        const resultResponse = await chrome.runtime.sendMessage({
          type: 'GET_SCAN_RESULT',
          url: currentTab.url
        });

        if (resultResponse.success && resultResponse.result) {
          scanResult = resultResponse.result;
          showScanResult();
        } else {
          showNoThreatDetected();
        }
      }, 1000);
    } else {
      showError('Failed to scan URL');
    }
  } catch (error) {
    showError('Failed to scan current page');
  }
}

// Show scan result
function showScanResult() {
  const content = document.getElementById('content');
  
  const riskLevel = scanResult.riskLevel;
  const score = scanResult.scamScore;
  const url = currentTab.url;

  const statusClass = getStatusClass(riskLevel);
  const statusText = getStatusText(riskLevel);

  content.innerHTML = `
    <div class="current-site">
      <div class="site-url">${url}</div>
      <div class="site-status">
        <span>Current Status</span>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
    </div>

    <div class="score-display">
      <div class="score-value">${score}%</div>
      <div class="score-label">Scam Probability</div>
    </div>

    ${scanResult.explanation ? `
      <div class="stats">
        <div class="stat-item">
          <span>Analysis</span>
          <span class="stat-value">${scanResult.explanation}</span>
        </div>
        ${scanResult.flaggedKeywords && scanResult.flaggedKeywords.length > 0 ? `
          <div class="stat-item">
            <span>Suspicious Keywords</span>
            <span class="stat-value">${scanResult.flaggedKeywords.length}</span>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div class="actions">
      ${score >= 60 ? `
        <button class="btn btn-danger" onclick="reportScam()">
          🚨 Report as Scam
        </button>
        <button class="btn btn-secondary" onclick="getMoreInfo()">
          ℹ️ More Information
        </button>
      ` : `
        <button class="btn btn-primary" onclick="scanNewUrl()">
          🔍 Scan Different URL
        </button>
        <button class="btn btn-secondary" onclick="getMoreInfo()">
          ℹ️ View Dashboard
        </button>
      `}
    </div>
  `;
}

// Show no threat detected
function showNoThreatDetected() {
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div class="current-site">
      <div class="site-url">${currentTab.url}</div>
      <div class="site-status">
        <span>Current Status</span>
        <span class="status-badge status-safe">SAFE</span>
      </div>
    </div>

    <div class="score-display">
      <div class="score-value">0%</div>
      <div class="score-label">Scam Probability</div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" onclick="scanNewUrl()">
        🔍 Scan Different URL
      </button>
      <button class="btn btn-secondary" onclick="getMoreInfo()">
        ℹ️ View Dashboard
      </button>
    </div>
  `;
}

// Show loading state
function showLoading() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <div>Analyzing current page...</div>
    </div>
  `;
}

// Show error state
function showError(message) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="error">
      ⚠️ ${message}
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="location.reload()">
        🔄 Try Again
      </button>
      <button class="btn btn-secondary" onclick="scanNewUrl()">
        🔍 Scan Different URL
      </button>
    </div>
  `;
}

// Get status class
function getStatusClass(riskLevel) {
  switch (riskLevel) {
    case 'SCAM':
      return 'status-danger';
    case 'HIGH_RISK':
      return 'status-danger';
    case 'SUSPICIOUS':
      return 'status-warning';
    case 'LOW_RISK':
      return 'status-warning';
    default:
      return 'status-safe';
  }
}

// Get status text
function getStatusText(riskLevel) {
  switch (riskLevel) {
    case 'SCAM':
      return 'DANGEROUS';
    case 'HIGH_RISK':
      return 'HIGH RISK';
    case 'SUSPICIOUS':
      return 'SUSPICIOUS';
    case 'LOW_RISK':
      return 'LOW RISK';
    default:
      return 'SAFE';
  }
}

// Report scam
function reportScam() {
  if (!scanResult) return;

  chrome.runtime.sendMessage({
    type: 'REPORT_SCAM',
    data: {
      message: '',
      url: currentTab.url,
      scamScore: scanResult.scamScore,
      riskLevel: scanResult.riskLevel,
      flaggedKeywords: scanResult.flaggedKeywords || [],
      flaggedUrls: scanResult.flaggedUrls || [],
      explanation: scanResult.explanation,
      messageHash: scanResult.messageHash
    }
  });

  // Show success message
  const content = document.getElementById('content');
  content.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
        Scam Reported Successfully!
      </div>
      <div style="opacity: 0.8; margin-bottom: 24px;">
        Thank you for helping protect the community
      </div>
      <button class="btn btn-primary" onclick="location.reload()">
        🔄 Scan Another Page
      </button>
    </div>
  `;
}

// Get more information
function getMoreInfo() {
  chrome.tabs.create({
    url: 'http://localhost:3000/dashboard'
  });
}

// Scan new URL
function scanNewUrl() {
  const url = prompt('Enter URL to scan:');
  if (url && url.trim()) {
    chrome.tabs.create({ url: url.trim() });
    window.close();
  }
}

// Global functions for onclick handlers
window.reportScam = reportScam;
window.getMoreInfo = getMoreInfo;
window.scanNewUrl = scanNewUrl;
