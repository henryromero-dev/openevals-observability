import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Persona } from '../personas/persona.entity';
import { SimulationResult } from './simulation-result.entity';

export type SimulationStatus = 'pending' | 'running' | 'completed' | 'failed';

@Entity('simulations')
export class Simulation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'persona_id' })
  personaId: number;

  @ManyToOne(() => Persona, (p) => p.simulations, { eager: true })
  @JoinColumn({ name: 'persona_id' })
  persona: Persona;

  @Column({ name: 'evaluator_ids', type: 'json' })
  evaluatorIds: number[];

  @Column({ type: 'text', name: 'initial_message' })
  initialMessage: string;

  @Column({ name: 'max_turns', default: 10 })
  maxTurns: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending',
  })
  status: SimulationStatus;

  @Column({ type: 'varchar', length: 200, name: 'langsmith_run_id', nullable: true })
  langsmithRunId: string | null;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => SimulationResult, (r) => r.simulation)
  result: SimulationResult;
}
