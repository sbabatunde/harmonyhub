
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
