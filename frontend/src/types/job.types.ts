export type JobStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type UrlStatus =
  | 'pending'
  | 'in_progress'
  | 'success'
  | 'error'
  | 'cancelled';

export interface UrlResult {
  url: string;
  status: UrlStatus;
  httpStatus?: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

export interface JobStats {
  pending: number;
  in_progress: number;
  success: number;
  error: number;
  cancelled: number;
}

export interface JobSummary {
  id: string;
  createdAt: string;
  status: JobStatus;
  total: number;
  processed: number;
  stats: JobStats;
}

export interface JobDetail extends JobSummary {
  urls: UrlResult[];
}
