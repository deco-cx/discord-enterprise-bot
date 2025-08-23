# 🔗 Integração Discord Bot Monitor → Echo DB MCP

Este guia mostra como configurar o Discord Bot Monitor para enviar webhooks para o Echo DB MCP conforme especificado no documento `COMO-CHAMAR-UMA-TOOL.md`.

## ⚙️ Configuração do Discord Bot Monitor

### 1. **Arquivo .env**

Configure o Discord Bot Monitor para enviar webhooks para o Echo DB MCP:

```bash
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here

# API Configuration - Echo DB MCP
API_URL=https://localhost-f6b2fd7c.deco.host/mcp
API_TIMEOUT=120000
API_RETRY_ATTEMPTS=3
API_RETRY_DELAY=1000
API_KEEP_ALIVE=true

# Security Configuration (obrigatório para Echo DB)
API_KEY=your_secure_api_key_here
WEBHOOK_SECRET=your_webhook_secret_here

# Logging Configuration
LOG_LEVEL=info
LOG_COLORS=true

# Rate Limiting Configuration
MAX_EVENTS_PER_MINUTE=100
RATE_LIMIT_WINDOW_MS=60000

# Health Check Configuration
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PORT=3000
```

### 2. **Headers Enviados Automaticamente**

O Discord Bot Monitor enviará automaticamente uma chamada MCP:

```http
POST /mcp HTTP/1.1
Host: localhost-f6b2fd7c.deco.host
Content-Type: application/json
X-API-Key: your_secure_api_key_here
X-Webhook-Secret: your_webhook_secret_here
User-Agent: Discord-Bot-Monitor/1.0.0

{
  "method": "tools/call",
  "params": {
    "name": "DISCORD_WEBHOOK",
    "arguments": {
      "eventType": "message_create",
      "messageId": "1234567890123456789",
      "channelId": "9876543210987654321",
      "content": "Mensagem do Discord",
      ...
    }
  }
}
```

## 📦 Estrutura dos Dados Enviados

O Discord Bot Monitor enviará eventos neste formato para o Echo DB MCP:

### **Evento: message_create**
```json
{
  "eventType": "message_create",
  "messageId": "1234567890123456789",
  "channelId": "9876543210987654321",
  "guildId": "1111111111111111111",
  "userId": "2222222222222222222",
  "content": "Conteúdo da mensagem do usuário",
  "author": {
    "id": "2222222222222222222",
    "username": "usuario",
    "discriminator": "1234",
    "bot": false
  },
  "timestamp": "2025-08-22T23:45:00.000Z",
  "attachments": [
    {
      "id": "attachment_id",
      "filename": "image.png",
      "url": "https://cdn.discordapp.com/attachments/...",
      "size": 1024,
      "contentType": "image/png"
    }
  ],
  "reactions": []
}
```

### **Evento: message_reaction_add**
```json
{
  "eventType": "message_reaction_add",
  "messageId": "1234567890123456789",
  "channelId": "9876543210987654321",
  "guildId": "1111111111111111111",
  "userId": "2222222222222222222",
  "timestamp": "2025-08-22T23:45:00.000Z",
  "reaction": {
    "emoji": "👍",
    "userId": "2222222222222222222"
  }
}
```

### **Evento: thread_create**
```json
{
  "eventType": "thread_create",
  "channelId": "9876543210987654321",
  "guildId": "1111111111111111111",
  "timestamp": "2025-08-22T23:45:00.000Z",
  "thread": {
    "id": "thread_id_here",
    "name": "Nome da Thread",
    "type": "GUILD_PUBLIC_THREAD",
    "parentId": "9876543210987654321"
  }
}
```

## 🔧 Configuração do Echo DB MCP

### 1. **Implementação da Ferramenta DISCORD_WEBHOOK**

No seu Echo DB MCP, implemente a ferramenta conforme o documento:

```typescript
const DISCORD_WEBHOOK = createTool({
  id: "DISCORD_WEBHOOK",
  description: "Processa webhooks do Discord com validação completa",
  inputSchema: z.object({
    eventType: z.string(),
    messageId: z.string().optional(),
    channelId: z.string(),
    guildId: z.string().optional(),
    userId: z.string().optional(),
    content: z.string().optional(),
    author: z.object({
      id: z.string(),
      username: z.string(),
      discriminator: z.string().optional(),
      bot: z.boolean().optional(),
    }).optional(),
    timestamp: z.string(),
    attachments: z.array(z.any()).optional(),
    reactions: z.array(z.any()).optional(),
    thread: z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      parentId: z.string().optional(),
    }).optional(),
    reaction: z.object({
      emoji: z.string(),
      userId: z.string(),
    }).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    eventId: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ context, env }) => {
    // Validar headers de segurança
    const apiKey = env.request.headers.get('X-API-Key');
    const webhookSecret = env.request.headers.get('X-Webhook-Secret');
    
    if (!apiKey || !webhookSecret) {
      throw new Error('Missing authentication headers');
    }
    
    // Processar e armazenar evento
    const eventId = await storeDiscordEvent(context);
    
    return {
      success: true,
      eventId,
      message: `Event ${context.eventType} processed successfully`
    };
  }
});
```

