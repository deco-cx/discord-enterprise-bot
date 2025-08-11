import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config';
import * as readline from 'readline';

interface SearchResult {
  id: string;
  content: string;
  title: string;
  full_text: string;
  similarity: number;
  metadata: any;
}

class InteractiveSearch {
  private client: any;
  private rl: readline.Interface;

  constructor() {
    if (!config.supabase.enabled) {
      throw new Error('Supabase não está habilitado no config');
    }

    this.client = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  // Gerar embedding simulado mais realista baseado na query
  private generateQueryEmbedding(query: string): number[] {
    const embedding = new Array(1536).fill(0);
    
    // Normalizar a query
    const normalizedQuery = query.toLowerCase().trim();
    
    // Hash mais sofisticado baseado em palavras-chave
    const keywords = normalizedQuery.split(/\s+/);
    let baseHash = 0;
    
    keywords.forEach((keyword, index) => {
      for (let i = 0; i < keyword.length; i++) {
        const char = keyword.charCodeAt(i);
        baseHash = ((baseHash << 5) - baseHash) + char + index;
        baseHash = baseHash & baseHash;
      }
    });
    
    // Distribuir o hash pelos valores do embedding de forma mais realista
    for (let i = 0; i < 1536; i++) {
      // Usar diferentes funções trigonométricas para criar padrões mais complexos
      const factor = Math.sin(baseHash + i * 0.1) * Math.cos(baseHash + i * 0.05);
      embedding[i] = factor * 0.15; // Reduzir amplitude para valores mais realistas
    }
    
    return embedding;
  }

  async searchSimilar(query: string, threshold: number = 0.1, limit: number = 5, excludeClosed: boolean = false, onlyClosed: boolean = false): Promise<SearchResult[]> {
    try {
      const queryEmbedding = this.generateQueryEmbedding(query);
      
      const { data, error } = await this.client.rpc('match_message_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
      });

      if (error) throw error;
      
      let results = data || [];
      
      // Filtrar por status de thread se especificado
      if (excludeClosed || onlyClosed) {
        console.log(`   🔍 Filtrando threads: ${excludeClosed ? 'Excluindo fechadas' : 'Apenas fechadas'}`);
        
        // Buscar status das threads no banco
        const threadIds = [...new Set(results.map((r: any) => r.metadata?.threadId).filter(Boolean))];
        
        if (threadIds.length > 0) {
          const { data: threadStatuses, error: statusError } = await this.client
            .from(config.supabase.table)
            .select('thread_id, is_closed')
            .in('thread_id', threadIds);
          
          if (!statusError && threadStatuses) {
            const closedThreads = new Set(
              threadStatuses
                .filter((t: any) => t.is_closed)
                .map((t: any) => t.thread_id)
            );
            
            results = results.filter((result: any) => {
              const threadId = result.metadata?.threadId;
              const isClosed = threadId ? closedThreads.has(threadId) : false;
              
              if (excludeClosed) {
                return !isClosed; // Excluir threads fechadas
              } else if (onlyClosed) {
                return isClosed; // Apenas threads fechadas
              }
              return true;
            });
          }
        }
      }
      
      // Se não encontrou resultados com embeddings, tentar busca por palavras-chave
      if (results.length === 0) {
        console.log('   🔍 Tentando busca por palavras-chave...');
        return await this.searchByKeywords(query, limit, excludeClosed, onlyClosed);
      }
      
      return results;
    } catch (error) {
      console.error('❌ Erro na busca semântica:', error);
      return [];
    }
  }

