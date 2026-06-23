import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UrlCheckerService } from './url-checker.service';
import {
  Job,
  JobDetail,
  JobStats,
  JobStatus,
  JobSummary,
  UrlResult,
} from './types/job.types';

const CONCURRENCY = 5; // не более 5 одновременных HEAD-запросов на задание
const MAX_DELAY_MS = 10_000; // искусственная задержка 0..10 секунд
const TERMINAL_STATUSES: JobStatus[] = ['completed', 'cancelled', 'failed'];

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly jobs = new Map<string, Job>();

  constructor(private readonly urlChecker: UrlCheckerService) {}

  createJob(rawUrls: string[]): string {
    const urls = rawUrls.map((u) => u.trim()).filter((u) => u.length > 0);
    const id = randomUUID();
    const job: Job = {
      id,
      createdAt: new Date().toISOString(),
      status: 'pending',
      cancelled: false,
      urls: urls.map((url) => ({ url, status: 'pending' })),
    };
    this.jobs.set(id, job);

    // Обработка запускается в фоне, ответ клиенту не ждёт её завершения.
    void this.processJob(job).catch((err) => {
      this.logger.error(`Задание ${id} завершилось с ошибкой: ${err?.message ?? err}`);
      job.status = 'failed';
    });

    return id;
  }

  listJobs(): JobSummary[] {
    return [...this.jobs.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((job) => this.toSummary(job));
  }

  getJobDetail(id: string): JobDetail | null {
    const job = this.jobs.get(id);
    if (!job) return null;
    return { ...this.toSummary(job), urls: job.urls };
  }

  cancelJob(id: string): JobDetail | null {
    const job = this.jobs.get(id);
    if (!job) return null;

    if (!TERMINAL_STATUSES.includes(job.status)) {
      job.cancelled = true;
      job.status = 'cancelled';
      // Помечаем как cancelled все ещё не начатые URL.
      for (const item of job.urls) {
        if (item.status === 'pending') {
          item.status = 'cancelled';
        }
      }
    }
    return this.getJobDetail(id);
  }

  /**
   * Пул воркеров: не более CONCURRENCY URL обрабатываются одновременно.
   */
  private async processJob(job: Job): Promise<void> {
    if (job.cancelled) return;
    job.status = 'in_progress';

    let cursor = 0;
    const worker = async (): Promise<void> => {
      for (;;) {
        if (job.cancelled) return;
        const index = cursor++;
        if (index >= job.urls.length) return;
        await this.processUrl(job, job.urls[index]);
      }
    };

    const workerCount = Math.min(CONCURRENCY, job.urls.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    if (!job.cancelled) {
      job.status = 'completed';
    }
  }

  private async processUrl(job: Job, item: UrlResult): Promise<void> {
    if (job.cancelled) {
      item.status = 'cancelled';
      return;
    }

    item.status = 'in_progress';
    item.startedAt = new Date().toISOString();
    const startedMs = Date.now();

    // Искусственная задержка перед сохранением результата.
    await sleep(Math.floor(Math.random() * MAX_DELAY_MS));

    if (job.cancelled) {
      item.status = 'cancelled';
      item.finishedAt = new Date().toISOString();
      item.durationMs = Date.now() - startedMs;
      return;
    }

    const result = await this.urlChecker.check(item.url);
    item.httpStatus = result.httpStatus;
    if (result.ok) {
      item.status = 'success';
    } else {
      item.status = 'error';
      item.error = result.error;
    }
    item.finishedAt = new Date().toISOString();
    item.durationMs = Date.now() - startedMs;
  }

  private toSummary(job: Job): JobSummary {
    const stats: JobStats = {
      pending: 0,
      in_progress: 0,
      success: 0,
      error: 0,
      cancelled: 0,
    };
    for (const item of job.urls) {
      stats[item.status] += 1;
    }
    const processed = stats.success + stats.error + stats.cancelled;
    return {
      id: job.id,
      createdAt: job.createdAt,
      status: job.status,
      total: job.urls.length,
      processed,
      stats,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
