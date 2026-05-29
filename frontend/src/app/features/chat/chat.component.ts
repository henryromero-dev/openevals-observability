import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import type { ChatResponse } from '../../core/models/api.models';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  escalate?: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  @ViewChild('messagesEnd') private messagesEnd?: ElementRef<HTMLDivElement>;

  private readonly api = inject(ApiService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly inputValue = signal('');
  readonly isSending = signal(false);
  readonly threadId = signal<string | undefined>(undefined);
  readonly error = signal<string | null>(null);

  readonly lastIntent = computed(() => {
    const msgs = this.messages();
    const last = [...msgs].reverse().find((m) => m.role === 'assistant');
    return last?.intent ?? null;
  });

  readonly isEscalated = computed(() =>
    this.messages().some((m) => m.escalate === true),
  );

  onSubmit(event: Event): void {
    event.preventDefault();
    const text = this.inputValue().trim();
    if (!text || this.isSending()) return;

    this.messages.update((msgs) => [...msgs, { role: 'user', content: text }]);
    this.inputValue.set('');
    this.isSending.set(true);
    this.error.set(null);

    this.api.chat(text, this.threadId()).subscribe({
      next: (res: ChatResponse) => {
        this.threadId.set(res.threadId);
        this.messages.update((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: res.message,
            intent: res.intent,
            escalate: res.escalate,
          },
        ]);
        this.isSending.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.error.set('Failed to reach the server. Is the backend running?');
        this.isSending.set(false);
      },
    });
  }

  onReset(): void {
    this.messages.set([]);
    this.threadId.set(undefined);
    this.error.set(null);
    this.inputValue.set('');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
}