### 2. **Endpoint HTTP /discord-events**

```typescript
// No seu main.ts do Echo DB MCP
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/discord-events' && request.method === 'POST') {
      try {
        // Validar headers
        const apiKey = request.headers.get('X-API-Key');
        const webhookSecret = request.headers.get('X-Webhook-Secret');
        
        if (apiKey !== env.API_KEY || webhookSecret !== env.WEBHOOK_SECRET) {
          return new Response('Unauthorized', { status: 401 });
        }
        
        // Processar payload
        const payload = await request.json();
        
        // Chamar ferramenta DISCORD_WEBHOOK
        const result = await tools.DISCORD_WEBHOOK.execute({
          context: payload,
          env: { ...env, request }
        });
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.pathname === '/health' && request.method === 'GET') {
      // Health check implementation
      return new Response(JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
```

## 🧪 Testando a Integração

### 1. **Teste Manual da Tool MCP**

```bash
curl -X POST https://localhost-f6b2fd7c.deco.host/mcp \
  -H "X-API-Key: your_secure_api_key_here" \
  -H "X-Webhook-Secret: your_webhook_secret_here" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "DISCORD_WEBHOOK",
      "arguments": {
        "eventType": "message_create",
        "channelId": "123456789",
        "content": "Teste de integração MCP",
        "timestamp": "2025-08-22T23:45:00.000Z"
      }
    }
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "eventId": "evt_123456789",
  "message": "Event message_create processed successfully"
}
```

### 2. **Logs do Discord Bot Monitor**

Quando funcionando corretamente, você verá:

```
📨 Message received
🔍 Processing message
✅ Sending event to API: message_create
API call completed { "status": 200, "duration": "150ms" }
```

### 3. **Health Check**

```bash
curl https://your-echo-db-app.workers.dev/health
```

## 🔒 Segurança

### **Validações Implementadas:**

1. ✅ **Headers obrigatórios**: `X-API-Key` e `X-Webhook-Secret`
2. ✅ **Validação de payload**: Schema validation com Zod
3. ✅ **Rate limiting**: Configurável no Discord Bot Monitor
4. ✅ **Retry logic**: Backoff exponencial para falhas temporárias
5. ✅ **Timeout**: Configurável (padrão 120s)

### **Configuração de Segurança:**

```bash
# Use chaves seguras e únicas
API_KEY=sk_live_1234567890abcdef...
WEBHOOK_SECRET=whsec_1234567890abcdef...
```

## 📊 Monitoramento

### **Métricas do Discord Bot Monitor:**

- Total de eventos enviados
- Taxa de sucesso das requisições
- Tempo de resposta médio
- Eventos por tipo (message_create, reactions, etc.)

### **Health Checks:**

- Status da conexão Discord
- Status da API externa (Echo DB)
- Métricas de performance

## 🚀 Deploy

### 1. **Deploy do Discord Bot Monitor:**

```bash
# Gerar ZIP com configuração
npm run build:discloud

# Upload no Discloud com variáveis:
# DISCORD_TOKEN=seu_token
# API_URL=https://your-echo-db-app.workers.dev/discord-events  
# API_KEY=sua_api_key
# WEBHOOK_SECRET=seu_webhook_secret
```

### 2. **Deploy do Echo DB MCP:**

```bash
# No projeto Echo DB MCP
npm run deploy

# Configurar variáveis no Cloudflare Workers:
# API_KEY=mesma_api_key_do_bot
# WEBHOOK_SECRET=mesmo_webhook_secret_do_bot
```

## ✅ Checklist de Integração

- [ ] Discord Bot Monitor configurado com URL do Echo DB
- [ ] API_KEY e WEBHOOK_SECRET configurados em ambos os sistemas
- [ ] Echo DB MCP implementa ferramenta DISCORD_WEBHOOK
- [ ] Endpoint /discord-events responde corretamente
- [ ] Headers de autenticação validados
- [ ] Teste manual funcionando
- [ ] Health checks operacionais
- [ ] Logs estruturados configurados
- [ ] Deploy em produção realizado

---

**Com essa configuração, o Discord Bot Monitor enviará automaticamente todos os eventos Discord para o Echo DB MCP, que processará e armazenará os dados conforme especificado!** 🚀📊
