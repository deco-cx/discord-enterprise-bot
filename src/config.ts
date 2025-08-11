import dotenv from 'dotenv';

dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    table: process.env.SUPABASE_TABLE || 'messages',
    enabled: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY,
  },
  monitoredChannels: process.env.MONITORED_CHANNELS?.split(',') || [],
  fetchThreadsOnStart: process.env.FETCH_THREADS_ON_START === 'true',

  allowedRoles: process.env.ALLOWED_ROLES?.split(',').filter(Boolean) || [], // Roles que podem chamar o bot
};

// Validação das variáveis obrigatórias (apenas Discord)
const requiredEnvVars = [
  'DISCORD_TOKEN',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${envVar}`);
  }
}

// Log das funcionalidades habilitadas
console.log('🔧 Configuração do Bot:');
console.log(`  ✅ Discord: Habilitado`);
console.log(`  ${config.supabase.enabled ? '✅' : '❌'} Supabase: ${config.supabase.enabled ? 'Habilitado' : 'Desabilitado'}`);
console.log(`  📺 Canais monitorados: ${config.monitoredChannels.length}`);
console.log(`  🧵 Buscar threads no início: ${config.fetchThreadsOnStart ? 'Sim' : 'Não'}`);

console.log(`  🔐 Roles permitidas: ${config.allowedRoles.length > 0 ? config.allowedRoles.join(', ') : 'Todos os usuários'}`); 