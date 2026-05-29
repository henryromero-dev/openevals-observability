// ── Personas ────────────────────────────────────────────────────────────────

export interface Persona {
  id: number;
  name: string;
  description: string;
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonaPayload {
  name: string;
  description?: string;
  systemPrompt: string;
}

export type UpdatePersonaPayload = Partial<CreatePersonaPayload>;

// ── Evaluators ──────────────────────────────────────────────────────────────

export interface Evaluator {
  id: number;
  name: string;
  description: string;
  promptTemplate: string;
  feedbackKey: string;
  model: string;
  scoreDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluatorPayload {
  name: string;
  description?: string;
  promptTemplate: string;
  feedbackKey: string;
  model?: string;
  scoreDescription?: string;
}

export type UpdateEvaluatorPayload = Partial<CreateEvaluatorPayload>;

// ── Simulations ─────────────────────────────────────────────────────────────

export type SimulationStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TrajectoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EvaluatorScore {
  feedbackKey: string;
  score: boolean | number | null;
  reasoning?: string;
}

export interface SimulationResult {
  id: number;
  simulationId: number;
  turnCount: number;
  trajectory: TrajectoryMessage[];
  scores: EvaluatorScore[];
  langsmithExperimentUrl: string | null;
  createdAt: string;
}

export interface Simulation {
  id: number;
  name: string;
  personaId: number;
  persona: Persona;
  evaluatorIds: number[];
  initialMessage: string;
  maxTurns: number;
  status: SimulationStatus;
  langsmithRunId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  result?: SimulationResult;
}

export interface CreateSimulationPayload {
  name: string;
  personaId: number;
  evaluatorIds: number[];
  initialMessage: string;
  maxTurns?: number;
}

// ── Graph / Chat ─────────────────────────────────────────────────────────────

export interface ChatResponse {
  threadId: string;
  message: string;
  intent: 'refund' | 'technical' | 'general';
  escalate: boolean;
  nodeTrace: string[];
}

// ── Reports ──────────────────────────────────────────────────────────────────

export interface RunSummary {
  id: string;
  name: string;
  status: string;
  startTime: string;
  endTime: string | null;
  totalTokens: number | null;
  error: string | null;
}

export interface RunChild {
  id: string;
  name: string;
  runType: string;
  startTime: string;
  endTime: string | null;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  error: string | null;
  latencyMs: number | null;
}

export interface RunDetail extends RunSummary {
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  children: RunChild[];
}

export interface ReportStats {
  totalRuns: number;
  successRate: number;
  avgLatencyMs: number;
  totalTokens: number;
}
