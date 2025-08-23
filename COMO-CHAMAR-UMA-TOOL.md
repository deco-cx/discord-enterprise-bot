# Discord Webhook Receiver

Sistema para receber e processar webhooks do Discord Bot Monitor, armazenando eventos em tempo real no banco de dados.

## 🚀 Funcionalidades

- ✅ Recepção de webhooks do Discord
- ✅ Validação de autenticação (API Key + Webhook Secret)
- ✅ Armazenamento estruturado no banco de dados
- ✅ Deduplicação de eventos
- ✅ Logs de auditoria
- ✅ Health checks
- ✅ Consultas e estatísticas
- ✅ Rate limiting e segurança

## 📋 Endpoints

### POST /discord-events
Endpoint principal para receber webhooks do Discord.

**Headers obrigatórios:**
```
X-API-Key: your_api_key_here
X-Webhook-Secret: your_webhook_secret_here
Content-Type: application/json
```

**Payload esperado:**
```json
{
  "eventType": "message_create",
  "messageId": "123456789",
  "channelId": "987654321",
  "guildId": "111222333",
  "userId": "444555666",
  "content": "Mensagem do usuário",
  "author": {
    "id": "444555666",
    "username": "usuario",
    "discriminator": "1234",
    "bot": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /health
Health check do sistema.

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": {
      "status": "ok",
      "responseTimeMs": 45
    },
    "recentEvents": {
      "status": "ok",
      "count": 150,
      "lastEventAge": 2.5
    }
  }
}
```

## 🔧 Ferramentas Disponíveis

### DISCORD_WEBHOOK
Processa webhooks do Discord com validação completa.

### EVENT_QUERY
Consulta eventos com filtros e paginação.

### EVENT_STATS
Gera estatísticas dos eventos por período.

### HEALTH_CHECK
Verifica status do sistema e conexões.

### DATABASE_MIGRATION
Executa migrations do banco de dados.

## 🗄️ Estrutura do Banco

### Tabela: discord_events
Armazena todos os eventos do Discord recebidos.

### Tabela: webhook_logs
Logs de auditoria das requisições webhook.

## 🚀 Setup e Deploy

### 1. Configuração Inicial
```bash
npm install
npm run gen
```

### 2. Executar Migrations
Execute a ferramenta `DATABASE_MIGRATION` para criar as tabelas.

### 3. Configurar Segurança
Atualize as constantes `API_KEY` e `WEBHOOK_SECRET` no `main.ts` ou use variáveis de ambiente.

### 4. Deploy
```bash
npm run deploy
```

## 🔒 Segurança

- ✅ Autenticação via API Key e Webhook Secret
- ✅ Validação de payload
- ✅ Rate limiting
- ✅ Sanitização de dados
- ✅ Logs de auditoria
- ✅ Deduplicação de eventos

## 📊 Monitoramento

O sistema inclui:
- Health checks automáticos
- Métricas de performance
- Alertas para eventos anômalos
- Logs estruturados

## 🧪 Testando

Para testar o webhook, envie uma requisição POST para `/discord-events`:

