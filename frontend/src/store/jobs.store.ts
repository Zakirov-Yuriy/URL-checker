import { create } from 'zustand';
import * as api from '../api/jobs.api';
import type { JobDetail, JobStatus, JobSummary } from '../types/job.types';

const POLL_INTERVAL_MS = 1500;
const TERMINAL: JobStatus[] = ['completed', 'cancelled', 'failed'];

function isTerminal(status: JobStatus): boolean {
  return TERMINAL.includes(status);
}

// Таймер опроса активного задания хранится вне реактивного состояния.
let detailTimer: ReturnType<typeof setInterval> | null = null;

interface JobsState {
  jobs: JobSummary[];
  activeJobId: string | null;
  activeJob: JobDetail | null;
  loadingJobs: boolean;
  loadingDetail: boolean;
  creating: boolean;
  error: string | null;

  fetchJobs: (silent?: boolean) => Promise<void>;
  createJob: (urls: string[]) => Promise<void>;
  selectJob: (id: string) => void;
  cancelActiveJob: () => Promise<void>;
  stopDetailPolling: () => void;
  clearError: () => void;
}

export const useJobsStore = create<JobsState>((set, get) => {
  const stopDetailPolling = (): void => {
    if (detailTimer) {
      clearInterval(detailTimer);
      detailTimer = null;
    }
  };

  const pollDetail = async (id: string): Promise<void> => {
    try {
      const detail = await api.getJob(id);
      // Защита от устаревших ответов: применяем результат, только если
      // запрошенное задание всё ещё активно.
      if (get().activeJobId !== id) return;
      set({ activeJob: detail, loadingDetail: false });
      if (isTerminal(detail.status)) {
        stopDetailPolling();
        void get().fetchJobs(true);
      }
    } catch (err) {
      if (get().activeJobId !== id) return;
      stopDetailPolling();
      set({
        loadingDetail: false,
        error: err instanceof Error ? err.message : 'Не удалось получить задание',
      });
    }
  };

  return {
    jobs: [],
    activeJobId: null,
    activeJob: null,
    loadingJobs: false,
    loadingDetail: false,
    creating: false,
    error: null,

    fetchJobs: async (silent = false) => {
      if (!silent) set({ loadingJobs: true });
      try {
        const jobs = await api.listJobs();
        set({ jobs, loadingJobs: false });
      } catch (err) {
        set({
          loadingJobs: false,
          error: err instanceof Error ? err.message : 'Не удалось получить список заданий',
        });
      }
    },

    createJob: async (urls) => {
      set({ creating: true, error: null });
      try {
        const { jobId } = await api.createJob(urls);
        set({ creating: false });
        await get().fetchJobs(true);
        get().selectJob(jobId);
      } catch (err) {
        set({
          creating: false,
          error: err instanceof Error ? err.message : 'Не удалось создать задание',
        });
      }
    },

    selectJob: (id) => {
      if (get().activeJobId === id) return;
      // При смене активного задания опрос предыдущего корректно останавливается.
      stopDetailPolling();
      set({ activeJobId: id, activeJob: null, loadingDetail: true, error: null });
      void pollDetail(id);
      detailTimer = setInterval(() => void pollDetail(id), POLL_INTERVAL_MS);
    },

    cancelActiveJob: async () => {
      const id = get().activeJobId;
      if (!id) return;
      try {
        const detail = await api.cancelJob(id);
        if (get().activeJobId === id) {
          set({ activeJob: detail });
        }
        void get().fetchJobs(true);
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Не удалось отменить задание',
        });
      }
    },

    stopDetailPolling,
    clearError: () => set({ error: null }),
  };
});
