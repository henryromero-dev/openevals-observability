import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';

@Controller('simulations')
export class SimulationsController {
  constructor(private readonly service: SimulationsService) {}

  /** GET /api/simulations — list all simulations with their results */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** GET /api/simulations/:id — get a single simulation with its result */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /**
   * POST /api/simulations — create and immediately kick off a simulation.
   * Returns the simulation record in "pending" status while it runs in background.
   */
  @Post()
  create(@Body() dto: CreateSimulationDto) {
    return this.service.create(dto);
  }

  /** DELETE /api/simulations/:id — delete a simulation and its result */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
