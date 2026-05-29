import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('evaluators')
export class Evaluator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 500, default: '' })
  description: string;

  @Column({ type: 'text', name: 'prompt_template' })
  promptTemplate: string;

  @Column({ length: 80, name: 'feedback_key' })
  feedbackKey: string;

  @Column({ length: 80, default: 'openai:gpt-4o-mini' })
  model: string;

  @Column({ length: 300, name: 'score_description', default: 'A score that is true if criteria in the prompt are met, and false otherwise.' })
  scoreDescription: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
