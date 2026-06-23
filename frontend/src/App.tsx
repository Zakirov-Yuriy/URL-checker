import { useEffect } from 'react';
import { CreateJobForm } from './components/CreateJobForm';
import { JobList } from './components/JobList';
import { JobDetail } from './components/JobDetail';
import { useJobsStore } from './store/jobs.store';

export function App() {
  const fetchJobs = useJobsStore((s) => s.fetchJobs);
  const error = useJobsStore((s) => s.error);
  const clearError = useJobsStore((s) => s.clearError);

  useEffect(() => {
    void fetchJobs();
    // Лёгкий фоновый опрос списка для актуальной статистики.
    const timer = setInterval(() => void fetchJobs(true), 3000);
    return () => clearInterval(timer);
  }, [fetchJobs]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Асинхронная проверка URL</h1>
        <p className="muted">NestJS + React + Zustand</p>
      </header>

      {error && (
        <div className="alert" onClick={clearError}>
          <span>{error}</span>
          <span className="alert__close">×</span>
        </div>
      )}

      <main className="layout">
        <div className="column">
          <CreateJobForm />
          <JobList />
        </div>
        <div className="column">
          <JobDetail />
        </div>
      </main>
    </div>
  );
}
