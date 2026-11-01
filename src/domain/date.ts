import type { IsoDate } from './types';

const DAY_MS = 86_400_000;

function toUtc(iso: IsoDate): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** 기기 로컬 날짜를 'YYYY-MM-DD'로 */
export function todayIso(now: Date = new Date()): IsoDate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** from에서 to까지 며칠 (to가 과거면 음수) */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

export function addDays(iso: IsoDate, n: number): IsoDate {
  const d = new Date(toUtc(iso) + n * DAY_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** '10월 23일' */
export function monthDay(iso: IsoDate): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${m}월 ${d}일`;
}

export function monthOf(iso: IsoDate): number {
  return Number(iso.split('-')[1]);
}
