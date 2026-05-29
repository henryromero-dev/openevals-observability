import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Evaluator } from './evaluator.entity';
import { CreateEvaluatorDto } from './dto/create-evaluator.dto';
import { UpdateEvaluatorDto } from './dto/update-evaluator.dto';

@Injectable()
export class EvaluatorsService {
  constructor(
    @InjectRepository(Evaluator)
    private readonly repo: Repository<Evaluator>,
  ) {}

  findAll(): Promise<Evaluator[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Evaluator> {
    const evaluator = await this.repo.findOne({ where: { id } });
    if (!evaluator) throw new NotFoundException(`Evaluator #${id} not found`);
    return evaluator;
  }

  findByIds(ids: number[]): Promise<Evaluator[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.repo.findBy({ id: In(ids) });
  }

  create(dto: CreateEvaluatorDto): Promise<Evaluator> {
    const evaluator = this.repo.create({
      name: dto.name,
      description: dto.description ?? '',
      promptTemplate: dto.promptTemplate,
      feedbackKey: dto.feedbackKey,
      model: dto.model ?? 'openai:gpt-4o-mini',
    });
    return this.repo.save(evaluator);
  }

  async update(id: number, dto: UpdateEvaluatorDto): Promise<Evaluator> {
    const evaluator = await this.findOne(id);
    if (dto.name !== undefined) evaluator.name = dto.name;
    if (dto.description !== undefined) evaluator.description = dto.description;
    if (dto.promptTemplate !== undefined) evaluator.promptTemplate = dto.promptTemplate;
    if (dto.feedbackKey !== undefined) evaluator.feedbackKey = dto.feedbackKey;
    if (dto.model !== undefined) evaluator.model = dto.model;
    return this.repo.save(evaluator);
  }

  async remove(id: number): Promise<void> {
    const evaluator = await this.findOne(id);
    await this.repo.remove(evaluator);
  }
}
