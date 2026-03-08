# ScamShield AI Chrome Extension

A browser extension that provides real-time scam detection and protection while browsing the web.

## Features

- **Real-time URL Scanning**: Automatically scans websites as you visit them
- **Visual Warnings**: Shows overlay warnings for dangerous websites
- **Risk Scoring**: Displays scam probability scores
- **Link Hover Protection**: Highlights suspicious links on hover
- **Quick Reporting**: Report scams directly from the extension
- **Badge Indicators**: Extension badge shows risk level

## Installation

### Development Setup

1. Clone the ScamShield AI repository
2. Navigate to the `chrome-extension` directory
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the `chrome-extension` directory

### Production Build

1. Ensure the backend API is running at `http://localhost:3002`
2. Load the extension as described above
3. The extension will automatically scan websites

## Usage

### Automatic Scanning
- Extension automatically scans websites when you visit them
- Badge indicates risk level:
  - 🟢 Green: Safe
  - 🟡 Yellow: Low risk
  - 🟠 Orange: Medium risk  
  - 🔴 Red: High risk/scam

### Manual Scanning
1. Click the extension icon in the toolbar
2. View current page analysis
3. Scan different URLs using the popup

### Warning Overlays
- Dangerous sites show a warning overlay
- Options to report scam, go back, or proceed anyway
- Detailed risk analysis and explanation

### Link Protection
- Hover over links to see risk indicators
- Red underline for suspicious links
- Tooltip showing risk percentage

## Files Structure

```
chrome-extension/
├── manifest.json          # Extension manifest
├── background.js           # Service worker
├── content.js             # Content script for page interaction
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── warning-inject.js      # Warning overlay script
├── icons/                 # Extension icons
└── README.md              # This file
```

## API Integration

The extension communicates with the ScamShield AI backend:

- **Scan URL**: `POST /api/scam/scan`
- **Report Scam**: `POST /api/report`
- **Get Results**: Cache for performance

## Permissions

- `activeTab`: Access current tab information
- `storage`: Local storage for caching
- `scripting`: Inject warning overlays
- `host_permissions`: Access all websites for scanning

## Security & Privacy

- URLs are scanned locally with caching
- No personal data stored
- Scam reports are anonymized
- Blockchain integration for immutable records

## Development

### Testing
1. Load extension in developer mode
2. Visit test URLs:
   - Safe: `https://google.com`
   - Suspicious: `bit.ly/test-scam`

### Debugging
1. Open Chrome DevTools
2. Check background script logs
3. Review content script console
4. Monitor network requests to API

## Troubleshooting

### Extension not working
1. Check if backend API is running
2. Verify API endpoint in `background.js`
3. Reload extension after changes

### No warnings showing
1. Check extension permissions
2. Verify content script injection
3. Test with known scam URLs

### Performance issues
1. Check cache duration in `background.js`
2. Monitor API response times
3. Review scan frequency

## Contributing

1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

## License

MIT License - see main project LICENSE file
