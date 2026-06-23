import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body() dto: CreateJobDto): { jobId: string } {
    const jobId = this.jobsService.createJob(dto.urls);
    return { jobId };
  }

  @Get()
  list() {
    return this.jobsService.listJobs();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    const job = this.jobsService.getJobDetail(id);
    if (!job) {
      throw new NotFoundException(`Задание ${id} не найдено`);
    }
    return job;
  }

  @Delete(':id')
  @HttpCode(200)
  cancel(@Param('id') id: string) {
    const job = this.jobsService.cancelJob(id);
    if (!job) {
      throw new NotFoundException(`Задание ${id} не найдено`);
    }
    return job;
  }
}
