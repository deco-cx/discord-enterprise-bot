import { MessageListener } from './listener';

async function main() {
  console.log('🚀 Iniciando Discord Channel Monitor Bot...');
  
  const listener = new MessageListener();

  // Tratamento de sinais para parada graciosa
  process.on('SIGINT', async () => {
    console.log('\n🛑 Recebido sinal SIGINT, parando bot...');
    await listener.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Recebido sinal SIGTERM, parando bot...');
    await listener.stop();
    process.exit(0);
  });

  // Tratamento de erros não capturados
  process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    process.exit(1);
  });

  try {
    await listener.start();
    console.log('✅ Bot iniciado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao iniciar o bot:', error);
    process.exit(1);
  }
}

main(); 