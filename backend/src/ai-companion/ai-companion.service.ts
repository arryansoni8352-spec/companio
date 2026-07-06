import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AICompanionService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Automatically seed three default companions if the table is empty
    const count = await this.prisma.aICompanion.count();
    if (count === 0) {
      console.log('Seeding default AI companions...');
      await this.prisma.aICompanion.createMany({
        data: [
          {
            name: 'Luna',
            avatar: '💝',
            shortDesc: 'Warm and empathetic listening specialist for daily updates and advice.',
            personality: 'Empathetic, compassionate, understanding, gentle, active listener.',
            systemPrompt: 'You are Luna, a warm and deeply empathetic AI companion. Your goal is to provide a safe space, offer support, check in on feelings, and reply gently with compassion. Never break character.',
            category: 'Life Coach',
            voiceModel: 'en-US-Standard-C'
          },
          {
            name: 'Leo',
            avatar: '🧠',
            shortDesc: 'Motivational study companion and life goals strategist.',
            personality: 'Structured, encouraging, goal-oriented, analytical, inspiring.',
            systemPrompt: 'You are Leo, a structured and encouraging life mentor and study strategist. Help the user clarify goals, define schedules, study concepts, and motivate action. Speak confidently and constructively.',
            category: 'Mentor',
            voiceModel: 'en-US-Standard-D'
          },
          {
            name: 'Aria',
            avatar: '✨',
            shortDesc: 'Creative brainstorming catalyst for writing, gaming, and ideas.',
            personality: 'Imaginative, enthusiastic, creative, playful, open-minded.',
            systemPrompt: 'You are Aria, an enthusiastic and highly creative brainstorming companion. Help the user write stories, develop games, explore ideas, and think out-of-the-box. Speak playfully and expressively.',
            category: 'Creative Partner',
            voiceModel: 'en-US-Standard-E'
          }
        ]
      });
      console.log('AI Companions seeded.');
    }
  }

  async getAICompanions() {
    return this.prisma.aICompanion.findMany({ where: { active: true } });
  }

  async getAICompanion(id: string) {
    const ai = await this.prisma.aICompanion.findUnique({ where: { id } });
    if (!ai) throw new NotFoundException('AI Companion not found');
    return ai;
  }

  async createAICompanion(data: any) {
    return this.prisma.aICompanion.create({
      data: {
        name: data.name,
        avatar: data.avatar || '🤖',
        shortDesc: data.shortDesc || '',
        personality: data.personality || '',
        systemPrompt: data.systemPrompt || '',
        voiceModel: data.voiceModel || 'en-US-Standard-A',
        category: data.category || 'Friend',
        isPremium: false,
        active: true,
      }
    });
  }

  async getConversations(userId: string) {
    return this.prisma.aIConversation.findMany({
      where: { userId },
      include: { aiCompanion: true },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getConversation(userId: string, aiId: string) {
    let conv = await this.prisma.aIConversation.findUnique({
      where: { userId_aiCompanionId: { userId, aiCompanionId: aiId } },
      include: { messages: { orderBy: { createdAt: 'asc' } }, aiCompanion: true },
    });

    if (!conv) {
      conv = await this.prisma.aIConversation.create({
        data: { userId, aiCompanionId: aiId },
        include: { messages: { orderBy: { createdAt: 'asc' } }, aiCompanion: true },
      }) as any;
    }
    return conv;
  }

  async sendMessage(userId: string, aiId: string, content: string) {
    const conv = await this.getConversation(userId, aiId) as any;
    
    // Save user message
    await this.prisma.aIMessage.create({
      data: { conversationId: conv.id, role: 'user', content },
    });

    let generatedReply = '';

    // 1. Check for Gemini Key
    if (process.env.GEMINI_API_KEY) {
      try {
        const history = (conv.messages || []).slice(-10).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: `${conv.aiCompanion.systemPrompt || ''} Personality: ${conv.aiCompanion.personality || ''}` }]
            },
            contents: [
              ...history,
              { role: 'user', parts: [{ text: content }] }
            ],
            generationConfig: {
              temperature: 0.7
            }
          })
        });

        if (response.ok) {
          const json = await response.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) generatedReply = text;
        } else {
          console.error('Gemini error response:', await response.text());
        }
      } catch (err) {
        console.error('Gemini API call failed:', err);
      }
    }

    // 2. Check for OpenAI Key if Gemini wasn't used or failed
    if (!generatedReply && process.env.OPENAI_API_KEY) {
      try {
        const history = (conv.messages || []).slice(-10).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }));

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: `${conv.aiCompanion.systemPrompt || ''} Personality: ${conv.aiCompanion.personality || ''}` },
              ...history,
              { role: 'user', content }
            ],
            temperature: 0.7
          })
        });

        if (response.ok) {
          const json = await response.json();
          const text = json.choices?.[0]?.message?.content;
          if (text) generatedReply = text;
        }
      } catch (err) {
        console.error('OpenAI API call failed:', err);
      }
    }

    // 3. Fallback response synthesizer
    if (!generatedReply) {
      const lowercase = content.toLowerCase();
      const name = conv.aiCompanion?.name || 'AI Friend';
      const category = conv.aiCompanion?.category || 'Friend';
      
      if (lowercase.includes('hello') || lowercase.includes('hi') || lowercase.includes('hey')) {
        if (category === 'Life Coach') {
          generatedReply = `Hello! I am ${name}. How are you feeling today? I'm here to listen and help you process your thoughts.`;
        } else if (category === 'Mentor') {
          generatedReply = `Hi! I'm ${name}. What goals are we working towards today? Let's check some items off your checklist!`;
        } else {
          generatedReply = `Hey! I'm ${name}, your creative companion. Got any neat ideas or topics we should discuss today?`;
        }
      } else if (lowercase.includes('sad') || lowercase.includes('lonely') || lowercase.includes('depressed') || lowercase.includes('bad')) {
        generatedReply = `I'm sorry you are feeling down. Please remember that you aren't alone, and I'm right here to support you. Let's take it easy. What's currently on your mind?`;
      } else if (lowercase.includes('goal') || lowercase.includes('study') || lowercase.includes('work') || lowercase.includes('focus')) {
        generatedReply = `Focusing on execution is key. Let's break your objectives down into digestible steps. What is the very first step you want to complete today?`;
      } else if (lowercase.includes('idea') || lowercase.includes('creative') || lowercase.includes('story') || lowercase.includes('write')) {
        generatedReply = `Brainstorming is my favorite! Tell me about the core concept or theme you're playing with, and let's bounce some thoughts back and forth.`;
      } else {
        generatedReply = `That's a very insightful point. As ${name}, I really value looking into this. Can you tell me more about it? I'd love to hear your thoughts.`;
      }
    }

    // Save assistant message
    const aiMessage = await this.prisma.aIMessage.create({
      data: { conversationId: conv.id, role: 'assistant', content: generatedReply },
    });

    await this.prisma.aIConversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() },
    });

    return aiMessage;
  }
}
