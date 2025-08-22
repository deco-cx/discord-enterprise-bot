export interface DiscordEventData {
  eventType:
    | 'message_create'
    | 'message_update'
    | 'message_delete'
    | 'message_reaction_add'
    | 'message_reaction_remove'
    | 'thread_create'
    | 'thread_delete'
    | 'thread_update';
  messageId?: string;
  channelId: string;
  guildId?: string;
  userId?: string;
  content?: string;
  author?: {
    id: string;
    username: string;
    discriminator: string;
    bot: boolean;
  };
  timestamp: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
    contentType?: string;
  }>;
  thread?: {
    id: string;
    name: string;
    type: string;
    parentId?: string;
  };
  oldContent?: string;
  newContent?: string;
  reaction?: {
    emoji: string;
    userId: string;
  };
}
