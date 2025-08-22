# Discord Bot Monitor

Bot avançado para Discord que monitora eventos de mensagens, reações e threads com sistema robusto de logging, métricas, rate limiting e health checks.

## ✨ Funcionalidades

### 📡 Monitoramento de Eventos Discord
- ✅ **Criação de mensagens** (`message_create`)
- ✅ **Edição de mensagens** (`message_update`)
- ✅ **Exclusão de mensagens** (`message_delete`)
- ✅ **Adição de reações** (`message_reaction_add`)
- ✅ **Remoção de reações** (`message_reaction_remove`)
- ✅ **Criação de threads** (`thread_create`)
- ✅ **Exclusão de threads** (`thread_delete`)
- ✅ **Atualização de threads** (`thread_update`)

### 🛡️ Recursos Avançados
- 🔄 **Retry Automático** com backoff exponencial
- ⚡ **Circuit Breaker** para proteção contra falhas
- 📊 **Rate Limiting** configurável por canal
- 🏥 **Health Check** com endpoints de monitoramento
- 📝 **Logging Estruturado** com níveis configuráveis
- 📈 **Métricas de Performance** em tempo real
- 🔒 **Autenticação** com API keys e webhook secrets
- ⏱️ **Timeout Configurável** (padrão 120s para IAs)
- 🔗 **Keep-Alive** para conexões HTTP
- ✅ **Validação de Configuração** com schema validation

## Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd discord-bot-monitor
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# ===== CONFIGURAÇÃO OBRIGATÓRIA =====
DISCORD_TOKEN=your_discord_bot_token_here

# ===== API EXTERNA =====
API_URL=https://your-api-endpoint.com/discord-events
API_TIMEOUT=120000                    # Timeout em ms (padrão: 120s para IAs)
API_RETRY_ATTEMPTS=3                  # Tentativas de retry (padrão: 3)
API_RETRY_DELAY=1000                  # Delay entre retries em ms (padrão: 1s)
API_KEEP_ALIVE=true                   # Keep-alive para conexões HTTP

# ===== SEGURANÇA =====
API_KEY=your_api_key_here             # API key para autenticação
WEBHOOK_SECRET=your_webhook_secret    # Secret para webhook validation

# ===== LOGGING =====
LOG_LEVEL=info                        # debug, info, warn, error
LOG_COLORS=true                       # Colorir logs no terminal

# ===== RATE LIMITING =====
MAX_EVENTS_PER_MINUTE=100            # Máximo de eventos por minuto por canal
RATE_LIMIT_WINDOW_MS=60000           # Janela de tempo para rate limiting

# ===== HEALTH CHECK =====
HEALTH_CHECK_ENABLED=true            # Habilitar health check server
HEALTH_CHECK_PORT=3000               # Porta do health check server

# ===== MONITORAMENTO =====
MONITORED_CHANNELS=123,456,789       # Canais específicos (opcional)
```

### 4. Execute o bot
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🏥 Health Check Endpoints

O bot expõe vários endpoints para monitoramento:

```bash
# Status geral de saúde
GET http://localhost:3000/health

# Métricas detalhadas
GET http://localhost:3000/metrics

# Verificação de prontidão (ready)
GET http://localhost:3000/ready

# Verificação de vivacidade (liveness)
GET http://localhost:3000/live
```

### Exemplo de Resposta do Health Check:
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

## Estrutura dos Dados Enviados

Cada evento enviado para a API contém as seguintes informações:

```typescript
interface DiscordEventData {
  eventType: 'message_create' | 'message_update' | 'message_delete' | 'message_reaction_add' | 'message_reaction_remove' | 'thread_create' | 'thread_delete' | 'thread_update';
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
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
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
  oldContent?: string; // Para message_update
  newContent?: string; // Para message_update
  reaction?: {
    emoji: string;
    userId: string;
  }; // Para eventos de reação
}
```

## Configuração do Bot Discord

1. Vá ao [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma nova aplicação
3. Vá para a seção "Bot" e crie um bot
4. Copie o token e cole na variável `DISCORD_TOKEN`
5. Na seção "OAuth2 > URL Generator":
   - Marque "bot" em Scopes
   - Marque as seguintes permissões em Bot Permissions:
     - View Channels
     - Read Message History
     - Use Slash Commands (opcional)

## Exemplo de Uso da API

O bot enviará requisições HTTP POST para a URL configurada em `API_URL`:

```bash
POST /discord-events
Content-Type: application/json

