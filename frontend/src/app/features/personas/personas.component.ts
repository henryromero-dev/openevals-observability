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
import type { Persona, CreatePersonaPayload } from '../../core/models/api.models';

type FormMode = 'create' | 'edit';

interface PersonaForm {
  name: string;
  description: string;
  systemPrompt: string;
}

const EMPTY_FORM: PersonaForm = { name: '', description: '', systemPrompt: '' };

@Component({
  selector: 'app-personas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe],
  templateUrl: './personas.component.html',
  styleUrl: './personas.component.scss',
})
export class PersonasComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly personas = signal<Persona[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly showForm = signal(false);
  readonly formMode = signal<FormMode>('create');
  readonly editingId = signal<number | null>(null);
  readonly form = signal<PersonaForm>({ ...EMPTY_FORM });

  ngOnInit(): void {
    this.loadPersonas();
  }

  private loadPersonas(): void {
    this.loading.set(true);
    this.api.getPersonas().subscribe({
      next: (data) => { this.personas.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load personas'); this.loading.set(false); },
    });
  }

  openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.form.set({ ...EMPTY_FORM });
    this.showForm.set(true);
  }

  openEdit(persona: Persona): void {
    this.formMode.set('edit');
    this.editingId.set(persona.id);
    this.form.set({
      name: persona.name,
      description: persona.description,
      systemPrompt: persona.systemPrompt,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.error.set(null);
  }

  onSave(): void {
    const f = this.form();
    if (!f.name.trim() || !f.systemPrompt.trim()) return;

    this.saving.set(true);
    const payload: CreatePersonaPayload = {
      name: f.name.trim(),
      description: f.description.trim(),
      systemPrompt: f.systemPrompt.trim(),
    };

    const req$ = this.formMode() === 'create'
      ? this.api.createPersona(payload)
      : this.api.updatePersona(this.editingId()!, payload);

    req$.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.loadPersonas(); },
      error: () => { this.error.set('Failed to save persona'); this.saving.set(false); },
    });
  }

  onDelete(id: number): void {
    if (!confirm('Delete this persona?')) return;
    this.api.deletePersona(id).subscribe({
      next: () => this.loadPersonas(),
      error: () => this.error.set('Failed to delete persona'),
    });
  }

  updateField(field: keyof PersonaForm, value: string): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }
}
