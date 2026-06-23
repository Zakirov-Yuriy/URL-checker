import { Injectable } from '@nestjs/common';

export interface CheckResult {
  ok: boolean;
  httpStatus?: number;
  error?: string;
}

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Выполняет HTTP HEAD-запрос к одному URL и нормализует результат.
 */
@Injectable()
export class UrlCheckerService {
  async check(url: string): Promise<CheckResult> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { ok: false, error: 'Некорректный URL' };
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, error: 'Поддерживаются только протоколы http и https' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });
      if (res.ok) {
        return { ok: true, httpStatus: res.status };
      }
      return {
        ok: false,
        httpStatus: res.status,
        error: `HTTP ${res.status} ${res.statusText}`.trim(),
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { ok: false, error: 'Таймаут запроса' };
      }
      const message = err instanceof Error ? err.message : 'Ошибка запроса';
      return { ok: false, error: message };
    } finally {
      clearTimeout(timer);
    }
  }
}
