#!/bin/bash

# Script para criar ZIP do projeto para deploy no Discloud
# Exclui: node_modules, package-lock.json, .git

echo "🚀 Preparando projeto para deploy no Discloud..."

# Verifica se o projeto foi compilado
if [ ! -d "dist" ]; then
    echo "📦 Compilando projeto..."
    npm run build
fi

# Nome do arquivo ZIP com timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ZIP_NAME="discord-enterprise-bot_${TIMESTAMP}.zip"

echo "📁 Criando arquivo: ${ZIP_NAME}"

# Cria o ZIP excluindo arquivos desnecessários
zip -r "$ZIP_NAME" . \
    -x "node_modules/*" \
    -x "package-lock.json" \
    -x ".git/*" \
    -x ".gitignore" \
    -x "*.zip" \
    -x ".env.example" \
    -x ".husky/*" \
    -x "scripts/*" \
    -x ".eslintrc.json" \
    -x ".prettierrc.js" \
    -x ".prettierignore" \
    -x "tsconfig.json" \
    -x "src/*" \
    -x "*.md" \
    -x ".env"

echo "✅ ZIP criado com sucesso: ${ZIP_NAME}"
echo ""
echo "📋 Arquivos incluídos no ZIP:"
echo "   ✅ dist/ (código compilado)"
echo "   ✅ package.json"
echo "   ✅ discloud.config"
echo "   ✅ env.example (template)"
echo ""
echo "📋 Arquivos excluídos por segurança:"
echo "   ❌ .env (contém tokens sensíveis)"
echo "   ❌ node_modules/"
echo "   ❌ package-lock.json"
echo "   ❌ .git/"
echo "   ❌ src/ (código fonte)"
echo "   ❌ arquivos de desenvolvimento"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Faça upload do arquivo ${ZIP_NAME} no Discloud"
echo "   2. Configure as variáveis de ambiente no painel do Discloud"
echo "   3. Inicie o bot"
echo ""
echo "🔒 IMPORTANTE - Configure estas variáveis no Discloud:"
echo "   • DISCORD_TOKEN=seu_token_aqui (obrigatório)"
echo "   • API_URL=https://localhost-f6b2fd7c.deco.host/mcp"
echo "   • API_KEY=sua_api_key_aqui"
echo "   • WEBHOOK_SECRET=seu_webhook_secret_aqui"
echo "   • LOG_LEVEL=info (opcional)"
echo ""
echo "⚠️  NUNCA commite arquivos .env ou ZIPs com tokens!"