  // Busca por palavras-chave como fallback
  async searchByKeywords(query: string, limit: number = 5, excludeClosed: boolean = false, onlyClosed: boolean = false): Promise<SearchResult[]> {
    try {
      const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      
      if (keywords.length === 0) return [];

      // Buscar mensagens que contenham as palavras-chave
      let queryBuilder = this.client
        .from('message_embeddings')
        .select('*')
        .or(keywords.map(keyword => `content.ilike.%${keyword}%`).join(','))
        .limit(limit);

      // Aplicar filtros de thread se necessário
      if (excludeClosed || onlyClosed) {
        // Buscar IDs de mensagens de threads com status específico
        const { data: messageIds, error: idError } = await this.client
          .from(config.supabase.table)
          .select('_id')
          .eq('is_closed', onlyClosed ? true : false)
          .not('thread_id', 'is', null);
        
        if (!idError && messageIds && messageIds.length > 0) {
          const ids = messageIds.map((m: any) => m._id);
          queryBuilder = queryBuilder.in('id', ids);
        }
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Converter para formato de resultado com similaridade calculada
      return (data || []).map((item: any) => {
        // Calcular similaridade baseada na quantidade de palavras-chave encontradas
        const contentLower = item.content.toLowerCase();
        const titleLower = (item.title || '').toLowerCase();
        const fullTextLower = (item.full_text || item.content).toLowerCase();
        
        const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
        let matches = 0;
        
        keywords.forEach(keyword => {
          if (contentLower.includes(keyword) || titleLower.includes(keyword) || fullTextLower.includes(keyword)) {
            matches++;
          }
        });
        
        // Similaridade baseada na proporção de palavras-chave encontradas
        const similarity = keywords.length > 0 ? (matches / keywords.length) * 0.8 : 0.3;
        
        return {
          id: item.id,
          content: item.content,
          title: item.title || '',
          full_text: item.full_text || item.content,
          similarity: Math.max(similarity, 0.3), // Mínimo de 30%
          metadata: item.metadata || {}
        };
      });
    } catch (error) {
      console.error('❌ Erro na busca por palavras-chave:', error);
      return [];
    }
  }

  async showSearchResults(results: SearchResult[], query: string): Promise<void> {
    console.log(`\n🔍 Resultados para: "${query}"`);
    console.log(`📊 Encontrados ${results.length} resultados\n`);
    
    if (results.length === 0) {
      console.log('⚠️ Nenhum resultado encontrado');
      console.log('   Tente:');
      console.log('   - Reduzir o threshold de similaridade (ex: threshold:0.2)');
      console.log('   - Usar termos mais gerais');
      console.log('   - Usar frases completas em vez de palavras isoladas');
      console.log('   - Verificar se há embeddings no banco');
      return;
    }

    results.forEach((result, index) => {
      console.log(`${index + 1}. Similaridade: ${(result.similarity * 100).toFixed(2)}%`);
      console.log(`   ID: ${result.id}`);
      if (result.title) {
        console.log(`   Título: "${result.title}"`);
      }
      console.log(`   Conteúdo: "${result.content}"`);
      
      if (result.metadata) {
        console.log(`   Metadata: ${JSON.stringify(result.metadata)}`);
      }
      console.log('');
    });
  }

  async showDatabaseStats(): Promise<void> {
    try {
      const { count: messageCount } = await this.client
        .from(config.supabase.table)
        .select('*', { count: 'exact', head: true });

      const { count: embeddingCount } = await this.client
        .from('message_embeddings')
        .select('*', { count: 'exact', head: true });

      console.log('\n📊 Estatísticas do banco:');
      console.log(`   Mensagens: ${messageCount || 0}`);
      console.log(`   Embeddings: ${embeddingCount || 0}`);
      console.log(`   Cobertura: ${messageCount > 0 ? ((embeddingCount || 0) / messageCount * 100).toFixed(2) : 0}%`);
      
      // Mostrar algumas mensagens de exemplo
      if (messageCount > 0) {
        const { data: sampleMessages } = await this.client
          .from(config.supabase.table)
          .select('content')
          .limit(3);
        
        if (sampleMessages && sampleMessages.length > 0) {
          console.log('\n📝 Exemplos de mensagens:');
          sampleMessages.forEach((msg: any, index: number) => {
            console.log(`   ${index + 1}. "${msg.content.substring(0, 60)}..."`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
    }
  }

  async runInteractiveSearch(): Promise<void> {
    console.log('🔍 Busca Semântica Interativa');
    console.log('================================\n');
    
    await this.showDatabaseStats();
    
    console.log('\n💡 Dicas:');
    console.log('   - Digite "quit" para sair');
    console.log('   - Digite "stats" para ver estatísticas');
    console.log('   - Digite "help" para ver comandos');
                    console.log('   - Use "threshold:0.2" para ajustar similaridade (padrão: 0.1)');
        console.log('   - Use "limit:10" para ajustar número de resultados');
        console.log('   - Use "excludeClosed:true" para excluir threads fechadas');
        console.log('   - Use "onlyClosed:true" para apenas threads fechadas');
        console.log('   - Use frases completas para melhores resultados\n');

    while (true) {
      try {
        const input = await this.question('\n🔍 Digite sua busca: ');
        
        if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
          break;
        }
        
        if (input.toLowerCase() === 'stats') {
          await this.showDatabaseStats();
          continue;
        }
        
        if (input.toLowerCase() === 'help') {
          console.log('\n📖 Comandos disponíveis:');
          console.log('   quit/exit    - Sair do programa');
          console.log('   stats        - Mostrar estatísticas do banco');
          console.log('   help         - Mostrar esta ajuda');
          console.log('   threshold:X  - Ajustar threshold (ex: threshold:0.05)');
          console.log('   limit:X      - Ajustar limite de resultados (ex: limit:10)');
          console.log('   excludeClosed:true - Excluir threads fechadas');
          console.log('   onlyClosed:true - Apenas threads fechadas');
          console.log('\n💡 Exemplos de busca:');
          console.log('   "como configurar o bot"');
          console.log('   "problemas com node.js excludeClosed:true"');
          console.log('   "soluções implementadas onlyClosed:true"');
          console.log('   "debug javascript"');
          console.log('   "autenticação jwt"');
          continue;
        }

        // Parsear parâmetros especiais
        let query = input;
        let threshold = 0.1; // Threshold muito baixo por padrão
        let limit = 5;
        let excludeClosed = false;
        let onlyClosed = false;

        // Verificar threshold personalizado
        const thresholdMatch = input.match(/threshold:(\d+\.?\d*)/);
        if (thresholdMatch) {
          threshold = parseFloat(thresholdMatch[1]);
          query = input.replace(/threshold:\d+\.?\d*\s*/, '');
        }

        // Verificar limit personalizado
        const limitMatch = input.match(/limit:(\d+)/);
        if (limitMatch) {
          limit = parseInt(limitMatch[1]);
          query = input.replace(/limit:\d+\s*/, '');
        }

        // Verificar filtros de thread
        if (query.toLowerCase().includes('excludeClosed:true')) {
          excludeClosed = true;
          query = query.replace('excludeClosed:true', '').trim();
        }
        if (query.toLowerCase().includes('onlyClosed:true')) {
          onlyClosed = true;
          query = query.replace('onlyClosed:true', '').trim();
        }

        if (!query.trim()) {
          console.log('⚠️ Por favor, digite uma busca válida');
          continue;
        }

        console.log(`\n🔍 Buscando: "${query}"`);
        console.log(`   Threshold: ${threshold} (${(threshold * 100).toFixed(0)}%)`);
        console.log(`   Limite: ${limit}`);
        console.log(`   Excluir Fechadas: ${excludeClosed}`);
        console.log(`   Apenas Fechadas: ${onlyClosed}`);

        const results = await this.searchSimilar(query, threshold, limit, excludeClosed, onlyClosed);
        await this.showSearchResults(results, query);

      } catch (error) {
        console.error('❌ Erro durante a busca:', error);
      }
    }

    console.log('\n👋 Até logo!');
    this.rl.close();
  }
}

async function main() {
  try {
    const search = new InteractiveSearch();
    await search.runInteractiveSearch();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 