#frontend build
FROM node:20 AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN mkdir ../backend
RUN mkdir ../backend/static
RUN npm run build

#backend deploy
FROM python:3.11-slim AS backend

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /backend

#RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

COPY --from=frontend-builder /backend/static/ ./static/


ENV PROD=True
ENV DJANGO_SETTINGS_MODULE=backend.settings

WORKDIR /

COPY manage.py ./
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD exec uvicorn backend:app --host 0.0.0.0 --port $PORT
