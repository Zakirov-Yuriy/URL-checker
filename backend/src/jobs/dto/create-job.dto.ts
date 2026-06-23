import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class CreateJobDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Список URL не может быть пустым' })
  @IsString({ each: true })
  urls!: string[];
}
