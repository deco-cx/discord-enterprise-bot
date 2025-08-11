import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config';

interface SearchResult {
  id: string;
  content: string;
  title: string;
  full_text: string;
  similarity: number;
  metadata: any;
}

class SemanticSearchTester {
  private client: any;

  constructor() {
    if (!config.supabase.enabled) {
      throw new Error('Supabase não está habilitado no config');
    }

    this.client = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );
  }

  async testConnection(): Promise<void> {
    try {
      const { data, error } = await this.client
        .from(config.supabase.table)
        .select('_id')
        .limit(1);

      if (error) throw error;
      console.log('✅ Conexão com Supabase estabelecida');
    } catch (error) {
      console.error('❌ Erro ao conectar com Supabase:', error);
      throw error;
    }
  }

  async getMessageCount(): Promise<number> {
    try {
      const { count, error } = await this.client
        .from(config.supabase.table)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ Erro ao contar mensagens:', error);
      return 0;
    }
  }

  async getEmbeddingCount(): Promise<number> {
    try {
      const { count, error } = await this.client
        .from('message_embeddings')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ Erro ao contar embeddings:', error);
      return 0;
    }
  }

  async searchSimilar(queryEmbedding: number[], limit: number = 5): Promise<SearchResult[]> {
    try {
      const { data, error } = await this.client.rpc('match_message_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro na busca semântica:', error);
      return [];
    }
  }

  async getRecentMessages(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await this.client
        .from(config.supabase.table)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens recentes:', error);
      return [];
    }
  }

  async testSearchWithSampleEmbedding(): Promise<void> {
    console.log('\n🔍 Testando busca semântica com embedding de exemplo...');
    
    // Embedding de exemplo (1536 dimensões como OpenAI)
    const sampleEmbedding = new Array(1536).fill(0.1);
    
    const results = await this.searchSimilar(sampleEmbedding, 5);
    
    if (results.length === 0) {
      console.log('⚠️ Nenhum resultado encontrado. Verifique se há embeddings no banco.');
      return;
    }

    console.log(`✅ Encontrados ${results.length} resultados:`);
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. Similaridade: ${(result.similarity * 100).toFixed(2)}%`);
      console.log(`   ID: ${result.id}`);
      if (result.title) {
        console.log(`   Título: "${result.title}"`);
      }
      console.log(`   Conteúdo: "${result.content.substring(0, 100)}..."`);
      console.log(`   Metadata: ${JSON.stringify(result.metadata)}`);
    });
  }

  async testSearchWithDifferentThresholds(): Promise<void> {
    console.log('\n🔍 Testando diferentes thresholds de similaridade...');
    
    const sampleEmbedding = new Array(1536).fill(0.1);
    const thresholds = [0.5, 0.6, 0.7, 0.8, 0.9];
    
    for (const threshold of thresholds) {
      try {
        const { data, error } = await this.client.rpc('match_message_embeddings', {
          query_embedding: sampleEmbedding,
          match_threshold: threshold,
          match_count: 10,
        });

        if (error) throw error;
        
        console.log(`\n📊 Threshold ${threshold}: ${data?.length || 0} resultados`);
        
        if (data && data.length > 0) {
          console.log(`   Melhor similaridade: ${(data[0].similarity * 100).toFixed(2)}%`);
          console.log(`   Pior similaridade: ${(data[data.length - 1].similarity * 100).toFixed(2)}%`);
        }
      } catch (error) {
        console.error(`❌ Erro com threshold ${threshold}:`, error);
      }
    }
  }

  async showDatabaseStats(): Promise<void> {
    console.log('\n📊 Estatísticas do banco de dados:');
    
    const messageCount = await this.getMessageCount();
    const embeddingCount = await this.getEmbeddingCount();
    
    console.log(`   Mensagens totais: ${messageCount}`);
    console.log(`   Embeddings: ${embeddingCount}`);
    console.log(`   Cobertura: ${messageCount > 0 ? ((embeddingCount / messageCount) * 100).toFixed(2) : 0}%`);
    
    if (embeddingCount === 0) {
      console.log('\n⚠️ Nenhum embedding encontrado!');
      console.log('   Para testar a busca semântica, você precisa:');
      console.log('   1. Gerar embeddings para as mensagens');
      console.log('   2. Salvar os embeddings na tabela message_embeddings');
      console.log('   3. Usar a função match_message_embeddings para buscar');
    }
  }

  async showRecentMessages(): Promise<void> {
    console.log('\n📝 Mensagens mais recentes:');
    
    const messages = await this.getRecentMessages(5);
    
    if (messages.length === 0) {
      console.log('   Nenhuma mensagem encontrada');
      return;
    }

    messages.forEach((message, index) => {
      console.log(`\n${index + 1}. ID: ${message._id}`);
      console.log(`   Canal: ${message.channel_id}`);
      console.log(`   Usuário: ${message.username}`);
      console.log(`   Conteúdo: "${message.content.substring(0, 100)}..."`);
      console.log(`   Data: ${new Date(message.timestamp).toLocaleString()}`);
    });
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Iniciando testes de busca semântica...\n');
    
    try {
      await this.testConnection();
      await this.showDatabaseStats();
      await this.showRecentMessages();
      await this.testSearchWithSampleEmbedding();
      await this.testSearchWithDifferentThresholds();
      
      console.log('\n✅ Todos os testes concluídos!');
    } catch (error) {
      console.error('\n❌ Erro durante os testes:', error);
    }
  }
}

async function main() {
  try {
    const tester = new SemanticSearchTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Erro ao executar testes:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 