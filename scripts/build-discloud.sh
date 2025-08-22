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
echo "   ✅ .env (se existir)"
echo ""
echo "📋 Arquivos excluídos:"
echo "   ❌ node_modules/"
echo "   ❌ package-lock.json"
echo "   ❌ .git/"
echo "   ❌ src/ (código fonte)"
echo "   ❌ arquivos de desenvolvimento"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Faça upload do arquivo ${ZIP_NAME} no Discloud"
if [ -f ".env" ]; then
    echo "   2. O arquivo .env foi incluído no ZIP (variáveis já configuradas)"
    echo "   3. Inicie o bot"
else
    echo "   2. Configure as variáveis de ambiente no painel do Discloud"
    echo "   3. Inicie o bot"
fi
echo ""
if [ ! -f ".env" ]; then
    echo "💡 Lembre-se de configurar estas variáveis no Discloud:"
    echo "   • DISCORD_TOKEN (obrigatório)"
    echo "   • API_URL (se usar webhook externa)"
    echo "   • LOG_LEVEL (opcional, padrão: info)"
    echo "   • Outras conforme necessário"
else
    echo "✅ Arquivo .env incluído! Certifique-se que todas as variáveis estão corretas."
fi
