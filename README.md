# Beauty Salon TMA 🛍️💅

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

> A comprehensive Telegram Mini App for booking beauty salon services. This demo project showcases modern web development practices, microservices architecture, and seamless Telegram integration.

## 🌟 Overview

Beauty Salon TMA is a full-stack web application that allows users to book beauty salon appointments directly through Telegram. Built as a portfolio project, it demonstrates expertise in backend development, frontend design, database management, and DevOps practices.

### Key Features

- **📱 Telegram Mini App**: Seamless booking experience within Telegram
- **⏰ Smart Scheduling**: Dynamic slot calculation based on employee availability
- **🔔 Automated Reminders**: 15-minute pre-appointment notifications
- **👥 Multi-Employee Support**: Assign services to specific specialists
- **📊 Admin Dashboard**: Directus-powered content management
- **🐳 Containerized**: Full Docker deployment with microservices
- **🔒 Secure**: Proper authentication and data validation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │    │   Mini App      │    │   Admin Panel   │
│   (Aiogram)     │    │   (React)       │    │   (Directus)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   FastAPI       │
                    │   Backend       │
                    └─────────────────┘
                             │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    └─────────────────┘
```

### System Components

#### Backend (FastAPI)
- **RESTful API**: Comprehensive endpoints for all operations
- **Business Logic**: Booking management, slot calculation, scheduling
- **Database ORM**: SQLAlchemy with PostgreSQL
- **Task Scheduling**: APScheduler for automated reminders
- **Security**: JWT-based authentication with Telegram integration

#### Frontend (React + TypeScript)
- **Modern UI**: Built with React 18 and TypeScript
- **Styling**: TailwindCSS for responsive design
- **State Management**: Zustand for global state
- **API Integration**: Axios for HTTP requests
- **Telegram SDK**: Native Telegram Mini App integration

#### Bot (Aiogram)
- **User Interaction**: Command handling and WebApp launching
- **Notifications**: Automated booking confirmations and reminders
- **Async Processing**: Non-blocking message sending

#### Database (PostgreSQL)
- **Normalized Schema**: Optimized for booking operations
- **Relationships**: Services ↔ Employees ↔ Schedules ↔ Bookings
- **Migrations**: Alembic for schema versioning

#### Admin Panel (Directus)
- **Content Management**: CRUD operations for services and employees
- **User Interface**: Ready-to-use admin dashboard
- **API Integration**: RESTful access to database

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/beauty-salon-tma.git
   cd beauty-salon-tma
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your Telegram bot token and other settings
   ```

3. **Launch with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Seed Initial Data**
   ```bash
   docker-compose exec backend python scripts/seed_services.py
   docker-compose exec backend python scripts/seed_employees.py
   ```

### Access Points

- **Telegram Bot**: Search for your bot and start with `/start`
- **Mini App**: Accessible via bot's WebApp button
- **Admin Panel**: http://localhost:8055
- **API Documentation**: http://localhost:8000/docs

## 💻 Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Bot Development

```bash
cd bot
pip install -r requirements.txt
python bot.py
```

## 📋 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List all services |
| GET | `/api/services/{id}/employees` | Get employees for service |
| GET | `/api/employees/{id}/slots` | Get available time slots |
| POST | `/api/bookings` | Create new booking |
| GET | `/api/bookings/my` | Get user's bookings |
| POST | `/api/bookings/{id}/cancel` | Cancel booking |
| POST | `/api/bookings/{id}/reschedule` | Reschedule booking |

### Authentication

All booking endpoints require `user-id` header with Telegram user ID.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SECRET_KEY` | JWT signing key | Yes |
| `TELEGRAM_BOT_USERNAME` | Bot username | No |

### Database Schema

```sql
-- Main tables
CREATE TABLE services (id, name, duration, price, description);
CREATE TABLE employees (id, name, avatar, bio);
CREATE TABLE schedules (employee_id, weekday, start_time, end_time);
CREATE TABLE bookings (user_id, service_id, employee_id, start_time, end_time, status);
-- Junction table
CREATE TABLE employee_services (employee_id, service_id);
```

## 🎯 Booking Flow

1. **Service Selection**: User browses available services
2. **Employee Selection**: System shows qualified employees
3. **Date & Time**: User picks date, system calculates available slots
4. **Confirmation**: Booking created, reminder scheduled
5. **Notification**: Telegram confirmation sent
6. **Reminder**: 15-minute pre-appointment alert

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Manual testing
# Use Telegram bot to test full flow
```

## 📦 Deployment

### Production Setup

1. **Build Images**
   ```bash
   docker-compose build
   ```

2. **Environment Configuration**
   - Set production database URL
   - Configure domain for WebApp
   - Set up SSL certificates

3. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Scaling Considerations

- **Backend**: Horizontal scaling with load balancer
- **Database**: Read replicas for high traffic
- **Bot**: Multiple instances with webhook
- **Frontend**: CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript strict mode
- Write comprehensive tests
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) for the excellent web framework
- [React](https://reactjs.org/) for the frontend library
- [Telegram](https://telegram.org/) for the platform
- [Directus](https://directus.io/) for the admin panel

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Contact: your.email@example.com

---

**Demo Project**: This is a portfolio demonstration project showcasing full-stack development skills. Not intended for production use without further security and performance optimizations.
- Bot: `cd bot && python bot.py`