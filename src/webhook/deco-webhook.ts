import axios from 'axios';

interface DecoWebhookData {
  message: {
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
    };
    channel: {
      id: string;
      name: string;
    };
    guild: {
      id: string;
      name: string;
    };
    timestamp: string;
    thread_id?: string;
    thread_title?: string;
  };
  context: {
    bot_id: string;
    bot_name: string;
    command?: string;
    is_command: boolean;
  };
}

interface DecoWebhookResponse {
  response: string;
  action?: string;
  metadata?: any;
}

export class DecoWebhook {
  private webhookUrl: string;
  private passphrase: string;

  constructor() {
    this.webhookUrl = process.env.DECO_WEBHOOK_URL || 'https://api.deco.chat/shared/deco.cx/triggers/a6ab7c9f-eeaf-43b1-aa45-f4501dd818fe';
    this.passphrase = process.env.DECO_WEBHOOK_PASSPHRASE || 'discordteste';
    
    console.log('🔧 Configuração do Webhook Deco:');
    console.log(`   URL: ${this.webhookUrl}`);
    console.log(`   Passphrase: ${this.passphrase ? '***' : 'NÃO CONFIGURADA'}`);
  }

  async sendMessage(data: DecoWebhookData): Promise<DecoWebhookResponse | null> {
    try {
      console.log('🌐 Enviando dados para webhook do Deco...');
      
      // Construir URL com passphrase como parâmetro de query
      const urlWithPassphrase = `${this.webhookUrl}?passphrase=${this.passphrase}`;
      
      console.log(`   URL: ${urlWithPassphrase}`);
      console.log(`   Mensagem: "${data.message.content}"`);
      console.log(`   Autor: ${data.message.author.username}`);
      console.log(`   Canal: ${data.message.channel.name}`);

      const response = await axios.post(
        urlWithPassphrase,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 segundos
        }
      );

      console.log('✅ Resposta do webhook recebida');
      console.log(`   Status: ${response.status}`);
      console.log(`   Resposta: ${JSON.stringify(response.data)}`);

      return response.data;
    } catch (error: unknown) {
      console.error('❌ Erro ao enviar para webhook do Deco:', error);

      if (axios.isAxiosError(error)) {
        console.error(`   Status: ${error.response?.status}`);
        console.error(`   Erro: ${JSON.stringify(error.response?.data)}`);
      } else if (error instanceof Error) {
        console.error(`   Erro: ${error.message}`);
      } else {
        console.error('   Erro desconhecido ao chamar webhook');
      }

      return null;
    }
  }

  createWebhookData(
    message: any,
    botId: string,
    botName: string,
    isCommand: boolean = false,
    command?: string
  ): DecoWebhookData {
    // Remover a menção do bot do conteúdo
    const contentWithoutMention = message.content.replace(/<@!\d+>|<@\d+>/g, '').trim();
    
    // Verificar se é uma resposta e incluir contexto
    let contextInfo = '';
    if (message.reference?.messageId) {
      contextInfo = `\n\n[CONTEXTO: Esta é uma resposta a uma mensagem anterior. Considere o contexto da conversa.]`;
    }
    
    return {
      message: {
        id: message.id,
        content: `[SYSTEM: Você é um assistente de IA no Discord. RESPONDA DIRETAMENTE. NÃO explique, NÃO peça confirmação, NÃO faça perguntas. Se não conseguir fazer algo, diga apenas: "Não posso fazer isso porque [motivo simples]". Seja direto e conciso.]${contextInfo}\n\nPergunta: ${contentWithoutMention}`,
        author: {
          id: message.author.id,
          username: message.author.username
        },
        channel: {
          id: message.channel.id,
          name: (message.channel as any).name || 'Unknown'
        },
        guild: {
          id: message.guild?.id || '',
          name: message.guild?.name || 'Unknown'
        },
        timestamp: message.createdAt.toISOString(),
        thread_id: message.channel.type === 11 || message.channel.type === 12 || message.channel.type === 13 
          ? message.channel.id 
          : undefined,
        thread_title: message.channel.type === 11 || message.channel.type === 12 || message.channel.type === 13 
          ? (message.channel as any).name 
          : undefined
      },
      context: {
        bot_id: botId,
        bot_name: botName,
        command: command,
        is_command: isCommand
      }
    };
  }
} 