import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Simulation } from './simulation.entity';

export interface TrajectoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EvaluatorScore {
  feedbackKey: string;
  score: boolean | number | null;
  reasoning?: string;
}

@Entity('simulation_results')
export class SimulationResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'simulation_id' })
  simulationId: number;

  @OneToOne(() => Simulation, (s) => s.result)
  @JoinColumn({ name: 'simulation_id' })
  simulation: Simulation;

  @Column({ name: 'turn_count', default: 0 })
  turnCount: number;

  @Column({ type: 'json' })
  trajectory: TrajectoryMessage[];

  @Column({ type: 'json' })
  scores: EvaluatorScore[];

  @Column({ type: 'varchar', length: 500, name: 'langsmith_experiment_url', nullable: true })
  langsmithExperimentUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
