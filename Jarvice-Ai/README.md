# 🌩️ Jarvice AI - AI-Powered Interview Preparation Platform

A comprehensive full-stack web application that helps job seekers prepare for interviews using AI technology. Built with React, Node.js, Express, and PostgreSQL.

## ✨ Features

### 🤖 AI Chatbot
- **Gemini API Integration**: Real-time AI assistance for interview questions and career guidance
- **Conversation History**: Store and retrieve past chat sessions
- **Contextual Responses**: AI understands interview preparation context

### 🎯 Mock Interview System
- **Resume Upload**: Parse PDF, DOC, DOCX, and TXT files
- **Personalized Questions**: Generate questions based on job description and resume
- **Interactive Practice**: Step-by-step interview simulation
- **AI Feedback**: Detailed performance analysis and improvement suggestions
- **Scoring System**: Quantitative assessment of interview performance

### 💳 Subscription Tiers
- **Free Tier**: Basic chatbot access and limited interviews
- **Premium Tier**: Unlimited features + AI image generation
- **Stripe Integration**: Secure payment processing
- **Flexible Billing**: Monthly subscriptions with easy cancellation

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Email Verification**: Account verification via email
- **Password Reset**: Secure password recovery system
- **Rate Limiting**: API protection against abuse
- **HTTPS Support**: Secure data transmission

### 📧 Email Notifications
- **Welcome Emails**: Onboarding new users
- **Verification Emails**: Account activation
- **Password Reset**: Secure recovery links
- **NodeMailer Integration**: Reliable email delivery

### 🎨 Modern UI/UX
- **Responsive Design**: Works on all devices
- **TailwindCSS**: Modern, clean styling
- **Dark/Light Mode**: User preference support
- **Smooth Animations**: Enhanced user experience
- **Accessibility**: WCAG compliant design

## 🏗️ Architecture

### Frontend (React)
- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Context API**: State management
- **TailwindCSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **React Hot Toast**: User notifications

### Backend (Node.js + Express)
- **Express.js**: Web framework
- **PostgreSQL**: Primary database
- **JWT**: Authentication tokens
- **Multer**: File upload handling
- **NodeMailer**: Email service
- **Stripe**: Payment processing
- **Rate Limiting**: API protection

### Database Schema
```sql
-- Users table
users (id, name, email, password_hash, subscription_status, is_verified, created_at)

-- Chat conversations
chats (id, user_id, message, response, timestamp)

-- Interview sessions
interview_sessions (id, user_id, resume_url, jd_text, feedback, score, created_at)

-- Subscriptions
subscriptions (id, user_id, plan, status, stripe_subscription_id, start_date, end_date)

-- Image generations (premium)
image_generations (id, user_id, prompt, image_url, model, created_at)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/jarvice-ai.git
cd jarvice-ai
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 3. Environment Setup




















```bash
# Copy environment template
cp server/env.example server/.env

# Edit the .env file with your configuration
nano server/.env
```

Required environment variables:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/jarvice_ai
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jarvice_ai
DB_USER=username
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@jarvice-ai.com

# Gemini API
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OpenAI (for image generation)
OPENAI_API_KEY=your-openai-api-key-here

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Database Setup
```bash
# Create PostgreSQL database
createdb jarvice_ai

# The database schema will be created automatically on first run
```

### 5. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually:
# Backend only
npm run server

# Frontend only  
npm run client
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Production Deployment**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

2. **Development Environment**
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Manual Docker Build
```bash
# Build the image
docker build -t jarvice-ai .

# Run the container
docker run -p 5000:5000 --env-file server/.env jarvice-ai
```

## 🌐 Deployment Options

### 1. Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### 2. Render
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `npm install && cd client && npm run build`
4. Set start command: `npm start`
5. Add PostgreSQL database service

### 3. AWS (EC2 + RDS)
1. Launch EC2 instance
2. Install Docker and Docker Compose
3. Clone repository
4. Set up RDS PostgreSQL instance
5. Configure environment variables
6. Deploy with Docker Compose

### 4. Vercel (Frontend) + Railway (Backend)
1. Deploy backend to Railway
2. Deploy frontend to Vercel
3. Update API URLs in frontend

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/signup          # User registration
POST /api/auth/login           # User login
GET  /api/auth/me             # Get current user
POST /api/auth/logout         # User logout
GET  /api/auth/verify/:token  # Verify email
POST /api/auth/forgot-password # Request password reset
POST /api/auth/reset-password  # Reset password
```

### Chat Endpoints
```
POST /api/chat/send           # Send message to AI
GET  /api/chat/history        # Get chat history
DELETE /api/chat/history      # Clear chat history
```

### Interview Endpoints
```
POST /api/interview/start     # Start mock interview
POST /api/interview/answer    # Submit interview answer
GET  /api/interview/history   # Get interview history
GET  /api/interview/session/:id # Get specific interview
```

### Subscription Endpoints
```
GET  /api/subscription/plans  # Get available plans
POST /api/subscription/checkout # Create checkout session
GET  /api/subscription/status # Get subscription status
POST /api/subscription/cancel # Cancel subscription
POST /api/subscription/webhook # Stripe webhook
```

### User Endpoints
```
GET  /api/user/profile        # Get user profile
PUT  /api/user/profile        # Update profile
PUT  /api/user/password       # Change password
DELETE /api/user/account      # Delete account
GET  /api/user/dashboard      # Get dashboard data
```

## 🔧 Configuration

### Email Setup (Gmail)
1. Enable 2-factor authentication
2. Generate app-specific password
3. Use app password in EMAIL_PASS

### Stripe Setup
1. Create Stripe account
2. Get API keys from dashboard
3. Set up webhook endpoint: `/api/subscription/webhook`
4. Configure webhook events

### Gemini API Setup
1. Get API key from Google AI Studio
2. Add to GEMINI_API_KEY environment variable

### OpenAI Setup (for image generation)
1. Get API key from OpenAI
2. Add to OPENAI_API_KEY environment variable

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## 📊 Monitoring & Analytics

### Health Checks
- API Health: `GET /api/health`
- Database Health: Built-in PostgreSQL health checks
- Redis Health: Built-in Redis health checks

### Logging
- Application logs: Console output
- Access logs: Nginx access logs
- Error logs: Nginx error logs

### Metrics
- Response times
- Error rates
- User activity
- Subscription metrics

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API protection
- **CORS Configuration**: Cross-origin security
- **Helmet.js**: Security headers
- **Input Validation**: Request validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Follow conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini**: AI language model
- **OpenAI**: Image generation
- **Stripe**: Payment processing
- **PostgreSQL**: Database
- **React**: Frontend framework
- **Express.js**: Backend framework
- **TailwindCSS**: Styling framework

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/jarvice-ai/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/jarvice-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/jarvice-ai/discussions)
- **Email**: support@jarvice-ai.com

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Basic chatbot functionality
- ✅ Mock interview system
- ✅ User authentication
- ✅ Subscription system

### Phase 2 (Next)
- 🔄 Advanced interview analytics
- 🔄 Video interview practice
- 🔄 Company-specific questions
- 🔄 Resume optimization suggestions

### Phase 3 (Future)
- 📋 AI-powered resume builder
- 📋 Interview scheduling
- 📋 Job matching
- 📋 Career path recommendations

---

**Made with ❤️ by the Jarvice AI Team**

*Helping job seekers succeed, one interview at a time.*
