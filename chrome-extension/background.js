// ScamShield AI Background Service Worker

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Cache for scanned URLs to avoid repeated API calls
const urlCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Listen for tab updates to scan URLs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    scanUrl(tab.url, tabId);
  }
});

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url && tab.url !== 'chrome://newtab/') {
    scanUrl(tab.url, tab.id);
  }
});

// Scan URL for scam detection
async function scanUrl(url, tabId) {
  try {
    // Check cache first
    const cached = urlCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (cached.result.scamScore >= 60) {
        showWarning(tabId, cached.result, url);
      }
      return;
    }

    // Call API to scan URL
    const response = await fetch(`${API_BASE_URL}/scam/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '',
        url: url
      })
    });

    const result = await response.json();
    
    // Cache the result
    urlCache.set(url, {
      result: result,
      timestamp: Date.now()
    });

    // Show warning if high risk
    if (result.scamScore >= 60) {
      showWarning(tabId, result, url);
    }

    // Update badge
    updateBadge(tabId, result.scamScore);

  } catch (error) {
    console.error('Failed to scan URL:', error);
  }
}

// Show warning popup
function showWarning(tabId, result, url) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['warning-inject.js']
  }, () => {
    // Send warning data to content script
    chrome.tabs.sendMessage(tabId, {
      type: 'SCAM_WARNING',
      data: {
        result: result,
        url: url
      }
    });
  });
}

// Update extension badge
function updateBadge(tabId, score) {
  let color = '#22c55e'; // green
  let text = '';
  
  if (score >= 80) {
    color = '#ef4444'; // red
    text = '!';
  } else if (score >= 60) {
    color = '#f59e0b'; // orange
    text = '?';
  } else if (score >= 40) {
    color = '#eab308'; // yellow
    text = '⚠';
  }

  chrome.action.setBadgeText({ text: text, tabId: tabId });
  chrome.action.setBadgeBackgroundColor({ color: color, tabId: tabId });
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'SCAN_URL':
      scanUrl(request.url, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    case 'GET_SCAN_RESULT':
      const cached = urlCache.get(request.url);
      sendResponse({ 
        success: true, 
        result: cached ? cached.result : null 
      });
      break;
      
    case 'REPORT_SCAM':
      reportScam(request.data, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open for async response
});

// Report scam to backend
async function reportScam(data, tabId) {
  try {
    const response = await fetch(`${API_BASE_URL}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        reporterAddress: '0x0000000000000000000000000000000000000000' // Mock address
      })
    });

    const result = await response.json();
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ScamShield AI',
      message: 'Scam reported successfully!'
    });

  } catch (error) {
    console.error('Failed to report scam:', error);
  }
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [url, data] of urlCache.entries()) {
    if (now - data.timestamp > CACHE_DURATION) {
      urlCache.delete(url);
    }
  }
}, CACHE_DURATION);

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('ScamShield AI extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    enabled: true,
    showWarnings: true,
    autoScan: true
  });
});
