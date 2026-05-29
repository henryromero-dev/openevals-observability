import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Simulation } from './simulation.entity';
import { SimulationResult } from './simulation-result.entity';
import type { TrajectoryMessage, EvaluatorScore } from './simulation-result.entity';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { PersonasService } from '../personas/personas.service';
import { EvaluatorsService } from '../evaluators/evaluators.service';
import { GraphService } from '../graph/graph.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createLLMAsJudge } = require('openevals');

const SIMULATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes hard limit

@Injectable()
export class SimulationsService implements OnModuleInit {
  private readonly logger = new Logger(SimulationsService.name);

  constructor(
    @InjectRepository(Simulation)
    private readonly simulationRepo: Repository<Simulation>,

    @InjectRepository(SimulationResult)
    private readonly resultRepo: Repository<SimulationResult>,

    private readonly personasService: PersonasService,
    private readonly evaluatorsService: EvaluatorsService,
    private readonly graphService: GraphService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Mark any simulations left in running/pending state as failed.
    // These were interrupted by a server restart and will never complete on their own.
    const stale = await this.simulationRepo.find({
      where: { status: In(['running', 'pending']) },
    });

    if (stale.length === 0) return;

    await this.simulationRepo.update(
      { status: In(['running', 'pending']) },
      {
        status: 'failed',
        errorMessage: 'Interrupted by server restart',
      },
    );

    this.logger.warn(
      `Marked ${stale.length} stale simulation(s) as failed (server restart).`,
    );
  }

  findAll(): Promise<Simulation[]> {
    return this.simulationRepo.find({
      order: { createdAt: 'DESC' },
      relations: { persona: true, result: true },
    });
  }

  async findOne(id: number): Promise<Simulation> {
    const sim = await this.simulationRepo.findOne({
      where: { id },
      relations: { persona: true, result: true },
    });
    if (!sim) throw new NotFoundException(`Simulation #${id} not found`);
    return sim;
  }

  async create(dto: CreateSimulationDto): Promise<Simulation> {
    await this.personasService.findOne(dto.personaId);
    if (dto.evaluatorIds.length > 0) {
      await this.evaluatorsService.findByIds(dto.evaluatorIds);
    }

    const simulation = this.simulationRepo.create({
      name: dto.name,
      personaId: dto.personaId,
      evaluatorIds: dto.evaluatorIds,
      initialMessage: dto.initialMessage,
      maxTurns: dto.maxTurns ?? 10,
      status: 'pending',
    });

    const saved = await this.simulationRepo.save(simulation);

    // Fire and forget — do not block the HTTP response
    this.runSimulation(saved.id).catch((err: unknown) => {
      console.error(`[Simulation #${saved.id}] Unhandled error:`, err);
    });

    return saved;
  }

