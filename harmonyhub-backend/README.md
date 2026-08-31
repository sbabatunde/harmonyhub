# HarmonyHub - Church Music Education Platform

A comprehensive music education platform designed for church choirs and worship teams.

## Overview

HarmonyHub combines vocal training, practice management, gamification, and AI-assisted feedback into a single platform.

## Tech Stack

- **Backend**: Laravel 13 (PHP 8.3+)
- **Frontend**: React 18 + TypeScript (Vite)
- **AI Service**: Python FastAPI
- **Database**: SQLite (dev) / MySQL (prod)
- **AI Models**: Demucs, Whisper, Ollama

## Features

- 🎵 Song Library Management
- 🎤 Practice Room with Pitch Detection
- 🎮 Training Games (Pitch Perfect, Interval Trainer, Rhythm Master)
- 📚 Structured Curriculum
- 📝 Assignment Management
- 👨‍🏫 Teacher Dashboard
- 🎵 AI Karaoke Processing
- 🤖 AI Coaching Feedback

## Quick Start

### Prerequisites
- PHP 8.3+
- Node.js 18+
- Python 3.11+
- Composer

### Installation

```bash
# Backend
cd harmonyhub-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve

# Frontend
cd harmonyhub-frontend
npm install
npm run dev

# AI Service
cd harmonyhub-ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

License
Private project for church use.

text

### **2. Technical Documentation**

**docs/TECHNICAL.md:**
```markdown
# HarmonyHub Technical Documentation

## Architecture
┌─────────────────┐ REST API ┌─────────────────┐ HTTP ┌─────────────────┐
│ React Frontend │ ────────────────→ │ Laravel Backend│ ────────────→ │ Python AI Svc │
│ (Port 3000) │ ←──────────────── │ (Port 8000) │ ←──────────── │ (Port 8001) │
└─────────────────┘ JSON └─────────────────┘ JSON └─────────────────┘

text

## Module Structure

Each module follows the same pattern:
Modules/ModuleName/
├── app/
│ ├── Http/Controllers/
│ ├── DTOs/
│ ├── Requests/
│ └── Services/
│ ├── Contracts/
│ └── Service.php
├── Providers/
├── routes/
└── module.json

text

## Database Schema

### Tables
- `users` - User accounts
- `churches` - Church organizations
- `songs` - Song library
- `song_parts` - Vocal parts for songs
- `karaoke_tracks` - AI-processed karaoke data
- `curriculum_stages` - Learning progression
- `user_progress` - Curriculum progress
- `practice_sessions` - Practice logging
- `game_scores` - Game performance
- `assignments` - Teacher assignments
- `personal_access_tokens` - Sanctum tokens

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/user`

### Songs
- `GET /api/songs`
- `POST /api/songs`
- `GET /api/songs/{id}`
- `PUT /api/songs/{id}`
- `DELETE /api/songs/{id}`
- `GET /api/songs/{songId}/parts`
- `POST /api/songs/{songId}/parts`

### Practice
- `GET /api/practice/sessions`
- `POST /api/practice/sessions`
- `GET /api/practice/statistics`

### Games
- `POST /api/games/scores`
- `GET /api/games/scores`
- `GET /api/games/leaderboard/{gameType}`

### Curriculum
- `GET /api/curriculum`
- `GET /api/curriculum/progress`

### Assignments
- `GET /api/assignments`
- `POST /api/assignments`
- `POST /api/assignments/{id}/complete`

### Teacher
- `GET /api/teacher/students`
- `GET /api/teacher/statistics`

### Karaoke
- `POST /api/songs/{songId}/karaoke/process`
- `GET /api/songs/{songId}/karaoke/status`

### AI Coach
- `GET /api/coach/feedback`
- `GET /api/coach/summary`
3. Deployment Guide

markdown
# HarmonyHub Deployment Guide

## Production Setup

### Backend (Laravel)
1. Set `APP_ENV=production`
2. Configure MySQL database
3. Set up Redis for queues
4. Configure file storage (S3/Cloudflare R2)
5. Run migrations
6. Configure queue workers

### Frontend (React)
1. Run `npm run build`
2. Deploy to Vercel/Netlify or serve statically
3. Set `VITE_API_URL` to production URL

### AI Service (Python)
1. Deploy to separate server or container
2. Install dependencies
3. Configure environment variables
4. Run with Gunicorn or Docker

## Environment Variables

### Laravel .env
APP_ENV=production
APP_URL=https://your-domain.com
DB_CONNECTION=mysql
DB_HOST=...
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
FILESYSTEM_DISK=s3
AI_SERVICE_URL=http://ai-service:8001
LARAVEL_WEBHOOK_SECRET=...

text

### AI Service .env
APP_ENV=production
PORT=8001
DEMUCS_MODEL=htdemucs
WHISPER_MODEL=base
OLLAMA_MODEL=llama3.2
LARAVEL_API_URL=https://your-domain.com/api
LARAVEL_WEBHOOK_SECRET=...
