import { useJobsStore } from '../store/jobs.store';
import type { JobStatus, UrlStatus } from '../types/job.types';

const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  completed: 'Готово',
  cancelled: 'Отменено',
  failed: 'Ошибка',
};

const URL_STATUS_LABEL: Record<UrlStatus, string> = {
  pending: 'Ожидает',
  in_progress: 'Проверяется',
  success: 'OK',
  error: 'Ошибка',
  cancelled: 'Отменён',
};

const TERMINAL: JobStatus[] = ['completed', 'cancelled', 'failed'];

function formatDuration(ms?: number): string {
  if (ms === undefined) return '—';
  return `${(ms / 1000).toFixed(1)} с`;
}

export function JobDetail() {
  const activeJob = useJobsStore((s) => s.activeJob);
  const loadingDetail = useJobsStore((s) => s.loadingDetail);
  const cancelActiveJob = useJobsStore((s) => s.cancelActiveJob);

  if (!activeJob && loadingDetail) {
    return (
      <section className="card">
        <p className="muted">Загрузка задания…</p>
      </section>
    );
  }

  if (!activeJob) {
    return (
      <section className="card">
        <p className="muted">Выберите задание из списка или создайте новое</p>
      </section>
    );
  }

  const canCancel = !TERMINAL.includes(activeJob.status);
  const percent = activeJob.total
    ? Math.round((activeJob.processed / activeJob.total) * 100)
    : 0;

  return (
    <section className="card">
      <div className="detail-header">
        <div>
          <h2 className="card__title">Активное задание</h2>
          <div className="muted detail-id">{activeJob.id}</div>
        </div>
        <span className={`badge badge--${activeJob.status}`}>
          {JOB_STATUS_LABEL[activeJob.status]}
        </span>
      </div>

      <div className="progress">
        <div className="progress__bar">
          <div className="progress__fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="muted">
          Обработано {activeJob.processed} из {activeJob.total}
        </span>
      </div>

      {canCancel && (
        <button className="btn btn--danger" onClick={() => void cancelActiveJob()}>
          Отменить задание
        </button>
      )}

      <div className="table-wrap">
        <table className="url-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Статус</th>
              <th>HTTP</th>
              <th>Время</th>
              <th>Сообщение</th>
            </tr>
          </thead>
          <tbody>
            {activeJob.urls.map((u, i) => (
              <tr key={`${u.url}-${i}`}>
                <td className="url-cell" title={u.url}>{u.url}</td>
                <td>
                  <span className={`badge badge--url-${u.status}`}>
                    {URL_STATUS_LABEL[u.status]}
                  </span>
                </td>
                <td>{u.httpStatus ?? '—'}</td>
                <td>{formatDuration(u.durationMs)}</td>
                <td className="error-cell">{u.error ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
