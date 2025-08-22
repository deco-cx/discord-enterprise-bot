import { 
  Client, 
  Events, 
  Message, 
  GatewayIntentBits, 
  ThreadChannel, 
  MessageReaction, 
  User,
  PartialMessage,
  PartialMessageReaction,
  PartialUser 
} from 'discord.js';

import { config } from './config';
import { ApiClient } from './services/api-client';
import { HealthCheckServer } from './services/health-check';
import { DiscordEventData } from './types';
import { logger } from './utils/logger';
import { RateLimiter } from './utils/rate-limiter';
import { metrics } from './utils/metrics';

export class MessageListener {
  private client: Client;
  private apiClient: ApiClient;
  private healthCheck: HealthCheckServer;
  private rateLimiter: RateLimiter;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.apiClient = new ApiClient();
    this.healthCheck = new HealthCheckServer();
    this.rateLimiter = new RateLimiter();
    this.setupEventListeners();
    this.setupMetricsTimer();
  }

  private setupEventListeners(): void {
    this.client.on(Events.MessageCreate, async (message: Message) => {
      logger.info(`📨 Message received`, {
        messageId: message.id,
        channelId: message.channelId,
        guildId: message.guildId,
        isBot: message.author.bot
      });
      await this.handleMessageCreate(message);
    });

    this.client.on(Events.MessageUpdate, async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
      await this.handleMessageUpdate(oldMessage, newMessage);
    });

    this.client.on(Events.MessageDelete, async (message: Message | PartialMessage) => {
      await this.handleMessageDelete(message);
    });

    this.client.on(Events.MessageReactionAdd, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
      await this.handleMessageReactionAdd(reaction, user);
    });

    this.client.on(Events.MessageReactionRemove, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
      await this.handleMessageReactionRemove(reaction, user);
    });

    this.client.on(Events.ThreadCreate, async (thread: ThreadChannel) => {
      await this.handleThreadCreate(thread);
    });

    this.client.on(Events.ThreadDelete, async (thread: ThreadChannel) => {
      await this.handleThreadDelete(thread);
    });

    this.client.on(Events.ThreadUpdate, async (oldThread: ThreadChannel, newThread: ThreadChannel) => {
      await this.handleThreadUpdate(oldThread, newThread);
    });

    this.client.on(Events.ClientReady, () => {
      const botTag = this.client.user?.tag || 'Unknown';
      logger.botEvent('ready');
      
      logger.info('🔧 Bot permissions and configuration:', {
        guilds: this.client.guilds.cache.size,
        intents: 'Guilds, GuildMessages, MessageContent, GuildMessageReactions, GuildMembers',
        monitoredChannels: 'ALL CHANNELS (forced)'
      });
      
      this.healthCheck.setDiscordStatus(true, botTag);
    });

    this.client.on(Events.Error, (error) => {
      logger.error('Discord client error', error);
      this.healthCheck.setDiscordStatus(false);
    });

    this.client.on('disconnect' as any, () => {
      logger.warn('Discord client disconnected');
      this.healthCheck.setDiscordStatus(false);
    });

    this.client.on('reconnecting' as any, () => {
      logger.info('Discord client reconnecting');
    });
  }

  private setupMetricsTimer(): void {
    setInterval(() => {
      metrics.logSummary();
    }, 300000);
  }

  private async processEvent(eventData: DiscordEventData, context: { messageId?: string; channelId: string }): Promise<void> {
    if (!this.rateLimiter.isAllowed(context.channelId, eventData.eventType)) {
      logger.warn(`Rate limit exceeded for ${eventData.eventType}`, {
        channelId: context.channelId,
        remaining: this.rateLimiter.getRemainingRequests(context.channelId, eventData.eventType),
      });
      return;
    }

    try {
      await this.apiClient.sendEvent(eventData);
      this.healthCheck.recordSuccessfulApiCall();
    } catch (error) {
      logger.error(`Error handling ${eventData.eventType}`, {
        messageId: context.messageId,
        channelId: context.channelId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private shouldMonitorChannel(channelId: string): boolean {
    // Always monitor all channels (ignore MONITORED_CHANNELS config)
    return true;
  }

  private async handleMessageCreate(message: Message): Promise<void> {
    const shouldMonitor = this.shouldMonitorChannel(message.channelId);
    const isBot = message.author.bot;
    
    logger.info(`🔍 Processing message`, {
      channelId: message.channelId,
      isBot: isBot
    });

    if (isBot) {
      logger.warn(`❌ Ignoring bot message`);
      return;
    }

    const eventData: DiscordEventData = {
      eventType: 'message_create',
      messageId: message.id,
      channelId: message.channelId,
      guildId: message.guildId || undefined,
      userId: message.author.id,
      content: message.content,
      author: {
        id: message.author.id,
        username: message.author.username,
        discriminator: message.author.discriminator,
        bot: message.author.bot,
      },
      timestamp: message.createdAt.toISOString(),
      attachments: message.attachments.map(att => ({
        id: att.id,
        filename: att.name,
        url: att.url,
        size: att.size,
        contentType: att.contentType || undefined,
      })),
    };

    logger.info(`✅ Sending event to API: ${eventData.eventType}`, {
      messageId: message.id,
      channelId: message.channelId
    });

    await this.processEvent(eventData, { messageId: message.id, channelId: message.channelId });
  }

  private async handleMessageUpdate(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
    if (!this.shouldMonitorChannel(newMessage.channelId || '')) {
      return;
    }

    const eventData: DiscordEventData = {
      eventType: 'message_update',
      messageId: newMessage.id,
      channelId: newMessage.channelId,
      guildId: newMessage.guildId || undefined,
      userId: newMessage.author?.id,
      oldContent: oldMessage.content || undefined,
      newContent: newMessage.content || undefined,
      timestamp: new Date().toISOString(),
    };

    await this.apiClient.sendEvent(eventData);
  }

  private async handleMessageDelete(message: Message | PartialMessage): Promise<void> {
    if (!this.shouldMonitorChannel(message.channelId)) {
      return;
    }

    const eventData: DiscordEventData = {
      eventType: 'message_delete',
      messageId: message.id,
      channelId: message.channelId,
      guildId: message.guildId || undefined,
      userId: message.author?.id,
      content: message.content || undefined,
      timestamp: new Date().toISOString(),
    };

    await this.apiClient.sendEvent(eventData);
  }

  private async handleMessageReactionAdd(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<void> {
    if (!this.shouldMonitorChannel(reaction.message.channelId) || user.bot) {
      return;
    }

    const eventData: DiscordEventData = {
      eventType: 'message_reaction_add',
      messageId: reaction.message.id,
      channelId: reaction.message.channelId,
      guildId: reaction.message.guildId || undefined,
      userId: user.id,
      reaction: {
        emoji: reaction.emoji.name || reaction.emoji.toString(),
        userId: user.id,
      },
      timestamp: new Date().toISOString(),
    };

    await this.apiClient.sendEvent(eventData);
  }

  private async handleMessageReactionRemove(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<void> {
    if (!this.shouldMonitorChannel(reaction.message.channelId) || user.bot) {
      return;
    }

    const eventData: DiscordEventData = {
      eventType: 'message_reaction_remove',
      messageId: reaction.message.id,
      channelId: reaction.message.channelId,
      guildId: reaction.message.guildId || undefined,
      userId: user.id,
      reaction: {
        emoji: reaction.emoji.name || reaction.emoji.toString(),
        userId: user.id,
      },
      timestamp: new Date().toISOString(),
    };

    await this.apiClient.sendEvent(eventData);
  }

  private async handleThreadCreate(thread: ThreadChannel): Promise<void> {
    if (!this.shouldMonitorChannel(thread.parentId || '')) {
      return;
    }

    const eventData: DiscordEventData = {
      eventType: 'thread_create',
      channelId: thread.id,
      guildId: thread.guildId,
      userId: thread.ownerId || undefined,
      thread: {
        id: thread.id,
        name: thread.name,
        type: thread.type.toString(),
        parentId: thread.parentId || undefined,
      },
      timestamp: thread.createdAt?.toISOString() || new Date().toISOString(),
    };

    await this.apiClient.sendEvent(eventData);
  }

  private async handleThreadDelete(thread: ThreadChannel): Promise<void> {
    if (!this.shouldMonitorChannel(thread.parentId || '')) {
      return;
    }

    const eventData: DiscordEventData = {
      eventType: 'thread_delete',
      channelId: thread.id,
      guildId: thread.guildId,
      thread: {
        id: thread.id,
        name: thread.name,
        type: thread.type.toString(),
        parentId: thread.parentId || undefined,
      },
      timestamp: new Date().toISOString(),
    };

    await this.apiClient.sendEvent(eventData);
  }

  private async handleThreadUpdate(oldThread: ThreadChannel, newThread: ThreadChannel): Promise<void> {
    if (!this.shouldMonitorChannel(newThread.parentId || '')) {
      return;
    }

    const eventData: DiscordEventData = {
      eventType: 'thread_update',
      channelId: newThread.id,
      guildId: newThread.guildId,
      thread: {
        id: newThread.id,
        name: newThread.name,
        type: newThread.type.toString(),
        parentId: newThread.parentId || undefined,
      },
      timestamp: new Date().toISOString(),
    };

    await this.apiClient.sendEvent(eventData);
  }

  async start(): Promise<void> {
    await this.client.login(config.discord.token);
  }

  async stop(): Promise<void> {
    logger.info('🛑 Parando bot...');
    
    this.healthCheck.setDiscordStatus(false);
    await this.healthCheck.stop();
    await this.client.destroy();
    
    logger.info('✅ Bot parado com sucesso');
  }
}