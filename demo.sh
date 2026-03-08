#!/bin/bash

# ScamShield AI Demo Script
# This script sets up and runs the complete demo for hackathon judges

echo "🚀 ScamShield AI Demo Setup"
echo "================================"

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed"
        exit 1
    fi
    
    if ! command -v mongod &> /dev/null; then
        echo "⚠️  MongoDB is not running. Please start MongoDB"
        echo "   On macOS: brew services start mongodb-community"
        echo "   On Ubuntu: sudo systemctl start mongod"
        echo "   On Windows: Start MongoDB service"
    fi
    
    echo "✅ Requirements check complete"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install frontend dependencies
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    # Install backend dependencies
    echo "Installing backend dependencies..."
    cd backend
    pip install -r requirements.txt
    cd ..
    
    # Install AI model dependencies
    echo "Installing AI model dependencies..."
    cd ai-model && npm install && cd ..
    
    # Install blockchain dependencies
    echo "Installing blockchain dependencies..."
    cd blockchain && npm install && cd ..
    
    echo "✅ Dependencies installed"
}

# Setup environment files
setup_environment() {
    echo "🔧 Setting up environment files..."
    
    # Backend environment
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        echo "📝 Created backend/.env - please update with your configuration"
    fi
    
    # Blockchain environment
    if [ ! -f blockchain/.env ]; then
        cp blockchain/.env.example blockchain/.env
        echo "📝 Created blockchain/.env - please update with your configuration"
    fi
    
    echo "✅ Environment files setup"
}

# Deploy smart contract
deploy_contract() {
    echo "⛓️  Deploying smart contract..."
    
    cd blockchain
    
    # Compile contract
    npx hardhat compile
    
    # Deploy to local network (for demo)
    echo "Deploying to local network..."
    npx hardhat node &
    NODE_PID=$!
    
    sleep 5
    
    npx hardhat run scripts/deploy.js --network localhost
    
    kill $NODE_PID 2>/dev/null
    
    cd ..
    
    echo "✅ Smart contract deployed"
}

# Start all services
start_services() {
    echo "🚀 Starting all services..."
    
    # Start AI Model
    echo "Starting AI Model service..."
    cd ai-model
    npm start &
    AI_PID=$!
    cd ..
    
    # Start Backend (FastAPI)
    echo "Starting Backend service..."
    cd backend
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    cd ..
    
    # Start Frontend
    echo "Starting Frontend service..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for services to start
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    echo "✅ All services started"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    echo "   AI Model: http://localhost:3001"
    
    # Save PIDs for cleanup
    echo $AI_PID > .ai_pid
    echo $BACKEND_PID > .backend_pid
    echo $FRONTEND_PID > .frontend_pid
}

# Run demo tests
run_demo_tests() {
    echo "🧪 Running demo tests..."
    
    # Test AI Model
    echo "Testing AI Model..."
    curl -X POST http://localhost:3001/detect \
        -H "Content-Type: application/json" \
        -d '{"message": "URGENT: Your account will be suspended! Click here: bit.ly/verify123", "url": "bit.ly/verify123"}' \
        > /tmp/ai_test.json
    
    echo "✅ AI Model test complete"
    
    # Test Backend API
    echo "Testing Backend API..."
    curl -X POST http://localhost:8000/api/v1/scam/scan \
        -H "Content-Type: application/json" \
        -d '{"message": "Congratulations! You won $1,000,000! Send bank details now.", "url": ""}' \
        > /tmp/backend_test.json
    
    echo "✅ Backend API test complete"
}

# Show demo information
show_demo_info() {
    echo ""
    echo "🎯 ScamShield AI Demo Ready!"
    echo "================================"
    echo ""
    echo "📱 Web Application:"
    echo "   URL: http://localhost:3000"
    echo "   Features: Scan messages, view dashboard, report scams"
    echo ""
    echo "🔍 Chrome Extension:"
    echo "   1. Open Chrome and go to chrome://extensions/"
    echo "   2. Enable Developer mode"
    echo "   3. Click 'Load unpacked'"
    echo "   4. Select the 'chrome-extension' folder"
    echo ""
    echo "🧪 Demo Scam Messages to Try:"
    echo "   1. 'URGENT: Your account will be suspended! Click here: bit.ly/verify123'"
    echo "   2. 'Congratulations! You won $1,000,000! Send bank details now!'"
    echo "   3. 'IRS: You owe back taxes. Pay immediately to avoid arrest.'"
    echo ""
    echo "📊 Dashboard Features:"
    echo "   - Real-time scam statistics"
    echo "   - Recent scam reports"
    echo "   - Category breakdown"
    echo "   - Blockchain registry status"
    echo ""
    echo "🔗 API Endpoints:"
    echo "   - POST /api/v1/scam/scan - Scan message/URL"
    echo "   - POST /api/v1/report - Report scam"
    echo "   - GET /api/v1/stats/overview - Get statistics"
    echo "   - API Docs: http://localhost:8000/docs"
    echo ""
    echo "⛓️  Blockchain Features:"
    echo "   - Immutable scam registry"
    echo "   - Community reporting"
    echo "   - Tamper-proof records"
    echo ""
    echo "🛑 To stop all services: ./demo.sh stop"
    echo ""
}

# Stop all services
stop_services() {
    echo "🛑 Stopping all services..."
    
    if [ -f .ai_pid ]; then
        kill $(cat .ai_pid) 2>/dev/null
        rm .ai_pid
    fi
    
    if [ -f .backend_pid ]; then
        kill $(cat .backend_pid) 2>/dev/null
        rm .backend_pid
    fi
    
    if [ -f .frontend_pid ]; then
        kill $(cat .frontend_pid) 2>/dev/null
        rm .frontend_pid
    fi
    
    # Kill any remaining node processes
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "npm start" 2>/dev/null
    
    echo "✅ All services stopped"
}

# Main script logic
case "${1:-setup}" in
    "setup")
        check_requirements
        install_dependencies
        setup_environment
        deploy_contract
        start_services
        run_demo_tests
        show_demo_info
        ;;
    "start")
        start_services
        show_demo_info
        ;;
    "stop")
        stop_services
        ;;
    "test")
        run_demo_tests
        ;;
    "clean")
        stop_services
        echo "🧹 Cleaning up..."
        rm -f .ai_pid .backend_pid .frontend_pid
        rm -f /tmp/ai_test.json /tmp/backend_test.json
        echo "✅ Cleanup complete"
        ;;
    *)
        echo "Usage: $0 {setup|start|stop|test|clean}"
        echo "  setup  - Full setup and start (default)"
        echo "  start  - Start services only"
        echo "  stop   - Stop all services"
        echo "  test   - Run demo tests"
        echo "  clean  - Stop services and cleanup"
        exit 1
        ;;
esac
