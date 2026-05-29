import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Simulation } from './simulation.entity';
import { SimulationResult } from './simulation-result.entity';
import { SimulationsController } from './simulations.controller';
import { SimulationsService } from './simulations.service';
import { PersonasModule } from '../personas/personas.module';
import { EvaluatorsModule } from '../evaluators/evaluators.module';
import { GraphModule } from '../graph/graph.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Simulation, SimulationResult]),
    PersonasModule,
    EvaluatorsModule,
    GraphModule,
  ],
  controllers: [SimulationsController],
  providers: [SimulationsService],
})
export class SimulationsModule {}
