# 🧠 MindSpace 3D – AI Mental Wellness Platform

<div align="center">

![MindSpace 3D](https://img.shields.io/badge/MindSpace-3D-7c3aed?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyeiIvPjwvc3ZnPg==)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r128-000000?style=for-the-badge&logo=three.js)

**A full-stack web application designed to help people manage stress and improve their mental health with an immersive 3D experience.**

</div>

---

## ✨ Features

- 📊 **Dashboard Analytics** – Track your mood, journal entries, and wellness streaks.
- 😊 **AI Mood Tracker** – Log your emotions and use Gemini AI to detect mood via natural language.
- 🤖 **AI Companion** – Chat with an intelligent wellness assistant.
- 🌬️ **Breathing & Games** – Guided breathing animations and interactive stress-relief mini-games.
- 🛒 **Wellness Shop with Razorpay** – Browse physical wellness products and checkout seamlessly.
- 🎵 **Procedural Ambient Music** – Dynamically generated calming audio without any loaded MP3s!

---

## 🛠️ Tech Stack

### Frontend
- **HTML5/CSS3/JS** – Glassmorphism, animations, responsive design.
- **Three.js** – Interactive 3D particle background.
- **Web Audio API** – Mathematical ambient music generation.

### Backend & Cloud Services
- **Node.js & Express.js** – APIs and Razorpay payment signature verification.
- **Supabase** – PostgreSQL database and Authentication (replaces legacy MongoDB).
- **Google Gemini API** – AI Chatbot and text-based mood detection.
- **Vercel** – Serverless deployment ready via `vercel.json` and `api/index.js`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A [Supabase](https://supabase.com/) project
- A [Razorpay](https://razorpay.com/) test account
- A [Google Gemini AI](https://ai.google.dev/) API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Prashant666-coder/MindSpace.git
   cd MindSpace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file referencing `.env.example`:
   ```env
   # API Configuration
   PORT=3000
   NODE_ENV=development

   # AI Integration
   GEMINI_API_KEY=your_gemini_key

   # Database & Auth
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key

   # Payments
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

4. **Initialize Database**
   Copy the contents of `supabase_tables.sql` and run them in your Supabase SQL Editor.

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open the application**  
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
MindSpace/
├── public/                    # Frontend (static files)
│   ├── css/style.css          # Main stylesheet
│   └── js/
│       ├── app.js             # Core logic & Supabase database calls
│       ├── music.js           # Procedural Web Audio API mixer
│       ├── games.js           # Stress relief games
│       └── three-scene.js     # 3D interactive background
├── server/                    # Backend
│   ├── routes/                # Express API routes (payment, gemini chat)
│   ├── server.js              # Express app
│   └── supabase.js            # Admin clients
├── api/index.js               # Vercel Serverless bridge
├── vercel.json                # Vercel routing
├── supabase_tables.sql        # Postgres schema setup
└── package.json               # Node modules
```

---

## ⚠️ Disclaimer

MindSpace 3D is **not** a substitute for professional mental health care. If you're experiencing a mental health crisis, please contact emergency lines in your country.
