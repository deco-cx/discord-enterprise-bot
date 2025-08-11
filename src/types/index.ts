export interface DiscordMessage {
  _id: string;
  channelId: string;
  guildId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  replyTo?: string;
  threadId?: string;
  threadTitle?: string; // Título da thread (se aplicável)
  channelName?: string; // Nome do canal
  isClosed?: boolean; // Indica se a thread foi fechada
  attachments: string[];
  embeds: any[];
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookPayload {
  channel_id: string;
  message_id: string;
  content: string;
  author: {
    id: string;
    username: string;
  };
  link: string;
  timestamp: string;
  reply_to?: string;
  thread_id?: string;
}

export interface EmbeddingData {
  id: string;
  values: number[];
  metadata: {
    channelId: string;
    guildId: string;
    userId: string;
    content: string;
    timestamp: string;
  };
} 