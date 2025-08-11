import { Client, Events, Message, TextChannel, GatewayIntentBits, ThreadChannel, ForumChannel } from 'discord.js';
import { config } from './config';
import { SupabaseStorage } from './storage/supabase';
import { DecoWebhook } from './webhook/deco-webhook';
import { DiscordMessage } from './types';

export class MessageListener {
  private client: Client;
  private supabaseStorage: SupabaseStorage;
  private decoWebhook: DecoWebhook; // Added property for DecoWebhook

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.supabaseStorage = new SupabaseStorage();
    this.decoWebhook = new DecoWebhook(); // Initialize DecoWebhook

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Nova mensagem
    this.client.on(Events.MessageCreate, async (message: Message) => {
      await this.handleNewMessage(message);
    });

    // Mensagem editada
    this.client.on(Events.MessageUpdate, async (oldMessage: any, newMessage: any) => {
      await this.handleMessageUpdate(oldMessage, newMessage);
    });

    // Mensagem deletada
    this.client.on(Events.MessageDelete, async (message: any) => {
      await this.handleMessageDelete(message);
    });

    // Eventos de thread
    this.client.on(Events.ThreadCreate, async (thread: ThreadChannel) => {
      await this.handleThreadCreate(thread);
    });

    this.client.on(Events.ThreadDelete, async (thread: ThreadChannel) => {
      await this.handleThreadDelete(thread);
    });

    this.client.on(Events.ThreadUpdate, async (oldThread: ThreadChannel, newThread: ThreadChannel) => {
      await this.handleThreadUpdate(oldThread, newThread);
    });