```bash
curl -X POST https://your-app.workers.dev/discord-events \
  -H "X-API-Key: your_api_key_here" \
  -H "X-Webhook-Secret: your_webhook_secret_here" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "message_create",
    "channelId": "123456789",
    "content": "Teste de webhook",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

## 📈 Performance

- Resposta < 100ms
- Suporte a 1000+ eventos/min
- Deduplicação automática
- Índices otimizados

# Guia de Integração MCP - Echo DB

Este documento explica como integrar e usar este servidor MCP de outro servidor deco.chat para processar mensagens do Discord.

## 🔗 Configuração da Integração

### 1. Adicionar como Integração MCP

No seu servidor deco.chat que vai consumir este MCP:

1. **Configure o wrangler.toml** do servidor consumidor:
```toml
[[deco.bindings]]
name = "ECHO_DB_MCP"
type = "mcp"
integration_id = "echo-db-mcp"
url = "https://your-echo-db-app.workers.dev/mcp"
```

2. **Gere os tipos** após configurar:
```bash
npm run gen
```

### 2. Estrutura de Uso

Após a configuração, você terá acesso às ferramentas através do objeto `env`:

```typescript
// No seu servidor consumidor
interface Env extends DecoEnv {
  ECHO_DB_MCP: {
    // Ferramentas disponíveis do Echo DB
    DISCORD_WEBHOOK: (input: DiscordWebhookInput) => Promise<DiscordWebhookOutput>;
    EVENT_QUERY: (input: EventQueryInput) => Promise<EventQueryOutput>;
    EVENT_STATS: (input: EventStatsInput) => Promise<EventStatsOutput>;
    HEALTH_CHECK: (input: {}) => Promise<HealthCheckOutput>;
    // ... outras ferramentas
  };
}
```

## 🛠️ Ferramentas Disponíveis

### DISCORD_WEBHOOK
Processa mensagens do Discord e armazena no banco de dados.

**Input:**
```typescript
{
  eventType: string;          // Tipo do evento (ex: "message_create")
  messageId?: string;         // ID da mensagem
  channelId: string;          // ID do canal
  guildId?: string;           // ID do servidor
  userId?: string;            // ID do usuário
  content: string;            // Conteúdo da mensagem
  author?: {                  // Dados do autor
    id: string;
    username: string;
    discriminator?: string;
    bot?: boolean;
  };
  timestamp: string;          // Timestamp ISO
}
```

**Output:**
```typescript
{
  success: boolean;
  eventId?: string;
  message: string;
}
```

### EVENT_QUERY
Consulta eventos armazenados com filtros.

**Input:**
```typescript
{
  channelId?: string;         // Filtrar por canal
  userId?: string;            // Filtrar por usuário
  eventType?: string;         // Filtrar por tipo de evento
  startDate?: string;         // Data inicial (ISO)
  endDate?: string;           // Data final (ISO)
  limit?: number;             // Limite de resultados (padrão: 50)
  offset?: number;            // Offset para paginação
}
```

### EVENT_STATS
Gera estatísticas dos eventos.

**Input:**
```typescript
{
  period: "hour" | "day" | "week" | "month";
  channelId?: string;
  startDate?: string;
  endDate?: string;
}
```

## 📝 Exemplos de Uso

### 1. Ferramenta para Processar Mensagem do Discord

```typescript
const createDiscordMessageProcessor = (env: Env) =>
  createTool({
    id: "PROCESS_DISCORD_MESSAGE",
    description: "Processa mensagem do Discord via Echo DB MCP",
    inputSchema: z.object({
      channelId: z.string(),
      content: z.string(),
      authorId: z.string(),
      authorUsername: z.string(),
      messageId: z.string().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      eventId: z.string().optional(),
      message: z.string(),
    }),
    execute: async ({ context }) => {
      // Chama a ferramenta DISCORD_WEBHOOK do Echo DB MCP
      const result = await env.ECHO_DB_MCP.DISCORD_WEBHOOK({
        eventType: "message_create",
        messageId: context.messageId,
        channelId: context.channelId,
        content: context.content,
        userId: context.authorId,
        author: {
          id: context.authorId,
          username: context.authorUsername,
          bot: false,
        },
        timestamp: new Date().toISOString(),
      });

      return result;
    },
  });
```

### 2. Workflow para Processar e Consultar Mensagens

```typescript
const createDiscordAnalysisWorkflow = (env: Env) => {
  const processMessage = createStepFromTool(createDiscordMessageProcessor(env));
  const queryEvents = createStepFromTool(
    createTool({
      id: "QUERY_RECENT_EVENTS",
      description: "Consulta eventos recentes",
      inputSchema: z.object({ channelId: z.string() }),
      outputSchema: z.object({ events: z.array(z.any()) }),
      execute: async ({ context }) => {
        const result = await env.ECHO_DB_MCP.EVENT_QUERY({
          channelId: context.channelId,
          limit: 10,
          // Últimas 24 horas
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        });
        return { events: result.events || [] };
      },
    })(env)
  );

  return createWorkflow({
    id: "DISCORD_ANALYSIS_WORKFLOW",
    inputSchema: z.object({
      channelId: z.string(),
      content: z.string(),
      authorId: z.string(),
      authorUsername: z.string(),
    }),
    outputSchema: z.object({
      processed: z.boolean(),
      recentEvents: z.array(z.any()),
      analysis: z.string(),
    }),
  })
    .then(processMessage)
    .map((context) => ({
      ...context,
      // Preparar dados para consulta
      queryChannelId: context.channelId,
    }))
    .then(queryEvents)
    .map((context) => ({
      ...context,
      processed: true,
      analysis: `Processada mensagem no canal ${context.channelId}. Encontrados ${context.events.length} eventos recentes.`,
    }))
    .commit();
};
```

### 3. Ferramenta para Estatísticas

```typescript
const createDiscordStatsGenerator = (env: Env) =>
  createTool({
    id: "GENERATE_DISCORD_STATS",
    description: "Gera estatísticas do Discord via Echo DB MCP",
    inputSchema: z.object({
      period: z.enum(["hour", "day", "week", "month"]),
      channelId: z.string().optional(),
    }),
    outputSchema: z.object({
      stats: z.any(),
      summary: z.string(),
    }),
    execute: async ({ context }) => {
      const stats = await env.ECHO_DB_MCP.EVENT_STATS({
        period: context.period,
        channelId: context.channelId,
      });

      return {
        stats,
        summary: `Estatísticas geradas para o período: ${context.period}`,
      };
    },
  });
