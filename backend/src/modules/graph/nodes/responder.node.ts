import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AIMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphStateType } from '../graph.state';

const SYSTEM_PROMPTS: Record<string, string> = {
  refund: `You are a customer support agent specialized in refunds and returns.
You are empathetic, understanding, and professional. Your goal is to resolve the
situation fairly. You can offer a full refund, partial refund, or store credit
depending on the case. Stay calm and constructive even when the customer is frustrated.`,

  technical: `You are a technical support expert.
You are patient, methodical, and clear in your explanations. You ask specific questions
to diagnose the problem and provide concrete, verifiable steps. If the issue persists
after troubleshooting, you offer to escalate it to a specialized team.`,

  general: `You are a friendly and helpful general customer support agent.
You answer questions about the product, policies, and procedures clearly and concisely.
If you are unsure about something, you acknowledge it and offer to find the correct information.`,
};

/**
 * Node 2: Generates a response based on the detected intent.
 * Uses a specialized system prompt for each type of inquiry.
 */
export function createResponderNode(apiKey: string) {
  const models: Record<string, ChatGoogleGenerativeAI> = {
    refund: new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey,
      temperature: 0.7,
      maxRetries: 2,
    }),
    technical: new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey,
      temperature: 0.3,
      maxRetries: 2,
    }),
    general: new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey,
      temperature: 0.7,
      maxRetries: 2,
    }),
  };

  return async (state: GraphStateType): Promise<Partial<GraphStateType>> => {
    const intent = state.intent || 'general';
    const model = models[intent] ?? models.general;
    const systemPrompt = SYSTEM_PROMPTS[intent] ?? SYSTEM_PROMPTS.general;

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      ...state.messages,
    ]);

    return {
      messages: [new AIMessage(response.content as string)],
    };
  };
}
