# Beauty Salon TMA

A Telegram Mini App for booking beauty salon services.

## Architecture

- **Backend**: FastAPI with PostgreSQL
- **Bot**: Telegram bot for notifications
- **Frontend**: React with TypeScript, integrated as Telegram Mini App

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in the values
3. Run `docker-compose up --build`

## Development

- Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
- Frontend: `cd frontend && npm install && npm run dev`
- Bot: `cd bot && python bot.py`