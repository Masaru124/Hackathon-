# ScamShield AI - Hackathon MVP

A comprehensive scam detection system using AI and blockchain technology to protect users from phishing and scam messages across WhatsApp, SMS, Email, and Social Media.

## 🚀 Features

- **AI-Powered Scam Detection**: Uses DistilBERT to analyze messages and URLs for scam probability
- **Blockchain Registry**: Immutable scam reports stored on Polygon testnet
- **URL Risk Analysis**: Comprehensive URL safety checks
- **Community Reporting**: User-driven scam reporting system
- **Chrome Extension**: Real-time URL scanning and warnings
- **Modern Web Interface**: Next.js + TailwindCSS responsive design

## 📁 Project Structure

```
ScamShield-AI/
├── frontend/          # Next.js web application
├── backend/           # Express API server
├── ai-model/          # AI scam detection module
├── blockchain/        # Solidity smart contracts
├── chrome-extension/  # Browser extension
└── README.md
```

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, React
- **Backend**: FastAPI, Python, MongoDB, Motor
- **AI**: DistilBERT, Transformers, PyTorch
- **Blockchain**: Solidity, Hardhat, Polygon Testnet
- **Extension**: Chrome Extension Manifest V3

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB
- MetaMask (for blockchain interactions)

### Installation

1. **Clone and install dependencies**
```bash
cd ScamShield-AI
npm install
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
cd ../ai-model && npm install
cd ../blockchain && npm install
```

2. **Setup Environment Variables**
```bash
# backend/.env
MONGODB_URI=mongodb://localhost:27017/scamshield
POLYGON_TESTNET_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=deployed_contract_address
```

3. **Deploy Smart Contract**
```bash
cd blockchain
npx hardhat compile
npx hardhat run scripts/deploy.js --network polygon_testnet
```

4. **Start Services**
```bash
# Terminal 1: Backend (FastAPI)
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend  
cd frontend && npm run dev

# Terminal 3: AI Model
cd ai-model && npm start
```

5. **Install Chrome Extension**
- Open `chrome-extension/` folder in Chrome Extensions Developer Mode
- Load unpacked extension

## 🎯 Demo Usage

1. Open http://localhost:3000
2. Open http://localhost:8000/docs for API documentation
3. Paste a suspicious message or URL
4. Click "Scan Message" 
5. View scam probability and risk analysis
6. Report scams to blockchain registry

## 🔧 API Endpoints

- `POST /api/v1/scam/scan` - Scan message/URL for scams
- `POST /api/v1/report` - Report scam to blockchain
- `GET /api/v1/scam/reports` - Get all scam reports
- `GET /api/v1/stats/overview` - Get scam statistics
- `GET /api/v1/blockchain/status` - Get blockchain status
- `GET /docs` - Interactive API documentation

## 🧪 Test Data

Example scam messages for testing:
- "URGENT: Your account will be suspended! Click here: bit.ly/scam123"
- "Congratulations! You won $1,000,000. Send bank details now."
- "IRS: You owe back taxes. Pay immediately to avoid arrest."

## 🏆 Hackathon Demo Script

1. **Problem Statement**: Show rising scam statistics
2. **Solution Demo**: Live scanning of scam messages
3. **Blockchain Feature**: Show immutable scam registry
4. **Chrome Extension**: Real-time URL protection
5. **Community Impact**: Display reporting dashboard

## 📊 Smart Contract Functions

- `reportScam(string messageHash, string url, uint score)` - Report scam
- `getScamReports()` - Get all reports
- `isReported(string messageHash)` - Check if message is reported

## 🔒 Security Features

- Message hashing for privacy
- Immutable blockchain storage
- Community verification system
- Real-time URL analysis

## 🚀 Deployment

- **Frontend**: Vercel
- **Backend**: Railway/Heroku  
- **Blockchain**: Polygon Testnet
- **Extension**: Chrome Web Store

## 📈 Future Enhancements

- WhatsApp/Telegram bot integration
- Global scam heatmap
- Multi-language support
- Mobile app development

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

MIT License - see LICENSE file for details
