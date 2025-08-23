# 🔒 Guia de Segurança - Discord Enterprise Bot

## ⚠️ ALERTA DE SEGURANÇA

**NUNCA commite tokens, chaves de API ou arquivos .env no repositório Git!**

## 🚨 Vazamento de Token Detectado

Se você chegou aqui porque um token foi exposto no GitHub:

### 1. **AÇÃO IMEDIATA - Regenerar Token**

```bash
# 1. Acesse https://discord.com/developers/applications
# 2. Selecione seu bot
# 3. Vá em "Bot" → "Token" → "Regenerate"
# 4. Copie o novo token
# 5. Atualize suas variáveis de ambiente
```

### 2. **Limpar Histórico do Git**

```bash
# Instalar BFG Repo-Cleaner
brew install bfg  # ou baixe de https://rtyley.github.io/bfg-repo-cleaner/

# Remover arquivos sensíveis do histórico
bfg --delete-files "*.zip" --delete-files ".env"
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Force push (CUIDADO!)
git push --force-with-lease
```

## 🛡️ Práticas de Segurança

### **Arquivos que NUNCA devem ser commitados:**

- ❌ `.env` (contém tokens)
- ❌ `*.zip` (podem conter .env)
- ❌ `*.tar.gz` (podem conter .env)
- ❌ Qualquer arquivo com tokens/chaves

### **Configuração Segura:**

#### **1. Desenvolvimento Local:**

```bash
# Copie o template
cp env.example .env

# Edite com seus tokens reais
nano .env

# Verifique se .env está no .gitignore
git check-ignore .env  # deve retornar: .env
```

#### **2. Deploy no Discloud:**

```bash
# Gere ZIP sem .env
npm run build:discloud

# Configure variáveis no painel do Discloud:
DISCORD_TOKEN=seu_token_real_aqui
API_URL=https://localhost-f6b2fd7c.deco.host/mcp
API_KEY=sua_api_key_aqui
WEBHOOK_SECRET=seu_webhook_secret_aqui
```

#### **3. Deploy em Produção:**

```bash
# Use variáveis de ambiente do sistema
export DISCORD_TOKEN="seu_token"
export API_KEY="sua_chave"

# Ou configure no seu provedor (Heroku, Railway, etc.)
```

## 🔍 Verificação de Segurança

### **Antes de cada commit:**

```bash
# Verificar se não há arquivos sensíveis
git status
git diff --cached

# Verificar .gitignore
cat .gitignore | grep -E "\.(env|zip)"
```

### **Auditoria de Segurança:**

```bash
# Procurar por tokens no código
grep -r "discord.*token" src/ || echo "✅ Nenhum token hardcoded"
grep -r "api.*key" src/ || echo "✅ Nenhuma chave hardcoded"

# Verificar histórico
git log --oneline | grep -i "token\|key\|secret" || echo "✅ Histórico limpo"
```

## 📋 Checklist de Segurança

### **Desenvolvimento:**

- [ ] `.env` está no `.gitignore`
- [ ] Tokens são carregados de variáveis de ambiente
- [ ] Nenhum token hardcoded no código
- [ ] Arquivos ZIP não são commitados

### **Deploy:**

- [ ] ZIP não contém arquivos `.env`
- [ ] Variáveis configuradas no painel do provedor
- [ ] Tokens regenerados se houve vazamento
- [ ] Logs não expõem informações sensíveis

### **Monitoramento:**

- [ ] GitHub Secrets Scanning habilitado
- [ ] Alertas de segurança configurados
- [ ] Rotação regular de tokens/chaves
- [ ] Auditoria periódica do repositório

## 🚨 Em Caso de Vazamento

### **Passos Imediatos:**

1. **Regenerar** todos os tokens/chaves expostos
2. **Remover** arquivos do repositório
3. **Limpar** histórico do Git se necessário
4. **Notificar** equipe sobre o incidente
5. **Revisar** logs para atividade suspeita

### **Prevenção Futura:**

1. **Configurar** pre-commit hooks
2. **Usar** ferramentas de detecção de secrets
3. **Treinar** equipe sobre segurança
4. **Implementar** rotação automática de chaves

## 🔗 Recursos Úteis

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Discord Bot Security](https://discord.com/developers/docs/topics/oauth2#bot-authorization-flow)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git Filter-Repo](https://github.com/newren/git-filter-repo)

---

**Lembre-se: Segurança é responsabilidade de todos! 🛡️**
