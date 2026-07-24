# CelebrateMate — Frontend

A React + Vite frontend for **CelebrateMate**, a real-time event reminder app with SMS, Email, and AI-generated wishes.

## Features
- 📱 Schedule SMS reminders via TextBee
- 📧 Send custom celebration emails
- 🤖 AI-generated wishes (Gemini 2.5 Flash) with tone selector
- 📦 CSV bulk contact import with drag-and-drop
- 📜 Delivery history with retry support
- 🎨 Dark glassmorphic UI with micro-animations

## Tech Stack
- React 18 + Vite
- Axios, papaparse, lucide-react

## Setup

### 1. Clone and install
```bash
git clone https://github.com/Abhishek30007/watsapp_frontend.git
cd watsapp_frontend
npm install
```

### 2. Make sure the backend is running at `https://watsapp-backend-td8c.onrender.com`

### 3. Start the dev server
```bash
npm run dev
```

Frontend runs on `https://social-frontend-git-main-abhishek30007s-projects.vercel.app/`

## Environment
The API base URL is hardcoded to `https://watsapp-backend-td8c.onrender.com/api` in the components.
If you deploy the backend elsewhere, update `API_BASE` in each component.

