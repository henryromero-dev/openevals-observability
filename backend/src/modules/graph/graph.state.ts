import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';

/**
 * Graph state for the customer support agent.
 * - messages:  full conversation history
 * - intent:    detected intent (refund | technical | general)
 * - escalate:  whether the agent decided to escalate to a human
 * - threadId:  conversation ID used for checkpointing
 */
export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  intent: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),
  escalate: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),
  threadId: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),
});

export type GraphStateType = typeof GraphState.State;
