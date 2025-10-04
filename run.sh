#!/bin/bash

echo "Starting Real Estate Investment Calculator..."

# Check if requirements are installed
if [ ! -d "backend/venv" ]; then
  echo "Setting up backend..."
  cd backend
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "Setting up frontend..."
  cd frontend
  npm install
  cd ..
fi

# Function to check if port is in use
check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>/dev/null; then
    echo "Port $1 is already in use. Please free it or use different ports."
    exit 1
  fi
}

check_port 5000
check_port 3000

# Start the Flask backend
cd backend
source venv/bin/activate
echo "Starting Flask backend on http://localhost:5000..."
python app.py &
BACKEND_PID=$!

# Build and serve the frontend
cd ../frontend
if [ ! -d "dist" ]; then
  echo "Building frontend..."
  npm run build
fi
cd dist
echo "Starting frontend server on http://localhost:3000..."
python3 -m http.server 3000 &
FRONTEND_PID=$!

echo "App is running!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo "Press Ctrl+C to stop."

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID