# Comandos do Bot Discord

O bot agora responde a menções com `@deco teste` seguido de comandos.

## 🚀 Como Usar

### 1. **Marcar o Bot**
Para interagir com o bot, marque-o em qualquer canal:
```
@deco teste
```

### 2. **Adicionar Comandos**
Após marcar o bot, adicione um comando:
```
@deco teste ping
@deco teste status
@deco teste help
```

## 📋 Comandos Disponíveis

### 🏓 **ping** - Testar Latência
```
@deco teste ping
```
**Resposta:** Mostra a latência do bot em milissegundos.

### 📊 **status** - Status do Bot
```
@deco teste status
```
**Resposta:** Informações sobre o bot:
- Nome do bot
- Canais monitorados
- Status do Supabase
- Tempo de atividade

### 📖 **help** - Ajuda
```
@deco teste help
```
**Resposta:** Lista todos os comandos disponíveis.

### 🔍 **busca** - Busca Semântica
```
@deco teste busca javascript
@deco teste busca configuração
@deco teste busca debug
```
**Resposta:** Resultados de busca semântica (simulada por enquanto).

### 📈 **stats** - Estatísticas
```
@deco teste stats
```
**Resposta:** Estatísticas do banco de dados:
- Número de mensagens
- Número de embeddings
- Cobertura de embeddings

## 🔧 Exemplos de Uso

### Teste Básico
```
@deco teste ping
```
**Resposta:** `🏓 Pong! Latência: 45ms`

### Verificar Status
```
@deco teste status
```
**Resposta:** 
```
📊 Status do Bot:
• Conectado como: DecoTeste#1234
• Canais monitorados: 1
• Supabase: ✅ Habilitado
• Uptime: 2h 15m
```

### Buscar Mensagens
```
@deco teste busca javascript
```
**Resposta:**
```
📊 Resultados da busca por "javascript":

1. 85.0% - "Como debugar JavaScript?"
2. 78.0% - "Melhores práticas de JavaScript"
3. 72.0% - "Configuração do ambiente JS"

💡 Busca semântica real será implementada em breve!
```

### Ver Estatísticas
```
@deco teste stats
```
**Resposta:**
```
📊 Estatísticas do Banco:
• Mensagens: 25
• Embeddings: 20
• Cobertura: 80.0%
```

## ⚠️ Requisitos

### 1. **Bot Rodando**
```bash
npm run dev
```

### 2. **Permissões do Bot**
O bot precisa ter permissões para:
- ✅ Ler mensagens
- ✅ Enviar mensagens
- ✅ Usar menções

### 3. **Bot no Servidor**
Certifique-se de que o bot está no servidor onde você vai testar.

## 🚨 Troubleshooting

### Bot não responde
1. Verifique se está rodando: `npm run dev`
2. Verifique permissões do bot
3. Verifique se o bot está no servidor

### Erro de permissão
1. Adicione o bot ao servidor
2. Configure permissões adequadas
3. Verifique se o canal permite mensagens do bot

### Comando não reconhecido
Use `@deco teste help` para ver todos os comandos disponíveis.

## 🔮 Próximas Funcionalidades

- ✅ Busca semântica real (não simulada)
- ✅ Busca por usuário específico
- ✅ Busca por período de tempo
- ✅ Filtros avançados
- ✅ Integração com OpenAI para embeddings reais

## 📝 Logs

O bot registra todas as interações no console:
```
🤖 Bot mencionado! Processando comando...
   Autor: usuario123
   Conteúdo: "@deco teste ping"
   Comando: "ping"
   ✅ Resposta enviada: 🏓 Pong! Latência: 45ms
``` 