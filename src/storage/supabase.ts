import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { DiscordMessage } from '../types';

export class SupabaseStorage {
  private client: SupabaseClient;
  private enabled: boolean;

  constructor() {
    this.enabled = config.supabase.enabled;
    if (this.enabled) {
      this.client = createClient(
        config.supabase.url,
        config.supabase.anonKey
      );
    } else {
      this.client = null as any;
    }
  }

  async connect(): Promise<void> {
    if (!this.enabled) {
      console.log('📊 Supabase: Desabilitado - pulando conexão');
      return;
    }

    try {
      // Testar conexão fazendo uma query simples
      const { data, error } = await this.client
        .from(config.supabase.table)
        .select('_id')
        .limit(1);

      if (error) {
        throw error;
      }

      console.log('✅ Conectado ao Supabase');
    } catch (error) {
      console.error('❌ Erro ao conectar ao Supabase:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.enabled) return;
    
    // Supabase não precisa de desconexão explícita
    console.log('🔌 Desconectado do Supabase');
  }

  async saveMessage(message: DiscordMessage): Promise<void> {
    if (!this.enabled) {
      console.log(`📝 Mensagem simulada no Supabase: ${message._id}`);
      console.log(`   Canal: ${message.channelId} | Thread: ${message.threadId || 'N/A'} | Conteúdo: "${message.content.substring(0, 50)}..."`);
      return;
    }

    try {
      // Verificar se a mensagem já existe
      const { data: existingMessage } = await this.client
        .from(config.supabase.table)
        .select('_id')
        .eq('_id', message._id)
        .single();

      if (existingMessage) {
        // Atualizar mensagem existente
        const { error } = await this.client
          .from(config.supabase.table)
          .update({
            content: message.content,
            thread_title: message.threadTitle,
            channel_name: message.channelName,
            is_closed: message.isClosed,
            updated_at: new Date().toISOString(),
            attachments: message.attachments,
            embeds: message.embeds,
            mentions: message.mentions
          })
          .eq('_id', message._id);

        if (error) throw error;
        console.log(`📝 Mensagem atualizada no Supabase: ${message._id}`);
        
        // Atualizar embedding também
        await this.generateAndSaveEmbedding(message);
      } else {
        // Inserir nova mensagem
        const { error } = await this.client
          .from(config.supabase.table)
          .insert({
            _id: message._id,
            channel_id: message.channelId,
            guild_id: message.guildId,
            user_id: message.userId,
            username: message.username,
            content: message.content,
            timestamp: message.timestamp.toISOString(),
            reply_to: message.replyTo,
            thread_id: message.threadId,
            thread_title: message.threadTitle,
            channel_name: message.channelName,
            is_closed: message.isClosed || false,
            attachments: message.attachments,
            embeds: message.embeds,
            mentions: message.mentions,
            created_at: message.createdAt.toISOString(),
            updated_at: message.updatedAt.toISOString()
          });

        if (error) throw error;
        console.log(`📝 Nova mensagem salva no Supabase: ${message._id}`);
        console.log(`   Canal: ${message.channelId} | Thread: ${message.threadId || 'N/A'} | Conteúdo: "${message.content.substring(0, 50)}..."`);
        
        // Gerar embedding para nova mensagem
        await this.generateAndSaveEmbedding(message);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar mensagem no Supabase:', error);
      throw error;
    }
  }

  async getMessage(messageId: string): Promise<DiscordMessage | null> {
    if (!this.enabled) return null;

    try {
      const { data, error } = await this.client
        .from(config.supabase.table)
        .select('*')
        .eq('_id', messageId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Não encontrado
        throw error;
      }

      return this.mapDatabaseToDiscordMessage(data);
    } catch (error) {
      console.error('❌ Erro ao buscar mensagem no Supabase:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.enabled) {
      console.log(`🗑️ Mensagem simulada deletada do Supabase: ${messageId}`);
      return;
    }

    try {
      const { error } = await this.client
        .from(config.supabase.table)
        .delete()
        .eq('_id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Erro ao deletar mensagem do Supabase:', error);
      throw error;
    }
  }

  async getMessagesByChannel(channelId: string, limit: number = 100): Promise<DiscordMessage[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await this.client
        .from(config.supabase.table)
        .select('*')
        .eq('channel_id', channelId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(this.mapDatabaseToDiscordMessage);
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens do canal:', error);
      throw error;
    }
  }

  async getMessagesByUser(userId: string, limit: number = 100): Promise<DiscordMessage[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await this.client
        .from(config.supabase.table)
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(this.mapDatabaseToDiscordMessage);
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens do usuário:', error);
      throw error;
    }
  }

  async getRecentMessages(limit: number = 100): Promise<DiscordMessage[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await this.client
        .from(config.supabase.table)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(this.mapDatabaseToDiscordMessage);
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens recentes:', error);
      throw error;
    }
  }

  async getMessageCount(): Promise<number> {
    if (!this.enabled) return 0;

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
    if (!this.enabled) return 0;

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

  // Métodos para gerenciar threads fechadas
  async closeThread(threadId: string): Promise<void> {
    if (!this.enabled) {
      console.log(`🔒 Thread simulada fechada: ${threadId}`);
      return;
    }

    try {
      const { error } = await this.client.rpc('close_thread', {
        thread_id_param: threadId
      });

      if (error) throw error;
      console.log(`🔒 Thread fechada no Supabase: ${threadId}`);
    } catch (error) {
      console.error('❌ Erro ao fechar thread no Supabase:', error);
      throw error;
    }
  }

  async openThread(threadId: string): Promise<void> {
    if (!this.enabled) {
      console.log(`🔓 Thread simulada aberta: ${threadId}`);
      return;
    }

    try {
      const { error } = await this.client.rpc('open_thread', {
        thread_id_param: threadId
      });

      if (error) throw error;
      console.log(`🔓 Thread aberta no Supabase: ${threadId}`);
    } catch (error) {
      console.error('❌ Erro ao abrir thread no Supabase:', error);
      throw error;
    }
  }

  async getThreadStatus(threadId: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const { data, error } = await this.client.rpc('get_thread_status', {
        thread_id_param: threadId
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('❌ Erro ao obter status da thread no Supabase:', error);
      throw error;
    }
  }

  async getClosedThreads(limit: number = 50): Promise<DiscordMessage[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await this.client
        .from(config.supabase.table)
        .select('*')
        .eq('is_closed', true)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(item => this.mapDatabaseToDiscordMessage(item));
    } catch (error) {
      console.error('❌ Erro ao buscar threads fechadas no Supabase:', error);
      throw error;
    }
  }

  // Vector search methods
  async saveEmbedding(id: string, content: string, embedding: number[], metadata: any): Promise<void> {
    if (!this.enabled) return;

    try {
      // Extrair título e texto completo do metadata
      const title = metadata.threadTitle || metadata.channelName || '';
      const fullText = metadata.fullText || content;
      
      const { error } = await this.client
        .from('message_embeddings')
        .upsert({
          id: id,
          content: content,
          title: title,
          full_text: fullText,
          embedding: embedding,
          metadata: metadata,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('❌ Erro ao salvar embedding no Supabase:', error);
      throw error;
    }
  }

  async searchSimilar(queryEmbedding: number[], limit: number = 5): Promise<any[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await this.client.rpc('match_message_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar embeddings similares:', error);
      throw error;
    }
  }

  private async generateAndSaveEmbedding(message: DiscordMessage): Promise<void> {
    if (!this.enabled) return;

    try {
      // Gerar embedding simulado (por enquanto)
      // TODO: Implementar geração real de embeddings com OpenAI ou similar
      const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());
      
      // Preparar texto completo para embedding
      let fullText = message.content;
      if (message.threadTitle) {
        fullText = `[${message.threadTitle}] ${message.content}`;
      }
      if (message.channelName) {
        fullText = `[${message.channelName}] ${fullText}`;
      }
      
      // Salvar embedding
      await this.saveEmbedding(
        message._id,
        message.content,
        mockEmbedding,
        {
          channelId: message.channelId,
          guildId: message.guildId,
          userId: message.userId,
          content: message.content,
          timestamp: message.timestamp.toISOString(),
          threadTitle: message.threadTitle,
          channelName: message.channelName,
          fullText: fullText
        }
      );
      
      console.log(`🧠 Embedding gerado para mensagem: ${message._id}`);
    } catch (error) {
      console.error(`❌ Erro ao gerar embedding para mensagem ${message._id}:`, error);
      // Não lançar erro para não interromper o fluxo de salvamento
    }
  }

  private mapDatabaseToDiscordMessage(data: any): DiscordMessage {
    return {
      _id: data._id,
      channelId: data.channel_id,
      guildId: data.guild_id,
      userId: data.user_id,
      username: data.username,
      content: data.content,
      timestamp: new Date(data.timestamp),
      replyTo: data.reply_to,
      threadId: data.thread_id,
      threadTitle: data.thread_title,
      channelName: data.channel_name,
      isClosed: data.is_closed || false,
      attachments: data.attachments || [],
      embeds: data.embeds || [],
      mentions: data.mentions || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
} 