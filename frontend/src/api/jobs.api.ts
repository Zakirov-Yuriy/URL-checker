import type { JobDetail, JobSummary } from '../types/job.types';

// Слой работы с API. Все запросы к бэкенду проходят только здесь.
const BASE = '/api';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Ошибка запроса (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : String(body.message);
      }
    } catch {
      // Тело ответа не JSON, оставляем сообщение по умолчанию.
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function createJob(urls: string[]): Promise<{ jobId: string }> {
  const res = await fetch(`${BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });
  return handle<{ jobId: string }>(res);
}

export async function listJobs(): Promise<JobSummary[]> {
  return handle<JobSummary[]>(await fetch(`${BASE}/jobs`));
}

export async function getJob(id: string): Promise<JobDetail> {
  return handle<JobDetail>(await fetch(`${BASE}/jobs/${id}`));
}

export async function cancelJob(id: string): Promise<JobDetail> {
  return handle<JobDetail>(await fetch(`${BASE}/jobs/${id}`, { method: 'DELETE' }));
}