  private async runSimulation(simulationId: number): Promise<void> {
    const simulation = await this.findOne(simulationId);
    await this.simulationRepo.update(simulationId, { status: 'running' });

    // Create the result row immediately so the frontend can read partial data
    const resultRow = this.resultRepo.create({
      simulationId,
      turnCount: 0,
      trajectory: [],
      scores: [],
      langsmithExperimentUrl: null,
    });
    const savedResult = await this.resultRepo.save(resultRow);

    const threadId = `sim-${simulationId}-${Date.now()}`;

    // Persist threadId so Reports can query LangSmith runs for this simulation
    await this.simulationRepo.update(simulationId, { langsmithRunId: threadId });

    // Abort controller for the hard timeout
    let timedOut = false;
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
    }, SIMULATION_TIMEOUT_MS);

    try {
      const persona = await this.personasService.findOne(simulation.personaId);
      const evaluators = await this.evaluatorsService.findByIds(simulation.evaluatorIds);

      // Custom simulated user — avoids openevals role-swap ambiguity
      const openai = new ChatOpenAI({
        model: 'gpt-4o-mini',
        apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
        temperature: 0.8,
        maxRetries: 2,
      });

      const simulateNextUserMessage = async (
        turn: number,
        currentTrajectory: TrajectoryMessage[],
      ): Promise<string> => {
        // Turn 0 always uses the fixed initial message
        if (turn === 0) return simulation.initialMessage;

        // Build chat history: from the simulated user's POV,
        // their own previous messages are AIMessage, agent responses are HumanMessage
        const history = currentTrajectory.map((m) =>
          m.role === 'user'
            ? new AIMessage(m.content)   // what "you" (simulated user) said before
            : new HumanMessage(m.content), // what the agent said
        );

        const response = await openai.invoke([
          new SystemMessage(
            `${persona.systemPrompt}\n\n` +
            `You are in an ongoing conversation with a customer support agent. ` +
            `Based on the conversation so far and your persona, write ONLY your next message. ` +
            `Be concise. Do NOT include any preamble or explanation — just your message text.`,
          ),
          ...history,
        ]);

        return (response.content as string).trim();
      };

      const trajectoryEvaluators = evaluators.map((ev) =>
        createLLMAsJudge({
          model: ev.model,
          prompt: ev.promptTemplate,
          feedbackKey: ev.feedbackKey,
          outputSchema: {
            type: 'object',
            additionalProperties: false,
            required: ['reasoning', 'score'],
            properties: {
              reasoning: {
                type: 'string',
                description: 'A human-readable explanation of the score. You MUST end the reasoning with a sentence that says: Thus, the score should be: SCORE_YOU_ASSIGN.',
              },
              score: {
                type: 'boolean',
                description: ev.scoreDescription,
              },
            },
          },
        }),
      );

      const trajectory: TrajectoryMessage[] = [];

      this.logger.log(`[#${simulationId}] Starting — maxTurns: ${simulation.maxTurns}`);

      // ── Manual turn loop ────────────────────────────────────────────────────
      for (let turn = 0; turn < simulation.maxTurns; turn++) {
        if (timedOut) {
          throw new Error(`Simulation timed out after ${SIMULATION_TIMEOUT_MS / 1000}s`);
        }

        // 1. Generate the simulated user's next message
        const userContent = await simulateNextUserMessage(turn, trajectory);
        if (!userContent) break;

        trajectory.push({ role: 'user', content: userContent });
        this.logger.log(`[#${simulationId}] T${turn + 1} user: "${userContent.substring(0, 80)}"`);

        // 2. Call the LangGraph agent
        const assistantMsg = await this.graphService.chatForSimulation(
          { role: 'user', content: userContent },
          threadId,
        );
        trajectory.push({ role: 'assistant', content: assistantMsg.content });
        this.logger.log(`[#${simulationId}] T${turn + 1} agent: "${assistantMsg.content.substring(0, 80)}"`);

        // 3. Persist partial trajectory — frontend sees live progress every turn
        await this.resultRepo.update(savedResult.id, {
          turnCount: turn + 1,
          trajectory: [...trajectory],
        });
      }

      // ── Run evaluators on the completed trajectory ──────────────────────────
      const scores: EvaluatorScore[] = [];

      const userMessages = trajectory
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join('\n---\n');

      const formattedConversation = trajectory
        .map((m) => `[${m.role === 'user' ? 'User' : 'Agent'}]: ${m.content}`)
        .join('\n\n');

      for (const [i, evaluator] of trajectoryEvaluators.entries()) {
        try {
          const evalResult = await evaluator({
            inputs: userMessages,
            outputs: formattedConversation,
          });
          scores.push({
            feedbackKey: evaluators[i]?.feedbackKey ?? `evaluator_${i}`,
            score: evalResult.score ?? null,
            reasoning: evalResult.reasoning as string | undefined,
          });
        } catch (evalErr) {
          console.error(`[Simulation #${simulationId}] Evaluator ${i} failed:`, evalErr);
          scores.push({
            feedbackKey: evaluators[i]?.feedbackKey ?? `evaluator_${i}`,
            score: null,
            reasoning: 'Evaluator error',
          });
        }
      }

      // ── Final save ──────────────────────────────────────────────────────────
      await this.resultRepo.update(savedResult.id, {
        turnCount: trajectory.length / 2,
        trajectory,
        scores,
      });

      await this.simulationRepo.update(simulationId, { status: 'completed' });
      console.log(`[Simulation #${simulationId}] Completed — ${trajectory.length} messages.`);

    } catch (error) {
      await this.simulationRepo.update(simulationId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      console.error(`[Simulation #${simulationId}] Failed:`, error);
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  async remove(id: number): Promise<void> {
    const sim = await this.findOne(id);
    await this.simulationRepo.remove(sim);
  }
}
