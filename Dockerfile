
# Build React frontend
FROM node:20-alpine AS frontend-build

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Run FastAPI backend and serve frontend
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

COPY --from=frontend-build /frontend/dist ./frontend/dist

EXPOSE 8000

CMD ["sh", "-c", "cd /app/backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
