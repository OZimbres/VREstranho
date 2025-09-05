#!/bin/bash

echo "🚀 VR Estranho - Setup Script"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version $NODE_VERSION detected. Please install Node.js 20+ and try again."
    exit 1
fi

print_status "Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_status "npm $(npm -v) detected"

echo ""
print_info "Installing dependencies..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd portal-backend
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd portal-frontend
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi
cd ..

# Install agent dependencies
echo "📦 Installing agent dependencies..."
cd agent
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install agent dependencies"
    exit 1
fi
cd ..

print_status "All dependencies installed successfully!"

# Build frontend for production
echo "🔨 Building frontend for production..."
cd portal-frontend
npm run build
if [ $? -ne 0 ]; then
    print_warning "Frontend build failed, but you can still run in development mode"
fi
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
print_info "To start the application:"
echo "1. Start backend: cd portal-backend && npm run dev"
echo "2. Start frontend: cd portal-frontend && npm start"
echo "3. Start agent: cd agent && npm start"
echo ""
print_info "Access the application at:"
echo "- Frontend: http://localhost:4200"
echo "- Backend API: http://localhost:3000"
echo "- Login: admin/admin123"
echo ""
print_status "VR Estranho is ready for the hackathon! 🏆"