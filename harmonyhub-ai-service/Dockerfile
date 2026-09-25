FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/

# Copy the run_demucs.py patch
COPY app/run_demucs.py ./app/

EXPOSE 8001

# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]