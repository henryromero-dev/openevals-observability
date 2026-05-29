import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from './persona.entity';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonasService {
  constructor(
    @InjectRepository(Persona)
    private readonly repo: Repository<Persona>,
  ) {}

  findAll(): Promise<Persona[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Persona> {
    const persona = await this.repo.findOne({ where: { id } });
    if (!persona) throw new NotFoundException(`Persona #${id} not found`);
    return persona;
  }

  create(dto: CreatePersonaDto): Promise<Persona> {
    const persona = this.repo.create({
      name: dto.name,
      description: dto.description ?? '',
      systemPrompt: dto.systemPrompt,
    });
    return this.repo.save(persona);
  }

  async update(id: number, dto: UpdatePersonaDto): Promise<Persona> {
    const persona = await this.findOne(id);
    if (dto.name !== undefined) persona.name = dto.name;
    if (dto.description !== undefined) persona.description = dto.description;
    if (dto.systemPrompt !== undefined) persona.systemPrompt = dto.systemPrompt;
    return this.repo.save(persona);
  }

  async remove(id: number): Promise<void> {
    const persona = await this.findOne(id);
    await this.repo.remove(persona);
  }
}
