import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphStateType } from '../graph.state';

const SYSTEM_PROMPT = `You are an intent classifier for a customer support system.
Analyze the last user message and respond ONLY with one of these exact words:
- refund     (wants a refund, return, cancellation, or money back)
- technical  (technical issue, error, bug, something not working)
- general    (general inquiry, product information, how-to questions)

Respond with the single word only — no explanation, no punctuation.`;

/**
 * Node 1: Classifies the user's intent.
 * Detects whether the user wants a refund, has a technical issue,
 * or is asking a general question.
 */
export function createIntentClassifierNode(apiKey: string) {
  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    apiKey,
    temperature: 0,
    maxRetries: 2,
  });

  return async (state: GraphStateType): Promise<Partial<GraphStateType>> => {
    const lastUserMessage = [...state.messages]
      .reverse()
      .find((m) => m.getType() === 'human');

    if (!lastUserMessage) {
      return { intent: 'general' };
    }

    const response = await model.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(lastUserMessage.content as string),
    ]);

    const raw = (response.content as string).trim().toLowerCase();
    const intent = ['refund', 'technical', 'general'].includes(raw)
      ? raw
      : 'general';

    return { intent };
  };
}
