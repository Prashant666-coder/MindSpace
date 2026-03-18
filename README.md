# 🧠 MindSpace 3D – AI Mental Wellness Platform

<div align="center">

![MindSpace 3D](https://img.shields.io/badge/MindSpace-3D-7c3aed?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyeiIvPjwvc3ZnPg==)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)
![Three.js](https://img.shields.io/badge/Three.js-r128-000000?style=for-the-badge&logo=three.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**A full-stack web application designed to help people manage stress and improve their mental health with an immersive 3D experience.**

[Features](#-features) · [Screenshots](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Project Structure](#-project-structure)

</div>

---

## ✨ Features

### 🎯 Core Features

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Overview with mood analytics, charts, daily tips, and activity history |
| 😊 **Mood Tracker** | Select emotions (happy, sad, stressed, angry, calm, anxious) with intensity and notes |
| 🤖 **AI Companion** | Intelligent chatbot providing supportive suggestions for mental wellness |
| 🌬️ **Breathing & Meditation** | Guided breathing exercises (Box, 4-7-8, Deep) with visual animations |
| 📝 **Personal Journal** | Write daily thoughts with mood tagging and full CRUD operations |
| 🎮 **Stress Relief Games** | Bubble popping, Zen garden, and Color flow interactive activities |
| 🛒 **Wellness Shop** | Browse mental health products (stress balls, journals, essential oils, etc.) |
| 🗺️ **Activity Finder** | Discover nearby parks, yoga centers, gyms, and more using maps |
| 🎵 **Calming Music** | Procedurally generated ambient music with 10+ tracks and sound mixer |
| 🌐 **3D Environment** | Immersive Three.js particle background with interactive visuals |

### 🔐 Authentication
- User registration and login with JWT tokens
- Password hashing with bcryptjs
- Guest mode available for trying the app

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** – Semantic, accessible markup
- **CSS3** – Glassmorphism, gradients, animations, responsive design
- **JavaScript (ES6+)** – Modular, IIFE-based architecture
- **Three.js** – 3D particle environment
- **Chart.js** – Mood analytics (pie & line charts)
- **Leaflet.js** – Interactive maps for activity finder
- **Web Audio API** – Procedural ambient music generation

### Backend
- **Node.js** – Runtime environment
- **Express.js** – REST API framework
- **MongoDB** – NoSQL database
- **Mongoose** – ODM for MongoDB
- **JWT** – JSON Web Token authentication
- **bcryptjs** – Password hashing

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v16 or higher) – [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) – [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Git** – [Download](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mindspace-3d.git
   cd mindspace-3d
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/mindspace3d
   JWT_SECRET=your_secret_key_here
   PORT=3000
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

5. **Seed the database** (optional – adds sample products to the shop)
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

7. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login & get token | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### Mood Tracking

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| POST | `/api/mood` | Log a mood entry | ✅ |
| GET | `/api/mood` | Get mood history | ✅ |
| GET | `/api/mood/stats` | Get mood analytics | ✅ |
| DELETE | `/api/mood/:id` | Delete mood entry | ✅ |

### Journal

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| POST | `/api/journal` | Create journal entry | ✅ |
| GET | `/api/journal` | Get all entries | ✅ |
| GET | `/api/journal/:id` | Get single entry | ✅ |
| PUT | `/api/journal/:id` | Update entry | ✅ |
| DELETE | `/api/journal/:id` | Delete entry | ✅ |

### Products

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/api/products` | Get all products | ❌ |
| GET | `/api/products/:id` | Get single product | ❌ |
| GET | `/api/products/category/:cat` | Get by category | ❌ |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API status check |

---

## 📁 Project Structure

```
mindspace-3d/
├── public/                    # Frontend (static files)
│   ├── index.html             # Main HTML page (SPA)
│   ├── css/
│   │   └── style.css          # Complete stylesheet
│   └── js/
│       ├── three-scene.js     # Three.js 3D background
│       ├── app.js             # Main app logic
│       ├── chatbot.js         # AI companion chatbot
│       ├── breathing.js       # Breathing exercises
│       ├── games.js           # Stress relief games
│       └── music.js           # Music player
├── server/                    # Backend
│   ├── server.js              # Express server entry point
│   ├── seed.js                # Database seed script
│   ├── middleware/
│   │   └── auth.js            # JWT auth middleware
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Mood.js            # Mood model
│   │   ├── Journal.js         # Journal model
│   │   └── Product.js         # Product model
│   └── routes/
│       ├── auth.js            # Auth routes
│       ├── mood.js            # Mood routes
│       ├── journal.js         # Journal routes
│       └── products.js        # Product routes
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

---

## 🎨 Design Philosophy

- **Glassmorphism UI** – Frosted glass effect with subtle transparency
- **Dark Theme** – Easy on the eyes, reduces strain
- **Purple-Teal Gradient** – Calming, therapeutic color palette
- **Smooth Animations** – Gentle transitions and micro-interactions
- **Responsive** – Works on desktop, tablet, and mobile
- **3D Immersion** – Floating particles create a peaceful atmosphere

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

MindSpace 3D is **not** a substitute for professional mental health care. If you're experiencing a mental health crisis, please contact:

- **988 Suicide & Crisis Lifeline** (US): Call or text **988**
- **Crisis Text Line**: Text **HOME** to **741741**
- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

---

<div align="center">

Made with 💚 for mental wellness

**MindSpace 3D** – *Your mind deserves a peaceful space.*

</div>
