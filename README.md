# Discord Enterprise Bot

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Enterprise-grade Discord bot with advanced monitoring, health checks, circuit
breaker, and professional logging**

[Features](#features) • [Quick Start](#quick-start) •
[Configuration](#configuration) • [API Reference](#api-reference) •
[Contributing](#contributing)

</div>

## 🚀 Features

### 🛡️ Enterprise-Grade Reliability

- **Circuit Breaker** with exponential backoff retry logic
- **Health Check** endpoints for Kubernetes/Docker deployments
- **Rate Limiting** per channel/event type to prevent API abuse
- **Timeout Management** optimized for AI API integrations (120s default)
- **Keep-Alive** connections for improved performance

### 📊 Advanced Monitoring & Observability

- **Structured Logging** with configurable levels (DEBUG, INFO, WARN, ERROR)
- **Real-time Metrics** collection and performance tracking
- **Circuit Breaker** status monitoring
- **API Response Time** tracking and analytics
- **Event Statistics** with detailed breakdowns

### 🔒 Security & Authentication

- **API Key** authentication for external webhooks
- **Webhook Secret** validation for secure communications
- **Input Validation** and sanitization across all endpoints
- **Environment-based** configuration management

### 🤖 Discord Event Coverage

- **Message Lifecycle**: Create, Update, Delete
- **Reactions**: Add, Remove with emoji tracking
- **Threads**: Create, Update, Delete with metadata
- **Rich Metadata**: Author info, attachments, timestamps

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Discord Bot Token
- External API endpoint (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/deco-cx/discord-enterprise-bot.git
cd discord-enterprise-bot

# Install dependencies
npm install

# Configure environment
cp env.example .env
# Edit .env with your configuration

# Development
npm run dev

# Production
npm run build && npm start
```

## ⚙️ Configuration

### Environment Variables

| Variable                | Required | Default  | Description                              |
| ----------------------- | -------- | -------- | ---------------------------------------- |
| `DISCORD_TOKEN`         | ✅       | -        | Discord bot token                        |
| `API_URL`               | ❌       | -        | External webhook endpoint                |
| `API_TIMEOUT`           | ❌       | `120000` | API timeout in milliseconds              |
| `API_RETRY_ATTEMPTS`    | ❌       | `3`      | Number of retry attempts                 |
| `LOG_LEVEL`             | ❌       | `info`   | Logging level (debug, info, warn, error) |
| `HEALTH_CHECK_PORT`     | ❌       | `3000`   | Health check server port                 |
| `MAX_EVENTS_PER_MINUTE` | ❌       | `100`    | Rate limiting threshold                  |

### Complete Configuration Example

```env
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token_here

# External API Configuration
API_URL=https://your-api-endpoint.com/discord-events
API_TIMEOUT=120000
API_RETRY_ATTEMPTS=3
API_RETRY_DELAY=1000
API_KEEP_ALIVE=true

# Security
API_KEY=your_api_key_here
WEBHOOK_SECRET=your_webhook_secret_here

# Monitoring
LOG_LEVEL=info
LOG_COLORS=true
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PORT=3000

# Rate Limiting
MAX_EVENTS_PER_MINUTE=100
RATE_LIMIT_WINDOW_MS=60000

# Optional: Channel Filtering
MONITORED_CHANNELS=123456789,987654321
```

## 🏥 Health Check Endpoints

The bot exposes several monitoring endpoints for production deployments:

### Available Endpoints

| Endpoint       | Description           | Use Case                    |
| -------------- | --------------------- | --------------------------- |
| `GET /health`  | Overall health status | Load balancer health checks |
| `GET /ready`   | Readiness probe       | Kubernetes readiness probe  |
| `GET /live`    | Liveness probe        | Kubernetes liveness probe   |
| `GET /metrics` | Detailed metrics      | Monitoring dashboards       |

### Health Check Response Example

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": "2h 30m",
  "discord": {
    "connected": true,
    "user": "MyBot#1234"
  },
  "api": {
    "enabled": true,
    "lastSuccessfulCall": "2024-01-01T11:59:45.000Z",
    "successRate": 98.5
  },
  "metrics": {
    "totalEvents": 1543,
    "totalApiRequests": 1520
  }
}
```

## 📡 API Reference

### Discord Event Data Structure

```typescript
interface DiscordEventData {
  eventType:
    | 'message_create'
    | 'message_update'
    | 'message_delete'
    | 'message_reaction_add'
    | 'message_reaction_remove'
    | 'thread_create'
    | 'thread_delete'
    | 'thread_update';
  messageId?: string;
  channelId: string;
  guildId?: string;
  userId?: string;
  content?: string;
  author?: {
    id: string;
    username: string;
    discriminator: string;
    bot: boolean;
  };
  timestamp: string;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
    contentType?: string;
  }>;
  thread?: {
    id: string;
    name: string;
    type: string;
    parentId?: string;
  };
  // Event-specific fields
  oldContent?: string;
  newContent?: string;
  reaction?: {
    emoji: string;
    userId: string;
  };
}
```

### Webhook Integration

External APIs will receive POST requests with the following structure:

```bash
POST /your-webhook-endpoint
Content-Type: application/json
X-API-Key: your_api_key_here
X-Webhook-Secret: your_webhook_secret_here

{
  "eventType": "message_create",
  "messageId": "123456789012345678",
  "channelId": "987654321098765432",
  "content": "Hello world!",
  "author": {
    "id": "222222222222222222",
    "username": "user",
    "discriminator": "1234",
    "bot": false
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🛠️ Development

### Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run watch           # Start with file watching

# Production
npm run build           # Compile TypeScript
npm start              # Run compiled version

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix linting issues
npm run format         # Format with Prettier
npm run type-check     # TypeScript type checking
npm run quality        # Run all quality checks
npm run quality:fix    # Fix all quality issues
```

### Code Quality

This project maintains enterprise-grade code quality with:

- **ESLint** with TypeScript rules and custom configurations
- **Prettier** for consistent code formatting
- **Husky** for automated pre-commit hooks
- **lint-staged** for efficient incremental linting
- **TypeScript** strict mode with comprehensive type checking

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and ensure tests pass: `npm run quality`
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📊 Monitoring & Observability

### Circuit Breaker

- **Automatic Protection**: Opens after 5 consecutive failures
- **Recovery**: Auto-recovery after 60 seconds
- **States**: `closed` → `open` → `half-open` → `closed`
- **Monitoring**: Status available via `/metrics` endpoint

### Retry Logic

- **Intelligent Backoff**: Exponential backoff (1s, 2s, 4s)
- **Configurable Attempts**: Up to 10 retry attempts
- **Smart Detection**: Retries on network errors and 5xx responses
- **Skip Logic**: Skips retry on 4xx client errors

### Logging

```bash
# Example structured log output
2024-01-01T12:00:00.000Z [INFO ] 📤 Event: message_create
{
  "eventType": "message_create",
  "channelId": "123456789",
  "responseTime": "123ms"
}

2024-01-01T12:00:00.123Z [INFO ] API call completed
{
  "method": "POST",
  "url": "https://api.example.com/events",
  "status": 200,
  "duration": "123ms"
}
```

## 🏗️ Architecture

### Core Components

- **MessageListener**: Discord event handling and processing
- **ApiClient**: HTTP client with retry logic and circuit breaker
- **HealthCheckServer**: Monitoring endpoints for deployment
- **Logger**: Structured logging with multiple output levels
- **RateLimiter**: Per-channel rate limiting implementation
- **MetricsCollector**: Performance tracking and analytics
- **ConfigValidator**: Environment configuration validation

### Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript with strict type checking
- **Discord**: Discord.js v14 with full intent support
- **HTTP Client**: Axios with interceptors and retries
- **Logging**: Custom structured logger with metadata
- **Health Checks**: Native HTTP server for monitoring
- **Development**: ESLint, Prettier, Husky for code quality

## 🚀 Deployment

### Discloud Hosting

This project includes a `discloud.config` file for easy deployment on
[Discloud](https://discloudbot.com):

```bash
# Build and create ZIP for Discloud deployment
npm run build:discloud

# Alternatively, build manually:
npm run build

# Upload to Discloud with the following configuration:
TYPE=bot
MAIN=dist/index.js
NAME=discord-enterprise-bot
RAM=256
VERSION=latest
CMD=npm start
```

### Automated Build Script

The `npm run build:discloud` command will:

- ✅ Compile TypeScript to JavaScript (`dist/` folder)
- ✅ Create a ZIP file with timestamp
- ✅ Include only necessary files: `dist/`, `package.json`, `discloud.config`,
  `.env` (if exists)
- ❌ Exclude: `node_modules/`, `package-lock.json`, `.git/`, source files

### Environment Setup for Discloud

1. Run `npm run build:discloud` to create the deployment ZIP
2. Upload the generated ZIP file to Discloud
3. Set environment variables in Discloud dashboard
4. The bot will automatically start with health checks enabled

### Other Deployment Options

- **Docker**: Use the provided health check endpoints for container
  orchestration
- **Kubernetes**: Ready for K8s deployment with liveness/readiness probes
- **PM2**: Compatible with PM2 process manager
- **Heroku**: Works with Heroku's dyno system

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🤝 Support

- 📖 [Documentation](https://github.com/deco-cx/discord-enterprise-bot/wiki)
- 🐛 [Issue Tracker](https://github.com/deco-cx/discord-enterprise-bot/issues)
- 💬
  [Discussions](https://github.com/deco-cx/discord-enterprise-bot/discussions)

---

<div align="center">

**Built with ❤️ by [deco.cx](https://deco.cx)**

[⭐ Star this repo](https://github.com/deco-cx/discord-enterprise-bot) •
[🍴 Fork it](https://github.com/deco-cx/discord-enterprise-bot/fork) •
[📢 Share it](https://twitter.com/intent/tweet?text=Check%20out%20this%20amazing%20Discord%20Enterprise%20Bot!&url=https://github.com/deco-cx/discord-enterprise-bot)

</div>
