import { useJobsStore } from '../store/jobs.store';
import type { JobStatus } from '../types/job.types';

const STATUS_LABEL: Record<JobStatus, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  completed: 'Готово',
  cancelled: 'Отменено',
  failed: 'Ошибка',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function JobList() {
  const jobs = useJobsStore((s) => s.jobs);
  const activeJobId = useJobsStore((s) => s.activeJobId);
  const loadingJobs = useJobsStore((s) => s.loadingJobs);
  const selectJob = useJobsStore((s) => s.selectJob);

  return (
    <section className="card">
      <h2 className="card__title">Задания</h2>
      {loadingJobs && jobs.length === 0 ? (
        <p className="muted">Загрузка…</p>
      ) : jobs.length === 0 ? (
        <p className="muted">Пока нет заданий</p>
      ) : (
        <ul className="job-list">
          {jobs.map((job) => (
            <li
              key={job.id}
              className={'job-item' + (job.id === activeJobId ? ' job-item--active' : '')}
              onClick={() => selectJob(job.id)}
            >
              <div className="job-item__row">
                <span className={`badge badge--${job.status}`}>
                  {STATUS_LABEL[job.status]}
                </span>
                <span className="muted">{formatDate(job.createdAt)}</span>
              </div>
              <div className="job-item__id">{job.id}</div>
              <div className="job-item__stats">
                <span className="muted">Всего: {job.total}</span>
                <span className="ok">✓ {job.stats.success}</span>
                <span className="err">✗ {job.stats.error}</span>
                <span className="muted">{job.processed}/{job.total}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
