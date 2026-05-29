import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe, JsonPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import type { ReportStats, Simulation, RunSummary, RunDetail, EvaluatorScore } from '../../core/models/api.models';

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, JsonPipe],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly stats = signal<ReportStats | null>(null);
  readonly simulations = signal<Simulation[]>([]);
  readonly loadingStats = signal(true);
  readonly loadingSimulations = signal(true);
  readonly error = signal<string | null>(null);

  readonly expandedIds = signal<Set<number>>(new Set());
  readonly traceRuns = signal<Map<number, RunSummary[]>>(new Map());
  readonly loadingTraces = signal<Set<number>>(new Set());
  readonly selectedRun = signal<RunDetail | null>(null);
  readonly loadingDetail = signal(false);

  ngOnInit(): void {
    this.loadStats();
    this.loadSimulations();
  }

  private loadStats(): void {
    this.api.getReportStats().subscribe({
      next: (s) => { this.stats.set(s); this.loadingStats.set(false); },
      error: () => { this.loadingStats.set(false); },
    });
  }

  private loadSimulations(): void {
    this.api.getSimulations().subscribe({
      next: (s) => { this.simulations.set(s); this.loadingSimulations.set(false); },
      error: () => { this.error.set('Failed to load simulations'); this.loadingSimulations.set(false); },
    });
  }

  toggle(sim: Simulation): void {
    this.expandedIds.update((s) => {
      const next = new Set(s);
      if (next.has(sim.id)) {
        next.delete(sim.id);
      } else {
        next.add(sim.id);
        if (sim.langsmithRunId && !this.traceRuns().has(sim.id)) {
          this.loadTraces(sim.id, sim.langsmithRunId);
        }
      }
      return next;
    });
  }

  private loadTraces(simId: number, threadId: string): void {
    this.loadingTraces.update((s) => new Set(s).add(simId));
    this.api.getRunsByThread(threadId).subscribe({
      next: (runs) => {
        this.traceRuns.update((m) => { const n = new Map(m); n.set(simId, runs); return n; });
        this.loadingTraces.update((s) => { const n = new Set(s); n.delete(simId); return n; });
      },
      error: () => {
        this.loadingTraces.update((s) => { const n = new Set(s); n.delete(simId); return n; });
      },
    });
  }

  isExpanded(id: number): boolean { return this.expandedIds().has(id); }
  isLoadingTraces(id: number): boolean { return this.loadingTraces().has(id); }
  getTraces(id: number): RunSummary[] { return this.traceRuns().get(id) ?? []; }

  getLatencyMs(run: RunSummary): number | null {
    if (!run.startTime || !run.endTime) return null;
    return new Date(run.endTime).getTime() - new Date(run.startTime).getTime();
  }

  scoreLabel(s: EvaluatorScore): string {
    if (s.score === null) return '—';
    if (typeof s.score === 'boolean') return s.score ? '✓ Pass' : '✗ Fail';
    return String(s.score);
  }

  scoreClass(s: EvaluatorScore): string {
    if (s.score === null) return '';
    if (typeof s.score === 'boolean') return s.score ? 'score--pass' : 'score--fail';
    return s.score >= 0.5 ? 'score--pass' : 'score--fail';
  }

  openRun(run: RunSummary): void {
    this.loadingDetail.set(true);
    this.api.getRunDetail(run.id).subscribe({
      next: (d) => { this.selectedRun.set(d); this.loadingDetail.set(false); },
      error: () => { this.error.set('Failed to load trace'); this.loadingDetail.set(false); },
    });
  }

  closeDetail(): void { this.selectedRun.set(null); }
}
