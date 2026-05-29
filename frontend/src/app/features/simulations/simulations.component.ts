import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import type {
  Simulation,
  Persona,
  Evaluator,
  CreateSimulationPayload,
} from '../../core/models/api.models';

interface SimForm {
  name: string;
  personaId: number | null;
  evaluatorIds: number[];
  initialMessage: string;
  maxTurns: number;
}

const EMPTY_FORM: SimForm = {
  name: '',
  personaId: null,
  evaluatorIds: [],
  initialMessage: '',
  maxTurns: 10,
};

@Component({
  selector: 'app-simulations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe],
  templateUrl: './simulations.component.html',
  styleUrl: './simulations.component.scss',
})
export class SimulationsComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  readonly simulations = signal<Simulation[]>([]);
  readonly personas = signal<Persona[]>([]);
  readonly evaluators = signal<Evaluator[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly showForm = signal(false);
  readonly form = signal<SimForm>({ ...EMPTY_FORM });
  readonly selectedSimulation = signal<Simulation | null>(null);

  readonly canSubmit = computed(() => {
    const f = this.form();
    return !!f.name.trim() && !!f.personaId && !!f.initialMessage.trim() && !this.saving();
  });

  ngOnInit(): void {
    this.loadAll();
    // Poll every 3 s while any simulation is running or pending
    this.pollTimer = setInterval(() => {
      const hasActive = this.simulations().some(
        (s) => s.status === 'running' || s.status === 'pending',
      );
      if (hasActive) this.pollActive();
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  private pollActive(): void {
    this.simulations()
      .filter((s) => s.status === 'running' || s.status === 'pending')
      .forEach((s) => this.refreshSimulation(s.id));
  }

  private loadAll(): void {
    this.loading.set(true);
    this.api.getPersonas().subscribe((p) => this.personas.set(p));
    this.api.getEvaluators().subscribe((e) => this.evaluators.set(e));
    this.api.getSimulations().subscribe({
      next: (data) => { this.simulations.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load simulations'); this.loading.set(false); },
    });
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.error.set(null);
  }

  toggleEvaluator(id: number): void {
    this.form.update((f) => {
      const ids = f.evaluatorIds.includes(id)
        ? f.evaluatorIds.filter((i) => i !== id)
        : [...f.evaluatorIds, id];
      return { ...f, evaluatorIds: ids };
    });
  }

  isEvaluatorSelected(id: number): boolean {
    return this.form().evaluatorIds.includes(id);
  }

  onSave(): void {
    const f = this.form();
    if (!this.canSubmit()) return;

    this.saving.set(true);
    const payload: CreateSimulationPayload = {
      name: f.name.trim(),
      personaId: f.personaId!,
      evaluatorIds: f.evaluatorIds,
      initialMessage: f.initialMessage.trim(),
      maxTurns: f.maxTurns,
    };

    this.api.createSimulation(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadAll();
      },
      error: () => { this.error.set('Failed to start simulation'); this.saving.set(false); },
    });
  }

  viewDetail(sim: Simulation): void {
    // Reload to get latest status
    this.api.getSimulation(sim.id).subscribe((updated) => {
      this.selectedSimulation.set(updated);
    });
  }

  closeDetail(): void {
    this.selectedSimulation.set(null);
  }

  rerun(sim: Simulation): void {
    const payload: CreateSimulationPayload = {
      name: `${sim.name} (re-run)`,
      personaId: sim.personaId,
      evaluatorIds: sim.evaluatorIds,
      initialMessage: sim.initialMessage,
      maxTurns: sim.maxTurns,
    };
    this.api.createSimulation(payload).subscribe({
      next: () => this.loadAll(),
      error: () => this.error.set('Failed to re-run simulation'),
    });
  }

  onDelete(id: number): void {
    if (!confirm('Delete this simulation?')) return;
    this.api.deleteSimulation(id).subscribe({
      next: () => this.loadAll(),
      error: () => this.error.set('Failed to delete simulation'),
    });
  }

  refreshSimulation(id: number): void {
    this.api.getSimulation(id).subscribe((updated) => {
      this.simulations.update((sims) =>
        sims.map((s) => (s.id === id ? updated : s)),
      );
      if (this.selectedSimulation()?.id === id) {
        this.selectedSimulation.set(updated);
      }
    });
  }

  updateField(field: keyof SimForm, value: string | number): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }
}
