# HarmonyHub - Church Music Education Platform

A comprehensive music education platform designed for church choirs and worship teams. Combines vocal training, practice management, gamification, and AI-assisted feedback.

## 🎵 Features

- **Song Library Management** - Upload and organize church music

- **Practice Room** - Real-time pitch detection feedback

- **Training Games** - Pitch Perfect, Interval Trainer, Rhythm Master

- **Structured Curriculum** - Progressive learning stages

- **Assignment Management** - Teacher-student workflow

- **AI Karaoke Processing** - Automatic vocal/instrumental separation

- **AI Voice Parts Generation** - Auto-generate Soprano, Alto, Tenor, Bass

- **AI Coaching** - Personalized practice feedback

- **Synchronized Lyrics** - TV-style karaoke display

## 🏗️ Architecture

┌─────────────────┐ REST API ┌─────────────────┐ HTTP ┌─────────────────┐

│ React Frontend │ ────────────────→ │ Laravel Backend│ ────────────→ │ Python AI Svc │

│ (Port 3000) │ ←──────────────── │ (Port 8000) │ ←──────────── │ (Port 8001) │

└─────────────────┘ JSON └─────────────────┘ JSON └─────────────────┘

text

## 🚀 Quick Start

### Prerequisites

- PHP 8.3+

- Node.js 18+

- Python 3.11+

- Composer

### Backend Setup

```bash

cd harmonyhub-backend

composer install

cp .env.example .env

php artisan key:generate

php artisan migrate --seed

php artisan serve

Frontend Setup

bash

cd harmonyhub-frontend

npm install

npm run dev

AI Service Setup

bash

cd harmonyhub-ai-service

python -m venv venv

source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload --port 8001

📝 Test Credentials

Role	Email	Password

Admin	admin@harmonyhub.test	password123

Teacher	teacher@harmonyhub.test	password123

Student	student@harmonyhub.test	password123

📚 Documentation

Technical Documentation

Deployment Guide

User Guide

🛠️ Tech Stack

Backend: Laravel 13, PHP 8.3, MySQL/SQLite

Frontend: React 18, TypeScript, Tailwind CSS, Zustand, TanStack Query

AI Service: Python FastAPI, Demucs, Whisper, Ollama

### Optional: Better pitch-shifting quality

For higher-quality voice-part generation, install the Rubber Band CLI:

1. Download from https://breakfastquay.com/rubberband/
2. Extract `rubberband.exe` + `sndfile.dll` to a folder (e.g., `C:\rubberband`)
3. Add the folder to your system PATH
4. Verify with `rubberband --version`
5. Install the Python wrapper: `pip install pyrubberband`

Without this, the service still works but falls back to librosa's
lower-quality pitch-shift algorithm.

📄 License

Private project for church use.