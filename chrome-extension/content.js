// ScamShield AI Content Script

let warningOverlay = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SCAM_WARNING') {
    showScamWarning(request.data.result, request.data.url);
    sendResponse({ success: true });
  }
});

// Show scam warning overlay
function showScamWarning(result, url) {
  // Remove existing warning if present
  if (warningOverlay) {
    warningOverlay.remove();
  }

  // Create warning overlay
  warningOverlay = document.createElement('div');
  warningOverlay.id = 'scamshield-warning';
  warningOverlay.innerHTML = `
    <style>
      #scamshield-warning {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      #scamshield-warning .warning-container {
        background: white;
        border-radius: 12px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      
      #scamshield-warning .warning-icon {
        width: 64px;
        height: 64px;
        background: #ef4444;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      }
      
      #scamshield-warning .warning-title {
        font-size: 24px;
        font-weight: bold;
        color: #1f2937;
        margin-bottom: 12px;
      }
      
      #scamshield-warning .warning-score {
        font-size: 36px;
        font-weight: bold;
        color: #ef4444;
        margin-bottom: 12px;
      }
      
      #scamshield-warning .warning-description {
        color: #6b7280;
        margin-bottom: 20px;
        line-height: 1.5;
      }
      
      #scamshield-warning .warning-url {
        background: #f3f4f6;
        padding: 12px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        word-break: break-all;
        margin-bottom: 24px;
        color: #374151;
      }
      
      #scamshield-warning .warning-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      
      #scamshield-warning .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      #scamshield-warning .btn-danger {
        background: #ef4444;
        color: white;
      }
      
      #scamshield-warning .btn-danger:hover {
        background: #dc2626;
      }
      
      #scamshield-warning .btn-secondary {
        background: #6b7280;
        color: white;
      }
      
      #scamshield-warning .btn-secondary:hover {
        background: #4b5563;
      }
      
      #scamshield-warning .btn-safe {
        background: #22c55e;
        color: white;
      }
      
      #scamshield-warning .btn-safe:hover {
        background: #16a34a;
      }
    </style>
    
    <div class="warning-container">
      <div class="warning-icon">
        <svg width="32" height="32" fill="white" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
      </div>
      
      <div class="warning-title">⚠️ Potential Scam Detected</div>
      <div class="warning-score">${result.scamScore}% Risk Score</div>
      <div class="warning-description">
        ${result.explanation || 'This website shows characteristics commonly associated with scams and phishing attempts.'}
      </div>
      
      <div class="warning-url">${url}</div>
      
      <div class="warning-buttons">
        <button class="btn btn-danger" id="report-scam">Report Scam</button>
        <button class="btn btn-secondary" id="close-warning">I Understand</button>
        <button class="btn btn-safe" id="proceed-anyway">Proceed Anyway</button>
      </div>
    </div>
  `;

  document.body.appendChild(warningOverlay);

  // Add event listeners
  document.getElementById('report-scam').addEventListener('click', () => {
    reportScam(result, url);
    removeWarning();
  });

  document.getElementById('close-warning').addEventListener('click', () => {
    removeWarning();
    window.history.back();
  });

  document.getElementById('proceed-anyway').addEventListener('click', () => {
    removeWarning();
  });

  // Close on escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      removeWarning();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// Remove warning overlay
function removeWarning() {
  if (warningOverlay) {
    warningOverlay.remove();
    warningOverlay = null;
  }
}

// Report scam
function reportScam(result, url) {
  chrome.runtime.sendMessage({
    type: 'REPORT_SCAM',
    data: {
      message: '',
      url: url,
      scamScore: result.scamScore,
      riskLevel: result.riskLevel,
      flaggedKeywords: result.flaggedKeywords || [],
      flaggedUrls: result.flaggedUrls || [],
      explanation: result.explanation,
      messageHash: result.messageHash
    }
  });
}

// Scan links on the page
function scanPageLinks() {
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href.startsWith('http') || href.startsWith('www'))) {
      // Add hover effect to show potential risk
      link.addEventListener('mouseenter', () => {
        chrome.runtime.sendMessage({
          type: 'GET_SCAN_RESULT',
          url: href
        }, (response) => {
          if (response.success && response.result && response.result.scamScore >= 60) {
            // Add visual indicator
            link.style.borderBottom = '2px solid #ef4444';
            link.title = `⚠️ Scam Risk: ${response.result.scamScore}%`;
          }
        });
      });

      link.addEventListener('mouseleave', () => {
        link.style.borderBottom = '';
        link.title = '';
      });
    }
  });
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scanPageLinks);
} else {
  scanPageLinks();
}
