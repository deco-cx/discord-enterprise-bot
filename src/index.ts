import { MessageListener } from './listener';
import { logger } from './utils/logger';

async function main() {
  logger.info('🚀 Iniciando Discord Bot Monitor...');
  
  const listener = new MessageListener();

  process.on('SIGINT', async () => {
    logger.info('\n🛑 Recebido sinal SIGINT, parando bot...');
    await listener.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('\n🛑 Recebido sinal SIGTERM, parando bot...');
    await listener.stop();
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    logger.error('❌ Erro não capturado:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Promise rejeitada não tratada:', { reason, promise });
    process.exit(1);
  });

  try {
    await listener.start();
    logger.info('✅ Bot iniciado com sucesso!');
  } catch (error) {
    logger.error('❌ Erro ao iniciar o bot:', error);
    process.exit(1);
  }
}

main();