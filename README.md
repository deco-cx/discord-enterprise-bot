# Discord Channel Monitor Bot

Bot para Discord que monitora canais de texto e salva mensagens no Supabase.

## 🚀 Funcionalidades

- 📥 Captura mensagens novas e antigas de canais configurados
- 💾 Armazena mensagens no Supabase com metadados completos
- ✏️ Suporte a edição e exclusão de mensagens
- 🔍 Busca por canal, usuário e mensagens recentes

## ⚙️ Tecnologias

- [Node.js](https://nodejs.org/) 18+
- [discord.js](https://discord.js.org/) v14
- [Supabase](https://supabase.com/) (PostgreSQL)
- [TypeScript](https://www.typescriptlang.org/)

## 📁 Estrutura do Projeto

```
src/
├── config.ts         # Configuração de canais e tokens
├── index.ts          # Inicialização do bot
├── listener.ts       # Captura e processamento de mensagens
├── types/
│   └── index.ts      # Tipos TypeScript
└── storage/
    └── supabase.ts   # Persistência no Supabase
```

## 🧪 Pré-requisitos

- Node.js 18+
- Projeto Supabase configurado
- Bot configurado no [Discord Developer Portal](https://discord.com/developers/applications)

## 📦 Instalação

```bash
git clone https://github.com/seu-usuario/discord-channel-monitor-bot.git
cd discord-channel-monitor-bot
npm install
```

## 🔐 Configuração

### 1. Criar Bot no Discord

1. Vá até o [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma nova aplicação
3. Vá para a seção "Bot" e crie um bot
4. Habilite os **Privileged Intents**:
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT
5. Copie o token do bot

### 2. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL em `supabase-setup.sql`
3. Copie as credenciais do projeto (URL e anon key)

### 3. Configurar Variáveis de Ambiente

Copie o arquivo `env.supabase.example` para `.env`:

```bash
cp env.supabase.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Discord Bot Token
DISCORD_TOKEN=your_discord_bot_token_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_TABLE=messages

# Monitored Channels (comma-separated Discord channel IDs)
MONITORED_CHANNELS=channel_id_1,channel_id_2,channel_id_3
```

## 🚀 Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 🧪 Testes

### Testar Conexão com Supabase
```bash
npm run test-supabase
```

### Verificar Permissões do Bot
```bash
npm run check-permissions
```

## 📊 Funcionalidades

### Operações CRUD

```typescript
// Salvar mensagem
await supabaseStorage.saveMessage(discordMessage);

// Buscar mensagem
const message = await supabaseStorage.getMessage(messageId);

// Deletar mensagem
await supabaseStorage.deleteMessage(messageId);

// Buscar por canal
const messages = await supabaseStorage.getMessagesByChannel(channelId);

// Buscar por usuário
const messages = await supabaseStorage.getMessagesByUser(userId);

// Buscar recentes
const messages = await supabaseStorage.getRecentMessages(100);
```

## 📈 Vantagens do Supabase

- ✅ **PostgreSQL**: Banco robusto e confiável
- ✅ **Interface Web**: Dashboard intuitivo
- ✅ **APIs Automáticas**: REST e GraphQL
- ✅ **Real-time**: Subscriptions em tempo real
- ✅ **Gratuito**: Plano generoso
- ✅ **Escalável**: Cresce conforme necessário

## 📚 Documentação

- [SUPABASE-SETUP.md](./SUPABASE-SETUP.md) - Guia completo de setup do Supabase
- [README-SUPABASE.md](./README-SUPABASE.md) - Documentação da migração

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a [documentação do Supabase](./SUPABASE-SETUP.md)
2. Abra uma [issue](https://github.com/seu-usuario/discord-channel-monitor-bot/issues)
3. Consulte os [logs do bot](#logs)

## 📝 Logs

O bot gera logs detalhados para facilitar o debug:

```
🔧 Configuração do Bot:
  ✅ Discord: Habilitado
  ✅ Supabase: Habilitado
  📺 Canais monitorados: 3

🤖 Bot conectado como DiscordBot#1234
✅ Conectado ao Supabase

🔍 Nova mensagem recebida:
   Canal: 1234567890123456789 (#general)
   Autor: Usuario#1234
   Conteúdo: "Olá, mundo!"
   ✅ Processando mensagem...
📝 Nova mensagem salva no Supabase: 9876543210987654321
   ✅ Mensagem processada com sucesso!
```