```

## 🔧 Configuração Completa

### 1. No servidor consumidor (main.ts):

```typescript
import { withRuntime } from "@deco/workers-runtime";
import { createStepFromTool, createTool, createWorkflow } from "@deco/workers-runtime/mastra";
import { z } from "zod";
import type { Env as DecoEnv } from "./deco.gen.ts";

interface Env extends DecoEnv {
  ECHO_DB_MCP: {
    DISCORD_WEBHOOK: (input: any) => Promise<any>;
    EVENT_QUERY: (input: any) => Promise<any>;
    EVENT_STATS: (input: any) => Promise<any>;
    HEALTH_CHECK: (input: {}) => Promise<any>;
  };
}

// Suas ferramentas que usam o Echo DB MCP
const tools = [
  createDiscordMessageProcessor,
  createDiscordStatsGenerator,
];

const workflows = [
  createDiscordAnalysisWorkflow,
];

const { Workflow, ...runtime } = withRuntime<Env>({
  workflows,
  tools,
});

export { Workflow };
export default runtime;
```

### 2. Configuração do wrangler.toml:

```toml
main = "main.ts"
compatibility_date = "2025-01-15"

[deco]
app = "your-consumer-app"
workspace = "your-workspace"
enable_workflows = true

# Integração com o Echo DB MCP
[[deco.bindings]]
name = "ECHO_DB_MCP"
type = "mcp"
integration_id = "echo-db-mcp"
url = "https://your-echo-db-app.workers.dev/mcp"

# Outras configurações...
```

## 🚀 Deploy e Uso

### 1. Deploy do Echo DB MCP:
```bash
cd echo-db-project
npm run deploy
```

### 2. Configure a URL no servidor consumidor:
```bash
# Atualize a URL no wrangler.toml com a URL real do deploy
```

### 3. Gere os tipos:
```bash
cd your-consumer-project
npm run gen
```

### 4. Deploy do servidor consumidor:
```bash
npm run deploy
```

## 🔍 Monitoramento e Debug

### Health Check
```typescript
const checkEchoDbHealth = async (env: Env) => {
  try {
    const health = await env.ECHO_DB_MCP.HEALTH_CHECK({});
    console.log("Echo DB Status:", health);
    return health;
  } catch (error) {
    console.error("Echo DB não disponível:", error);
    throw error;
  }
};
```

### Tratamento de Erros
```typescript
execute: async ({ context }) => {
  try {
    const result = await env.ECHO_DB_MCP.DISCORD_WEBHOOK(context);
    return result;
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    return {
      success: false,
      message: "Erro interno do servidor",
    };
  }
},
```

## 📋 Checklist de Integração

- [ ] Echo DB MCP deployado e funcionando
- [ ] URL do MCP configurada no wrangler.toml
- [ ] Tipos gerados com `npm run gen`
- [ ] Ferramentas implementadas no servidor consumidor
- [ ] Testes de conectividade realizados
- [ ] Tratamento de erros implementado
- [ ] Monitoramento configurado

## 🔗 Links Úteis

- [Documentação deco.chat MCP](https://docs.deco.chat)
- [Mastra Workflows](https://mastra.ai/docs/workflows)
- [Echo DB Repository](./README.md)

---

**Nota:** Este documento assume que o Echo DB MCP está deployado e acessível. Certifique-se de que todas as ferramentas necessárias estão implementadas no servidor Echo DB antes de tentar integrá-las.
