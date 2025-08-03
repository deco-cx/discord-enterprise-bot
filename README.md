# Discord Channel Monitor Bot

Bot para Discord que monitora canais de texto, salva mensagens em MongoDB e indexa o conteúdo em um banco vetorial (Pinecone). Dispara webhooks a cada nova mensagem para integração com sistemas externos.

## 🚀 Funcionalidades

- 📥 Captura mensagens novas e antigas de canais configurados
- 💾 Armazena mensagens no MongoDB com metadados
- 🧠 Gera embeddings e indexa conteúdo no Pinecone
- 🔄 Mantém sincronização entre banco de documentos e banco vetorial
- 📡 Envia webhook para cada nova mensagem recebida

## ⚙️ Tecnologias

- [Node.js](https://nodejs.org/)
- [discord.js](https://discord.js.org/)
- [MongoDB](https://www.mongodb.com/)
- [Pinecone](https://www.pinecone.io/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Axios](https://axios-http.com/)

## 📁 Estrutura do Projeto

```
src/
├── config.ts         # Configuração de canais e tokens
├── index.ts          # Inicialização do bot
├── listener.ts       # Captura e processamento de mensagens
├── storage/
│   ├── mongo.ts      # Persistência em MongoDB
│   └── pinecone.ts   # Indexação vetorial
└── utils/
    ├── embedder.ts   # Geração de embeddings
    └── webhook.ts    # Disparo de webhooks
```

## 🧪 Pré-requisitos

- Node.js 18+
- MongoDB Atlas ou local
- Conta Pinecone e chave de API
- Bot configurado no [Discord Developer Portal](https://discord.com/developers/applications)

## 📦 Instalação

```bash
git clone https://github.com/seu-usuario/discord-channel-monitor-bot.git
cd discord-channel-monitor-bot
npm install
```

## 🔐 Configuração

Crie um arquivo `.env`:

```
DISCORD_TOKEN=your_discord_token
MONGO_URI=mongodb+srv://...
PINECONE_API_KEY=your_pinecone_key
WEBHOOK_URL=https://yourwebhook.endpoint
```

## ▶️ Rodar o Bot

```bash
npx ts-node src/index.ts
```

## 📤 Webhook

O webhook recebe um payload JSON como:

```json
{
  "channel_id": "123456",
  "message_id": "7891011",
  "content": "Olá mundo",
  "author": {
    "id": "111",
    "username": "usuário"
  },
  "link": "https://discord.com/channels/guild/channel/message"
}
```

## 📌 Futuras melhorias

- Suporte a anexos
- Integração com outros bancos vetoriais
- Busca semântica via comandos do Discord
- Dashboard de administração

## 📝 Licença

MIT
