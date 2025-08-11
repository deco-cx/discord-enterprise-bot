# Testes de Busca Semântica

Este documento explica como testar a funcionalidade de busca semântica do bot Discord.

## Pré-requisitos

1. **Supabase configurado**: Certifique-se de que o Supabase está configurado e funcionando
2. **Tabelas criadas**: Execute o script `supabase-setup.sql` para criar as tabelas necessárias
3. **Bot funcionando**: O bot deve estar coletando mensagens no Supabase

## Scripts Disponíveis

### 1. Teste Básico de Busca Semântica
```bash
npm run test-semantic-search
```
Este script executa testes automatizados para verificar:
- Conexão com Supabase
- Estatísticas do banco de dados
- Busca semântica com embeddings de exemplo
- Testes com diferentes thresholds de similaridade

### 2. Geração de Embeddings de Teste
```bash
# Gerar embeddings para mensagens existentes
npm run generate-embeddings generate

# Criar embeddings de exemplo para teste
npm run generate-embeddings sample

# Limpar embeddings de teste
npm run generate-embeddings cleanup
```

### 3. Busca Semântica Interativa
```bash
npm run interactive-search
```
Interface interativa para testar buscas personalizadas.

## Como Usar

### Passo 1: Preparar o Ambiente
1. Configure o arquivo `.env` com suas credenciais do Supabase
2. Execute o bot para coletar algumas mensagens:
   ```bash
   npm run dev
   ```

### Passo 2: Gerar Embeddings
```bash
# Criar embeddings de exemplo para teste
npm run generate-embeddings sample
```

### Passo 3: Testar a Busca
```bash
# Teste automatizado
npm run test-semantic-search

# Ou use a interface interativa
npm run interactive-search
```

## Interface Interativa

O script `interactive-search` oferece uma interface para testar buscas personalizadas:

### Comandos Disponíveis
- `quit` ou `exit` - Sair do programa
- `stats` - Mostrar estatísticas do banco
- `help` - Mostrar ajuda
- `threshold:0.6` - Ajustar threshold de similaridade
- `limit:10` - Ajustar número de resultados

### Exemplos de Busca
```
como configurar
problemas com node
melhores práticas
debug javascript
threshold:0.5 como debugar
limit:10 desenvolvimento
configuração ambiente
otimização performance
```

## Estrutura do Banco de Dados

### Tabela `messages`
Armazena as mensagens do Discord:
- `_id` - ID único da mensagem
- `content` - Conteúdo da mensagem
- `channel_id` - ID do canal
- `user_id` - ID do usuário
- `timestamp` - Data/hora da mensagem
- `thread_title` - Título da thread (se aplicável)
- `channel_name` - Nome do canal
- E outros campos...

### Tabela `message_embeddings`
Armazena os embeddings para busca semântica:
- `id` - ID da mensagem (referência para `messages._id`)
- `content` - Conteúdo da mensagem
- `title` - Título da thread ou canal
- `full_text` - Conteúdo + título combinados para busca
- `embedding` - Vetor de embedding (1536 dimensões)
- `metadata` - Metadados adicionais (JSONB)
- `created_at` - Data de criação

### Função `match_message_embeddings`
Função PostgreSQL para busca semântica:
```sql
match_message_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
```

## Configuração de Threshold

O threshold determina a similaridade mínima para retornar resultados:
- `0.9` - Muito restritivo (apenas muito similares)
- `0.7` - Moderado (padrão)
- `0.5` - Menos restritivo (mais resultados)
- `0.3` - Muito permissivo (muitos resultados)

## Troubleshooting

### Nenhum Resultado Encontrado
1. Verifique se há embeddings no banco:
   ```bash
   npm run test-semantic-search
   ```
2. Gere embeddings de exemplo:
   ```bash
   npm run generate-embeddings sample
   ```
3. Reduza o threshold:
   ```
   threshold:0.5 sua busca aqui
   ```

### Erro de Conexão
1. Verifique as credenciais do Supabase no `.env`
2. Teste a conexão:
   ```bash
   npm run test-supabase
   ```

### Erro de Função PostgreSQL
1. Execute o script `supabase-setup.sql` no Supabase
2. Verifique se a extensão `pgvector` está habilitada
3. Confirme se a função `match_message_embeddings` foi criada

## Próximos Passos

Para implementar busca semântica real (não simulada):

1. **Integrar com OpenAI**: Use a API da OpenAI para gerar embeddings reais
2. **Processamento em Lote**: Implemente geração automática de embeddings para novas mensagens
3. **Cache de Embeddings**: Implemente cache para evitar regeneração desnecessária
4. **Filtros Avançados**: Adicione filtros por canal, usuário, data, etc.

## Exemplo de Uso Completo

```bash
# 1. Configurar e executar o bot
npm run dev

# 2. Em outro terminal, gerar embeddings de exemplo
npm run generate-embeddings sample

# 3. Testar busca semântica
npm run interactive-search

# 4. Fazer buscas como:
# "como configurar ambiente"
# "problemas com instalação"
# "melhores práticas código"
``` 