# 📡 Exemplo de Chamada MCP - DISCORD_WEBHOOK

## 🎯 Formato da Chamada

O Discord Bot Monitor enviará exatamente este formato para o endpoint MCP:

### **POST https://localhost-f6b2fd7c.deco.host/mcp**

**Headers:**
```http
Content-Type: application/json
X-API-Key: your_api_key_here
X-Webhook-Secret: your_webhook_secret_here
User-Agent: Discord-Bot-Monitor/1.0.0
```

**Payload:**
```json
{
  "tool": "DISCORD_WEBHOOK",
  "input": {
    "eventType": "message_create",
    "messageId": "1234567890123456789",
    "channelId": "987654321098765432",
    "guildId": "111222333444555666",
    "userId": "444555666777888999",
    "content": "Olá! Esta é uma mensagem de teste do Discord.",
    "author": {
      "id": "444555666777888999",
      "username": "usuario_teste",
      "discriminator": "1234",
      "bot": false
    },
    "timestamp": "2024-01-15T14:30:00.000Z",
    "attachments": [],
    "reactions": []
  }
}
```

## 🔧 Outros Tipos de Eventos

### **Reação Adicionada:**
```json
{
  "tool": "DISCORD_WEBHOOK",
  "input": {
    "eventType": "message_reaction_add",
    "messageId": "1234567890123456789",
    "channelId": "987654321098765432",
    "guildId": "111222333444555666",
    "userId": "444555666777888999",
    "timestamp": "2024-01-15T14:35:00.000Z",
    "reaction": {
      "emoji": "👍",
      "userId": "444555666777888999"
    }
  }
}
```

### **Thread Criada:**
```json
{
  "tool": "DISCORD_WEBHOOK",
  "input": {
    "eventType": "thread_create",
    "channelId": "987654321098765432",
    "guildId": "111222333444555666",
    "timestamp": "2024-01-15T14:40:00.000Z",
    "thread": {
      "id": "thread_123456789",
      "name": "Discussão sobre o projeto",
      "type": "GUILD_PUBLIC_THREAD",
      "parentId": "987654321098765432"
    }
  }
}
```

### **Mensagem com Anexos:**
```json
{
  "tool": "DISCORD_WEBHOOK",
  "input": {
    "eventType": "message_create",
    "messageId": "1234567890123456789",
    "channelId": "987654321098765432",
    "guildId": "111222333444555666",
    "userId": "444555666777888999",
    "content": "Olha essa imagem!",
    "author": {
      "id": "444555666777888999",
      "username": "usuario_teste",
      "discriminator": "1234",
      "bot": false
    },
    "timestamp": "2024-01-15T14:30:00.000Z",
    "attachments": [
      {
        "id": "attachment_987654321",
        "filename": "screenshot.png",
        "url": "https://cdn.discordapp.com/attachments/.../screenshot.png",
        "size": 2048576,
        "contentType": "image/png"
      }
    ],
    "reactions": []
  }
}
```

## 🧪 Teste Manual

Para testar se o endpoint MCP está funcionando:

```bash
curl -X POST https://localhost-f6b2fd7c.deco.host/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_key" \
  -H "X-Webhook-Secret: test_secret" \
  -d '{
    "tool": "DISCORD_WEBHOOK",
    "input": {
      "eventType": "message_create",
      "messageId": "1234567890123456789",
      "channelId": "987654321098765432",
      "guildId": "111222333444555666",
      "userId": "444555666777888999",
      "content": "Teste de integração MCP",
      "author": {
        "id": "444555666777888999",
        "username": "teste_usuario",
        "discriminator": "0001",
        "bot": false
      },
      "timestamp": "2025-08-22T22:55:00.000Z"
    }
  }'
```

## ✅ Resposta Esperada

O servidor MCP deve retornar algo como:

```json
{
  "success": true,
  "eventId": "evt_1234567890",
  "message": "Event message_create processed successfully"
}
```

## 🔍 Logs do Discord Bot Monitor

Quando o bot enviar eventos, você verá nos logs:

```
📨 Message received
🔍 Processing message
✅ Sending event to API: message_create
API call completed { "status": 200, "duration": "150ms" }
```

---

**Este é o formato exato que o Discord Bot Monitor enviará para o endpoint MCP!** 🚀
