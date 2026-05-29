import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'langsmith';

@Injectable()
export class ReportsService {
  private readonly client: Client;
  private readonly projectName: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Client({
      apiKey: this.config.getOrThrow<string>('LANGSMITH_API_KEY'),
    });
    this.projectName = this.config.get<string>(
      'LANGSMITH_PROJECT',
      'observabilidad-dev',
    );
  }

  /**
   * Lists runs from the LangSmith project ordered by start time descending.
   */
  async listRuns(limit = 50) {
    const runs: unknown[] = [];
    // executionOrder: 1 returns only root-level runs (no parent) — excludes node spans
    const iterator = this.client.listRuns({
      projectName: this.projectName,
      executionOrder: 1,
      limit: Math.min(limit, 100),
    });

    for await (const run of iterator) {
      runs.push({
        id: run.id,
        name: run.name,
        status: run.status,
        startTime: run.start_time,
        endTime: run.end_time,
        totalTokens: run.total_tokens,
        promptTokens: run.prompt_tokens,
        completionTokens: run.completion_tokens,
        error: run.error,
      });
    }

    return runs;
  }

  /**
   * Returns the detail of a specific run including its child spans (graph nodes).
   */
  async getRunDetail(runId: string) {
    const run = await this.client.readRun(runId);
    const children: unknown[] = [];

    const childIterator = this.client.listRuns({
      projectName: this.projectName,
      parentRunId: runId,
    });

    for await (const child of childIterator) {
      children.push({
        id: child.id,
        name: child.name,
        runType: child.run_type,
        startTime: child.start_time,
        endTime: child.end_time,
        inputs: child.inputs,
        outputs: child.outputs,
        error: child.error,
        latencyMs:
          child.end_time && child.start_time
            ? new Date(child.end_time).getTime() -
              new Date(child.start_time).getTime()
            : null,
      });
    }

    return {
      id: run.id,
      name: run.name,
      status: run.status,
      startTime: run.start_time,
      endTime: run.end_time,
      inputs: run.inputs,
      outputs: run.outputs,
      totalTokens: run.total_tokens,
      error: run.error,
      children,
    };
  }

  /**
   * Returns all runs for a specific thread_id (one simulation's turns).
   * Each simulation turn produces one root run in LangSmith.
   */
  async getRunsByThreadId(threadId: string) {
    const runs: unknown[] = [];
    const iterator = this.client.listRuns({
      projectName: this.projectName,
      executionOrder: 1,
      filter: `and(eq(metadata_key, "thread_id"), eq(metadata_value, "${threadId}"))`,
    });

    for await (const run of iterator) {
      runs.push({
        id: run.id,
        name: run.name,
        status: run.status,
        startTime: run.start_time,
        endTime: run.end_time,
        totalTokens: run.total_tokens,
        error: run.error,
        latencyMs:
          run.end_time && run.start_time
            ? new Date(run.end_time).getTime() - new Date(run.start_time).getTime()
            : null,
      });
    }

    return runs;
  }

  /**
   * Lists LangSmith projects (experiments) for the configured project.
   */
  async listExperiments(limit = 20) {
    const experiments: unknown[] = [];

    try {
      // listProjects does not accept a limit param — collect and slice manually
      const iterator = this.client.listProjects({});
      let count = 0;
      for await (const project of iterator) {
        if (count >= limit) break;
        experiments.push({
          id: project.id,
          name: project.name,
        });
        count++;
      }
    } catch {
      // Return empty array when no experiments exist yet
    }

    return experiments;
  }

  /**
   * Returns aggregate stats for the project: total runs, success rate,
   * average latency, and total token usage.
   */
  async getSummaryStats() {
    const runs: Array<{
      totalTokens: number;
      latencyMs: number;
      status: string;
    }> = [];

    const iterator = this.client.listRuns({
      projectName: this.projectName,
      executionOrder: 1,
      limit: 100,
    });

    for await (const run of iterator) {
      const latencyMs =
        run.end_time && run.start_time
          ? new Date(run.end_time).getTime() -
            new Date(run.start_time).getTime()
          : 0;

      runs.push({
        totalTokens: run.total_tokens ?? 0,
        latencyMs,
        status: run.status ?? 'unknown',
      });
    }

    if (runs.length === 0) {
      return { totalRuns: 0, successRate: 0, avgLatencyMs: 0, totalTokens: 0 };
    }

    const successful = runs.filter((r) => r.status === 'success').length;
    const avgLatencyMs =
      runs.reduce((sum, r) => sum + r.latencyMs, 0) / runs.length;
    const totalTokens = runs.reduce((sum, r) => sum + r.totalTokens, 0);

    return {
      totalRuns: runs.length,
      successRate: Math.round((successful / runs.length) * 100),
      avgLatencyMs: Math.round(avgLatencyMs),
      totalTokens,
    };
  }
}
