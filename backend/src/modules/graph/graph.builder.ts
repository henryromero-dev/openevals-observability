import { StateGraph, START, END } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { GraphState } from './graph.state';
import { createIntentClassifierNode } from './nodes/intent-classifier.node';
import { createResponderNode } from './nodes/responder.node';
import { createEscalationCheckNode } from './nodes/escalation-check.node';

/**
 * Builds and compiles the static customer support graph.
 *
 * Flow:
 *   START → intent_classifier → responder → escalation_check → END
 *
 * The escalation_check node only activates meaningful logic when the
 * conversation has enough turns (>= 4 messages); otherwise it always
 * returns escalate: false.
 */
export function buildSupportGraph(geminiApiKey: string) {
  const checkpointer = new MemorySaver();

  const graph = new StateGraph(GraphState)
    .addNode('intent_classifier', createIntentClassifierNode(geminiApiKey))
    .addNode('responder', createResponderNode(geminiApiKey))
    .addNode('escalation_check', createEscalationCheckNode(geminiApiKey))
    .addEdge(START, 'intent_classifier')
    .addEdge('intent_classifier', 'responder')
    .addEdge('responder', 'escalation_check')
    .addEdge('escalation_check', END)
    .compile({ checkpointer });

  return graph;
}

export type SupportGraph = ReturnType<typeof buildSupportGraph>;