{
  "eventType": "message_create",
  "messageId": "123456789012345678",
  "channelId": "987654321098765432",
  "guildId": "111111111111111111",
  "userId": "222222222222222222",
  "content": "Olá mundo!",
  "author": {
    "id": "222222222222222222",
    "username": "usuario",
    "discriminator": "1234",
    "bot": false
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "attachments": []
}
```

## Scripts Disponíveis

### 🚀 Execução
- `npm run dev` - Executa em modo desenvolvimento com reload automático
- `npm run build` - Compila o TypeScript para JavaScript
- `npm start` - Executa a versão compilada
- `npm run watch` - Executa em modo watch

### 🔧 Qualidade de Código
- `npm run lint` - Executa ESLint para verificar problemas no código
- `npm run lint:fix` - Executa ESLint e corrige problemas automaticamente
- `npm run format` - Formata código com Prettier
- `npm run format:check` - Verifica se código está formatado corretamente
- `npm run type-check` - Verifica tipos TypeScript sem gerar arquivos
- `npm run quality` - Executa verificação completa (tipos + lint + formato)
- `npm run quality:fix` - Executa correção completa (tipos + lint:fix + format)

## 📊 Logging e Monitoramento

### Níveis de Log
- `DEBUG`: Informações detalhadas para debugging
- `INFO`: Informações gerais de operação
- `WARN`: Avisos sobre situações atípicas
- `ERROR`: Erros que precisam de atenção

### Métricas Coletadas
- **Eventos por tipo**: Contagem e tempo de resposta
- **Taxa de sucesso**: Percentual de APIs calls bem-sucedidas
- **Rate limiting**: Estatísticas de limitação por canal
- **Circuit breaker**: Status e falhas do circuit breaker
- **Uptime**: Tempo de atividade do bot

### Exemplo de Log Estruturado:
```
2024-01-01T12:00:00.000Z [INFO ] 📤 Event: message_create
2024-01-01T12:00:00.123Z [INFO ] API call completed
{
  "method": "POST",
  "url": "https://api.example.com/events",
  "status": 200,
  "duration": "123ms"
}
```

## 🔧 Recursos de Robustez

### Circuit Breaker
- Protege contra sobrecarga da API externa
- Abre após 5 falhas consecutivas
- Reseta automaticamente após 60 segundos
- Estado: `closed` → `open` → `half-open` → `closed`

### Retry com Backoff
- Até 3 tentativas por evento (configurável)
- Backoff exponencial: 1s, 2s, 4s
- Retry automático para timeouts e erros 5xx

### Rate Limiting
- Limite configurável por canal/tipo de evento
- Janela deslizante de tempo
- Previne spam em canais muito ativos

## 🔧 Ferramentas de Qualidade de Código

### 📏 ESLint
- **Linting avançado** para TypeScript
- **Regras customizadas** para boas práticas
- **Integração com Prettier** para formatação
- **Verificação automática** de tipos e padrões

### 🎨 Prettier
- **Formatação automática** de código
- **Consistência de estilo** em todo o projeto
- **Integração IDE** para formatação on-save
- **Configuração otimizada** para TypeScript

### 🪝 Git Hooks (Husky + lint-staged)
- **Pre-commit hooks** automáticos
- **Linting incremental** apenas em arquivos modificados
- **Formatação automática** antes do commit
- **Garante qualidade** em todos os commits

### Exemplo de Workflow:
```bash
# Verificar qualidade completa
npm run quality

# Corrigir todos os problemas automaticamente
npm run quality:fix

# Commit automático (hooks rodam automaticamente)
git add .
git commit -m "feat: nova funcionalidade"
```

## 🛠️ Tecnologias

### Core
- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática  
- **Discord.js** - Biblioteca para interação com a API do Discord
- **Axios** - Cliente HTTP avançado com retry e circuit breaker
- **dotenv** - Gerenciamento de variáveis de ambiente

### Monitoramento & Robustez
- **Sistema de Health Check** - Monitoramento interno
- **Logger Estruturado** - Logging profissional com níveis
- **Rate Limiter** - Controle de fluxo de eventos
- **Metrics Collector** - Coleta de métricas em tempo real

### Qualidade de Código
- **ESLint** - Linting e análise estática
- **Prettier** - Formatação automática de código
- **Husky** - Git hooks para automação
- **lint-staged** - Linting incremental otimizado