import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEvaluatorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty()
  promptTemplate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  feedbackKey: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  model?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  scoreDescription?: string;
}
