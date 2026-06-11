#!/bin/bash
echo "🏥 Starting MedSimplify..."

# Install backend deps
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:8000"

# Install & start frontend
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install --silent
echo "✅ Frontend starting on http://localhost:5173"
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
