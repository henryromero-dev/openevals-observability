import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import type { Evaluator, CreateEvaluatorPayload } from '../../core/models/api.models';

type FormMode = 'create' | 'edit';

interface EvaluatorForm {
  name: string;
  description: string;
  promptTemplate: string;
  feedbackKey: string;
  model: string;
  scoreDescription: string;
}

const EMPTY_FORM: EvaluatorForm = {
  name: '',
  description: '',
  promptTemplate: '',
  feedbackKey: '',
  model: 'openai:gpt-4o-mini',
  scoreDescription: 'TRUE if criteria in the prompt are met. FALSE otherwise.',
};

// Angular template cannot contain literal {{ }} — use these constants instead
const OPEN = '{{';
const CLOSE = '}}';

@Component({
  selector: 'app-evaluators',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe],
  templateUrl: './evaluators.component.html',
  styleUrl: './evaluators.component.scss',
})
export class EvaluatorsComponent implements OnInit {
  private readonly api = inject(ApiService);

  // Prompt template helper strings — contain {{ }} which cannot appear raw in Angular templates
  readonly promptPlaceholder =
    `You are an expert evaluator. Assess the following conversation.\n\n<example>\n  <input>${OPEN}inputs${CLOSE}</input>\n  <output>${OPEN}outputs${CLOSE}</output>\n</example>`;
  readonly promptHint =
    `Use ${OPEN}inputs${CLOSE} and ${OPEN}outputs${CLOSE} as placeholders for the conversation.`;

  readonly evaluators = signal<Evaluator[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly showForm = signal(false);
  readonly formMode = signal<FormMode>('create');
  readonly editingId = signal<number | null>(null);
  readonly form = signal<EvaluatorForm>({ ...EMPTY_FORM });

  ngOnInit(): void {
    this.loadEvaluators();
  }

  private loadEvaluators(): void {
    this.loading.set(true);
    this.api.getEvaluators().subscribe({
      next: (data) => { this.evaluators.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load evaluators'); this.loading.set(false); },
    });
  }

  openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.form.set({ ...EMPTY_FORM });
    this.showForm.set(true);
  }

  openEdit(ev: Evaluator): void {
    this.formMode.set('edit');
    this.editingId.set(ev.id);
    this.form.set({
      name: ev.name,
      description: ev.description,
      promptTemplate: ev.promptTemplate,
      feedbackKey: ev.feedbackKey,
      model: ev.model,
      scoreDescription: ev.scoreDescription,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.error.set(null);
  }

  onSave(): void {
    const f = this.form();
    if (!f.name.trim() || !f.promptTemplate.trim() || !f.feedbackKey.trim()) return;

    this.saving.set(true);
    const payload: CreateEvaluatorPayload = {
      name: f.name.trim(),
      description: f.description.trim(),
      promptTemplate: f.promptTemplate.trim(),
      feedbackKey: f.feedbackKey.trim(),
      model: f.model.trim() || 'openai:gpt-4o-mini',
      scoreDescription: f.scoreDescription.trim(),
    };

    const req$ = this.formMode() === 'create'
      ? this.api.createEvaluator(payload)
      : this.api.updateEvaluator(this.editingId()!, payload);

    req$.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.loadEvaluators(); },
      error: () => { this.error.set('Failed to save evaluator'); this.saving.set(false); },
    });
  }

  onDelete(id: number): void {
    if (!confirm('Delete this evaluator?')) return;
    this.api.deleteEvaluator(id).subscribe({
      next: () => this.loadEvaluators(),
      error: () => this.error.set('Failed to delete evaluator'),
    });
  }

  updateField(field: keyof EvaluatorForm, value: string | boolean): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }
}
