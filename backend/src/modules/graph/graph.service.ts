import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HumanMessage } from '@langchain/core/messages';
import { buildSupportGraph, type SupportGraph } from './graph.builder';
import { v4 as uuid } from 'uuid';

export interface ChatResponse {
  threadId: string;
  message: string;
  intent: string;
  escalate: boolean;
  nodeTrace: string[];
}

@Injectable()
export class GraphService implements OnModuleInit {
  private graph: SupportGraph;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const geminiApiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    this.graph = buildSupportGraph(geminiApiKey);
  }

  async chat(message: string, threadId?: string): Promise<ChatResponse> {
    const resolvedThreadId = threadId ?? uuid();

    const result = await this.graph.invoke(
      {
        messages: [new HumanMessage(message)],
        threadId: resolvedThreadId,
      },
      {
        configurable: { thread_id: resolvedThreadId },
      },
    );

    const lastAiMessage = [...result.messages]
      .reverse()
      .find((m) => m.getType() === 'ai');

    return {
      threadId: resolvedThreadId,
      message: (lastAiMessage?.content as string) ?? '',
      intent: result.intent ?? 'general',
      escalate: result.escalate ?? false,
      nodeTrace: ['intent_classifier', 'responder', 'escalation_check'],
    };
  }

  /**
   * Simulation-friendly wrapper: accepts the openevals message format
   * and maintains conversation history per threadId via the in-memory checkpointer.
   */
  async chatForSimulation(
    inputs: { role: string; content: string },
    threadId: string,
  ): Promise<{ role: string; content: string }> {
    const result = await this.graph.invoke(
      {
        messages: [new HumanMessage(inputs.content)],
        threadId,
      },
      {
        configurable: { thread_id: threadId },
      },
    );

    const lastAiMessage = [...result.messages]
      .reverse()
      .find((m) => m.getType() === 'ai');

    return {
      role: 'assistant',
      content: (lastAiMessage?.content as string) ?? '',
    };
  }
}
