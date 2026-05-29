import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSimulationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsInt()
  personaId: number;

  @IsArray()
  @IsInt({ each: true })
  evaluatorIds: number[];

  @IsString()
  @IsNotEmpty()
  initialMessage: string;

  @IsInt()
  @IsOptional()
  @Min(2)
  @Max(20)
  maxTurns?: number;
}
