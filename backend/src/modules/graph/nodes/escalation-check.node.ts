import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { GraphStateType } from '../graph.state';

const ESCALATION_PROMPT = `You are an escalation evaluator for a customer support system.
Analyze the full conversation and determine whether the customer should be escalated to a human agent.

Escalate (respond "true") if:
- The customer has expressed extreme frustration or anger repeatedly
- The issue was not resolved after multiple exchanges
- The customer explicitly requested to speak with a human
- The conversation involves legal threats or formal complaints
- The case involves fraud or security concerns

If none of the above apply, respond "false".
Respond ONLY with "true" or "false" — no explanation.`;

/**
 * Node 3: Evaluates whether the conversation should be escalated to a human agent.
 * Analyzes frustration patterns, unresolved issues, and explicit escalation requests.
 */
export function createEscalationCheckNode(apiKey: string) {
  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    apiKey,
    temperature: 0,
    maxRetries: 2,
  });

  return async (state: GraphStateType): Promise<Partial<GraphStateType>> => {
    if (state.messages.length < 4) {
      // Not enough context to trigger escalation in early turns
      return { escalate: false };
    }

    const conversationSummary = state.messages
      .map((m) => `${m.getType() === 'human' ? 'User' : 'Agent'}: ${m.content}`)
      .join('\n');

    const response = await model.invoke([
      new SystemMessage(ESCALATION_PROMPT),
      new HumanMessage(`Conversation:\n${conversationSummary}`),
    ]);

    const raw = (response.content as string).trim().toLowerCase();
    return { escalate: raw === 'true' };
  };
}
