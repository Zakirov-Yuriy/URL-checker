import { useState } from 'react';
import { useJobsStore } from '../store/jobs.store';

export function CreateJobForm() {
  const [text, setText] = useState('');
  const creating = useJobsStore((s) => s.creating);
  const createJob = useJobsStore((s) => s.createJob);

  const urls = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const handleSubmit = (): void => {
    if (urls.length === 0) return;
    void createJob(urls);
    setText('');
  };

  return (
    <section className="card">
      <h2 className="card__title">Новое задание</h2>
      <textarea
        className="textarea"
        placeholder={'https://example.com\nhttps://github.com\n...'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        spellCheck={false}
      />
      <div className="form-footer">
        <span className="muted">URL в списке: {urls.length}</span>
        <button
          className="btn btn--primary"
          onClick={handleSubmit}
          disabled={creating || urls.length === 0}
        >
          {creating ? 'Создаём…' : 'Запустить проверку'}
        </button>
      </div>
    </section>
  );
}
