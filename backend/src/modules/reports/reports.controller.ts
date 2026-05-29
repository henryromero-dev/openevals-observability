import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  /**
   * GET /api/reports/stats
   * Aggregate stats: total runs, success rate, avg latency, token usage
   */
  @Get('stats')
  getSummaryStats() {
    return this.service.getSummaryStats();
  }

  /**
   * GET /api/reports/runs?limit=50
   * List runs from the LangSmith project
   */
  @Get('runs')
  listRuns(@Query('limit') limit?: string) {
    return this.service.listRuns(limit ? parseInt(limit, 10) : 50);
  }

  /**
   * GET /api/reports/runs/:id
   * Run detail including child spans (graph nodes)
   */
  @Get('runs/:id')
  getRunDetail(@Param('id') id: string) {
    return this.service.getRunDetail(id);
  }

  /**
   * GET /api/reports/runs/by-thread/:threadId
   * Runs associated with a specific simulation thread
   */
  @Get('runs/by-thread/:threadId')
  getRunsByThread(@Param('threadId') threadId: string) {
    return this.service.getRunsByThreadId(threadId);
  }

  /**
   * GET /api/reports/experiments
   * List LangSmith experiments (evaluate() results)
   */
  @Get('experiments')
  listExperiments() {
    return this.service.listExperiments();
  }
}
