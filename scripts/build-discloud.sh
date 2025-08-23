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
    -x "*.md"

echo "✅ ZIP criado com sucesso: ${ZIP_NAME}"
echo ""
echo "📋 Arquivos incluídos no ZIP:"
echo "   ✅ dist/ (código compilado)"
echo "   ✅ package.json"
echo "   ✅ discloud.config"
echo "   ✅ env.example (template)"
if [ -f ".env" ]; then
    echo "   ✅ .env (variáveis configuradas)"
else
    echo "   ❌ .env (não encontrado - precisa criar)"
fi
echo ""
echo "📋 Arquivos excluídos:"
echo "   ❌ node_modules/"
echo "   ❌ package-lock.json"
echo "   ❌ .git/"
echo "   ❌ src/ (código fonte)"
echo "   ❌ arquivos de desenvolvimento"
echo ""
if [ -f ".env" ]; then
    echo "🎯 Próximos passos:"
    echo "   1. Faça upload do arquivo ${ZIP_NAME} no Discloud"
    echo "   2. Inicie o bot (variáveis já configuradas)"
    echo ""
    echo "✅ Arquivo .env incluído! Certifique-se que todas as variáveis estão corretas."
else
    echo "⚠️  ATENÇÃO: Arquivo .env não encontrado!"
    echo ""
    echo "🔧 Para incluir variáveis no ZIP:"
    echo "   1. Copie: cp env.example .env"
    echo "   2. Edite: nano .env"
    echo "   3. Configure suas variáveis reais:"
    echo "      • DISCORD_TOKEN=seu_token_aqui"
    echo "      • API_URL=http://localhost:8787/mcp"
    echo "      • API_KEY=sua_api_key_aqui"
    echo "      • WEBHOOK_SECRET=seu_webhook_secret_aqui"
    echo "   4. Gere ZIP novamente: npm run build:discloud"
    echo ""
    echo "🚨 IMPORTANTE: Nunca commite o arquivo .env no Git!"
fi