    // Bot pronto
    this.client.on(Events.ClientReady, () => {
      console.log(`🤖 Bot conectado como ${this.client.user?.tag}`);
      if (config.fetchThreadsOnStart) {
      this.fetchOldMessages();
      } else {
        console.log('⏭️ Busca de threads no início desativada por configuração.');
      }
    });
  }

  private async handleNewMessage(message: Message): Promise<void> {
    try {
      // Log para debug
      console.log(`🔍 Nova mensagem recebida:`);
      console.log(`   Canal: ${message.channel.id} (${(message.channel as any).name})`);
      console.log(`   Tipo: ${this.getChannelTypeName(message.channel.type)}`);
      console.log(`   Autor: ${message.author.username} (${message.author.bot ? 'BOT' : 'USUÁRIO'})`);
      console.log(`   Conteúdo: "${message.content}"`);
      console.log(`   Canais monitorados: ${config.monitoredChannels.join(', ')}`);

      // Ignorar mensagens de outros bots (não do próprio bot)
      if (message.author.bot && message.author.id !== this.client.user!.id) {
        console.log(`   ❌ Ignorando mensagem de outro bot`);
        return;
      }

      // Verificar se deve processar como interação com o bot
      let shouldProcessBotInteraction = false;
      let interactionReason = '';

      // 1. Verificar se o bot foi mencionado diretamente
      const isBotMentioned = message.mentions.users.has(this.client.user!.id);
      if (isBotMentioned) {
        shouldProcessBotInteraction = true;
        interactionReason = 'Bot mencionado diretamente';
      }

      // 2. Verificar se é uma resposta a uma mensagem do bot
      if (!shouldProcessBotInteraction && message.reference?.messageId) {
        try {
          const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
          if (referencedMessage.author.id === this.client.user!.id) {
            shouldProcessBotInteraction = true;
            interactionReason = 'Resposta a mensagem do bot';
          }
        } catch (error) {
          console.log(`   💬 Erro ao buscar mensagem referenciada: ${error}`);
        }
      }

      // 3. Verificar se está em uma conversa com o bot
      if (!shouldProcessBotInteraction) {
        const isInBotConversation = this.isInBotConversation(message.channel.id);
        if (isInBotConversation && message.author.id !== this.client.user!.id) {
          shouldProcessBotInteraction = true;
          interactionReason = 'Mensagem em conversa com bot';
        }
      }

      // Processar interação com o bot se necessário
      if (shouldProcessBotInteraction) {
        console.log(`   🤖 ${interactionReason}! Processando...`);
        await this.handleBotMention(message);
        return;
      }

      // Verificar se o canal está sendo monitorado
      const isMonitored = config.monitoredChannels.includes(message.channel.id);
      
      // Para threads, verificar se o canal pai está sendo monitorado
      const isThreadMonitored = message.channel.type === 11 || message.channel.type === 12 || message.channel.type === 13 
        ? config.monitoredChannels.includes((message.channel as any).parentId)
        : false;

      if (!isMonitored && !isThreadMonitored) {
        console.log(`   ❌ Canal não está na lista de monitorados`);
        return;
      }

      console.log(`   ✅ Processando mensagem...`);

      const discordMessage = this.createDiscordMessage(message);
      
      // Salvar no Supabase (se habilitado)
      await this.supabaseStorage.saveMessage(discordMessage);

      console.log(`   ✅ Mensagem processada com sucesso!`);

    } catch (error) {
      console.error('❌ Erro ao processar nova mensagem:', error);
    }
  }

  // Adicionar método para rastrear conversas com o bot
  private botConversationChannels = new Set<string>();

  private isInBotConversation(channelId: string): boolean {
    return this.botConversationChannels.has(channelId);
  }

  private addBotConversation(channelId: string): void {
    this.botConversationChannels.add(channelId);
    // Remover após 5 minutos para não manter conversas antigas
    setTimeout(() => {
      this.botConversationChannels.delete(channelId);
    }, 5 * 60 * 1000);
  }

  // Verificar se o usuário tem permissão para chamar o bot
  private hasPermissionToCallBot(message: Message): boolean {
    // Se não há roles configuradas, permitir todos os usuários
    if (config.allowedRoles.length === 0) {
      return true;
    }

    // Verificar se o usuário tem alguma das roles permitidas
    const member = message.member;
    if (!member) {
      console.log(`   ⚠️ Não foi possível obter informações do membro`);
      return false;
    }

    const userRoles = member.roles.cache.map(role => role.id);
    const hasAllowedRole = userRoles.some(roleId => config.allowedRoles.includes(roleId));

    console.log(`   🔍 Verificando permissões:`);
    console.log(`      Roles do usuário: ${userRoles.join(', ')}`);
    console.log(`      Roles permitidas: ${config.allowedRoles.join(', ')}`);
    console.log(`      Tem permissão: ${hasAllowedRole ? 'Sim' : 'Não'}`);

    return hasAllowedRole;
  }

  private async handleMessageUpdate(oldMessage: Message, newMessage: Message): Promise<void> {
    try {
      if (newMessage.author.bot || !config.monitoredChannels.includes(newMessage.channel.id)) {
        return;
      }

      console.log(`✏️ Mensagem editada em #${(newMessage.channel as TextChannel).name}`);

      const discordMessage = this.createDiscordMessage(newMessage);
      
      // Atualizar no Supabase (se habilitado)
      await this.supabaseStorage.saveMessage(discordMessage);

    } catch (error) {
      console.error('❌ Erro ao processar mensagem editada:', error);
    }
  }

  private async handleMessageDelete(message: Message): Promise<void> {
    try {
      if (!config.monitoredChannels.includes(message.channel.id)) {
        return;
      }

      console.log(`🗑️ Mensagem deletada em #${(message.channel as TextChannel).name}`);

      // Deletar do Supabase (se habilitado)
      await this.supabaseStorage.deleteMessage(message.id);

    } catch (error) {
      console.error('❌ Erro ao processar mensagem deletada:', error);
    }
  }

  // Métodos para lidar com eventos de thread
  private async handleThreadCreate(thread: ThreadChannel): Promise<void> {
    try {
      console.log(`🧵 Thread criada: ${thread.id} - ${thread.name}`);
      console.log(`   Canal pai: ${thread.parent?.name} (${thread.parentId})`);
      console.log(`   Criada por: ${thread.ownerId}`);
      console.log(`   Arquivo: ${thread.archived ? 'Sim' : 'Não'}`);
      
      // Marcar thread como aberta no banco
      await this.supabaseStorage.openThread(thread.id);
      
      console.log(`✅ Thread marcada como aberta no Supabase: ${thread.id}`);
    } catch (error) {
      console.error('❌ Erro ao processar criação de thread:', error);
    }
  }

  private async handleThreadDelete(thread: ThreadChannel): Promise<void> {
    try {
      console.log(`🗑️ Thread deletada: ${thread.id} - ${thread.name}`);
      console.log(`   Canal pai: ${thread.parent?.name} (${thread.parentId})`);
      
      // Marcar thread como fechada no banco
      await this.supabaseStorage.closeThread(thread.id);
      
      console.log(`✅ Thread marcada como fechada no Supabase: ${thread.id}`);
    } catch (error) {
      console.error('❌ Erro ao processar deleção de thread:', error);
    }
  }

  private async handleThreadUpdate(oldThread: ThreadChannel, newThread: ThreadChannel): Promise<void> {
    try {
      console.log(`🔄 Thread atualizada: ${newThread.id} - ${newThread.name}`);
      console.log(`   Canal pai: ${newThread.parent?.name} (${newThread.parentId})`);
      console.log(`   Arquivo: ${newThread.archived ? 'Sim' : 'Não'}`);
      console.log(`   Bloqueado: ${newThread.locked ? 'Sim' : 'Não'}`);
      
      // Verificar se a thread foi arquivada ou desarquivada
      if (newThread.archived && !oldThread.archived) {
        console.log(`   📦 Thread arquivada!`);
        await this.supabaseStorage.closeThread(newThread.id);
        console.log(`✅ Thread marcada como fechada no Supabase: ${newThread.id}`);
      } else if (!newThread.archived && oldThread.archived) {
        console.log(`   📦 Thread desarquivada!`);
        await this.supabaseStorage.openThread(newThread.id);
        console.log(`✅ Thread marcada como aberta no Supabase: ${newThread.id}`);
      }
      
      // Verificar se a thread foi bloqueada ou desbloqueada
      if (newThread.locked && !oldThread.locked) {
        console.log(`   🔒 Thread bloqueada!`);
        await this.supabaseStorage.closeThread(newThread.id);
        console.log(`✅ Thread marcada como fechada no Supabase: ${newThread.id}`);
      } else if (!newThread.locked && oldThread.locked) {
        console.log(`   🔓 Thread desbloqueada!`);
        await this.supabaseStorage.openThread(newThread.id);
        console.log(`✅ Thread marcada como aberta no Supabase: ${newThread.id}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar atualização de thread:', error);
    }
  }

  // Controle para evitar processamento duplicado
  private processingMessages = new Set<string>();

  private async handleBotMention(message: Message): Promise<void> {
    // Verificar se a mensagem já está sendo processada
    if (this.processingMessages.has(message.id)) {
      console.log(`   ⚠️ Mensagem ${message.id} já está sendo processada, ignorando...`);
      return;
    }

    // Marcar mensagem como sendo processada
    this.processingMessages.add(message.id);
    
    // Remover do controle após 10 segundos para evitar vazamento de memória
    setTimeout(() => {
      this.processingMessages.delete(message.id);
    }, 10000);

    try {
      console.log(`🤖 Processando menção ao bot:`);
      console.log(`   Autor: ${message.author.username}`);
      console.log(`   Conteúdo: "${message.content}"`);

      // Verificar permissões do usuário
      if (!this.hasPermissionToCallBot(message)) {
        console.log(`   ❌ Usuário sem permissão para chamar o bot`);
        return;
      }

      console.log(`   ✅ Usuário autorizado`);

      // Adicionar canal à lista de conversas com o bot
      this.addBotConversation(message.channel.id);

      // Remover a menção do bot do conteúdo
      const contentWithoutMention = message.content.replace(/<@!\d+>|<@\d+>/g, '').trim();

      console.log(`   Comando: "${contentWithoutMention}"`);

      // Processar diferentes comandos
      if (!contentWithoutMention) {
        console.log(`   ⚠️ Mensagem vazia após remover menção, ignorando...`);
        return;
      }

      const command = contentWithoutMention.toLowerCase();

      // Enviar todas as mensagens para o agente Deco
      console.log(`🌐 Enviando pergunta/ação para webhook do Deco...`);
      console.log(`   📤 Conteúdo a ser enviado: "${contentWithoutMention}"`);

      // Se for uma resposta, buscar contexto da mensagem anterior
      let contextMessage = '';
      if (message.reference?.messageId) {
        try {
          const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
          contextMessage = `\n\n[CONTEXTO ANTERIOR: ${referencedMessage.author.username} disse: "${referencedMessage.content}"]`;
          console.log(`   📋 Contexto adicionado: "${referencedMessage.content}"`);
        } catch (error) {
          console.log(`   📋 Erro ao buscar contexto: ${error}`);
        }
      }

      const webhookData = this.decoWebhook.createWebhookData(
        message,
        this.client.user!.id,
        this.client.user!.username,
        false
      );

      // Adicionar contexto se disponível
      if (contextMessage) {
        webhookData.message.content += contextMessage;
      }

      console.log(`   📤 Dados do webhook criados, enviando...`);

      const webhookResponse = await this.decoWebhook.sendMessage(webhookData);

      if (webhookResponse) {
        console.log(`   ✅ Mensagem enviada para o agente Deco com sucesso`);
        console.log(`   📝 Agente Deco irá responder diretamente no Discord`);
      } else {
        console.log(`   ❌ Erro ao enviar mensagem para o agente Deco`);
      }

    } catch (error) {
      console.error('❌ Erro ao processar menção ao bot:', error);
    }
  }







  private createDiscordMessage(message: Message): DiscordMessage {
    // Determinar channelId e threadId corretamente
    let channelId: string;
    let threadId: string | undefined;
    let threadTitle: string | undefined;
    let channelName: string | undefined;

    if (message.channel.type === 11 || message.channel.type === 12 || message.channel.type === 13) {
      // É uma thread - usar parentId como channelId e channel.id como threadId
      channelId = (message.channel as any).parentId;
      threadId = message.channel.id;
      threadTitle = (message.channel as any).name;
      channelName = (message.channel as any).name;
    } else {
      // É um canal normal
      channelId = message.channel.id;
      threadId = undefined;
      threadTitle = undefined;
      channelName = (message.channel as any).name;
    }

    return {
      _id: message.id,
      channelId: channelId,
      guildId: message.guild?.id || '',
      userId: message.author.id,
      username: message.author.username,
      content: message.content,
      timestamp: message.createdAt,
      replyTo: message.reference?.messageId || undefined,
      threadId: threadId,
      threadTitle: threadTitle,
      channelName: channelName,
      attachments: message.attachments.map(att => att.url),
      embeds: message.embeds,
      mentions: message.mentions.users.map(user => user.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private getChannelTypeName(type: number): string {
    switch (type) {
      case 0: return 'Text Channel';
      case 15: return 'Forum Channel';
      case 11: return 'Thread';
      case 12: return 'Public Thread';
      case 13: return 'Private Thread';
      default: return `Unknown (${type})`;
    }
  }

  private async fetchOldMessages(): Promise<void> {
    console.log('🔄 Iniciando busca de mensagens antigas...');
    
    for (const channelId of config.monitoredChannels) {
      try {
        const channel = await this.client.channels.fetch(channelId);
        
        if (!channel) {
          console.warn(`⚠️ Canal não encontrado: ${channelId}`);
          continue;
        }

        // Verificar tipo de canal
        if (channel.type === 15) { // Forum Channel
          console.log(`📚 Canal Forum encontrado: #${(channel as ForumChannel).name}`);
          await this.fetchForumMessages(channel as ForumChannel);
        } else if (channel.type === 0) { // Text Channel
          console.log(`📚 Canal de texto encontrado: #${(channel as TextChannel).name}`);
          await this.fetchTextChannelMessages(channel as TextChannel);
        } else {
          console.warn(`⚠️ Tipo de canal não suportado: ${channel.type} (${channelId})`);
          continue;
        }

      } catch (error) {
        console.error(`❌ Erro ao buscar mensagens antigas do canal ${channelId}:`, error);
        console.log(`   Verifique se o canal existe e o bot tem permissões`);
      }
    }

    console.log('✅ Busca de mensagens antigas concluída');
  }

  private async fetchTextChannelMessages(channel: TextChannel): Promise<void> {
    // Verificar se o bot tem permissões para ler o canal
    if (!channel.permissionsFor(this.client.user!)?.has('ReadMessageHistory')) {
      console.warn(`⚠️ Bot sem permissão para ler histórico do canal: #${channel.name}`);
      return;
    }

    console.log(`📚 Buscando mensagens antigas em #${channel.name}...`);
    
    let lastId: string | undefined;
    let messageCount = 0;
    const batchSize = 100;

    while (true) {
      const options: any = { limit: batchSize };
      if (lastId) {
        options.before = lastId;
      }

      const messages = await channel.messages.fetch(options) as any;
      
      if (messages.size === 0) break;

                  const messagesToProcess: DiscordMessage[] = [];

      for (const message of messages.values()) {
        if (!message.author.bot) {
          const discordMessage = this.createDiscordMessage(message);
          messagesToProcess.push(discordMessage);
        }
      }

      // Salvar em lote no Supabase (se habilitado)
      for (const msg of messagesToProcess) {
        await this.supabaseStorage.saveMessage(msg);
      }

      messageCount += messagesToProcess.length;
      const lastMessage = messages.last();
      lastId = lastMessage?.id;

      console.log(`✅ Processadas ${messagesToProcess.length} mensagens antigas de #${channel.name}`);
    }

    console.log(`✅ Total de ${messageCount} mensagens antigas processadas de #${channel.name}`);
  }

  private async fetchForumMessages(forumChannel: ForumChannel): Promise<void> {
    console.log(`📚 Buscando threads do forum #${forumChannel.name}...`);
    
    try {
      // Buscar threads ativas
      const threads = await forumChannel.threads.fetchActive();
      const archivedThreads = await forumChannel.threads.fetchArchived();
      
      const allThreads = [...threads.threads.values(), ...archivedThreads.threads.values()];
      
      console.log(`📝 Encontradas ${allThreads.length} threads no forum`);
      
      let totalMessages = 0;
      
      for (const thread of allThreads) {
        console.log(`📖 Processando thread: #${thread.name}`);
        
        try {
          let lastId: string | undefined;
          const batchSize = 100;
          let threadMessageCount = 0;

          while (true) {
            const options: any = { limit: batchSize };
            if (lastId) {
              options.before = lastId;
            }

            const messages = await thread.messages.fetch(options) as any;
            
            if (messages.size === 0) break;

            const messagesToProcess: DiscordMessage[] = [];

            for (const message of messages.values()) {
              if (!message.author.bot) {
                const discordMessage = this.createDiscordMessage(message);
                messagesToProcess.push(discordMessage);
              }
            }

            // Salvar em lote no Supabase (se habilitado)
            for (const msg of messagesToProcess) {
              await this.supabaseStorage.saveMessage(msg);
            }

            threadMessageCount += messagesToProcess.length;
            const lastMessage = messages.last();
            lastId = lastMessage?.id;
          }

          console.log(`✅ Processadas ${threadMessageCount} mensagens da thread #${thread.name}`);
          totalMessages += threadMessageCount;

        } catch (error) {
          console.error(`❌ Erro ao processar thread #${thread.name}:`, error);
        }
      }

      console.log(`✅ Total de ${totalMessages} mensagens processadas do forum #${forumChannel.name}`);

    } catch (error) {
      console.error(`❌ Erro ao buscar threads do forum:`, error);
    }
  }

  async start(): Promise<void> {
    try {
      // Conectar ao Supabase (se habilitado)
      await this.supabaseStorage.connect();

      // Conectar ao Discord
      await this.client.login(config.discord.token);

    } catch (error) {
      console.error('❌ Erro ao iniciar o bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.supabaseStorage.disconnect();
      await this.client.destroy();
      console.log('🛑 Bot parado');
    } catch (error) {
      console.error('❌ Erro ao parar o bot:', error);
    }
  }
} 