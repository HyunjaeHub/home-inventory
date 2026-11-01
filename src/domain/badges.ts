import { addDays, daysBetween, monthDay, monthOf } from './date';
import { lotsOf } from './lots';
import {
  DEFAULT_RULES,
  type ConsumableItem,
  type FoodItem,
  type IsoDate,
  type Lot,
  type Place,
  type Rules,
  type Tone,
} from './types';

/** 'D-day' / 'D-3' / '2일 지남' */
export function dBadge(days: number): string {
  if (days < 0) return `${-days}일 지남`;
  if (days === 0) return 'D-day';
  return `D-${days}`;
}

export function expTone(days: number, rules: Rules = DEFAULT_RULES): Tone {
  if (days <= rules.urgentDays) return 'orange';
  if (days <= 7) return 'gray';
  return 'green';
}

/** 산 지 며칠째 */
export function lotAge(lot: Lot, today: IsoDate): number {
  return daysBetween(lot.bought, today);
}

export function ageTone(age: number, rules: Rules = DEFAULT_RULES): Tone {
  return age >= rules.oldDays ? 'orange' : 'gray';
}

export type FoodSummary = {
  /** 가장 먼저 먹을 로트. 다 먹었으면 null */
  first: Lot | null;
  /** first의 기한까지 남은 일수. 기한 없음·다 먹음이면 null */
  days: number | null;
  badge: string;
  tone: Tone;
};

/** 품목 한 줄 요약 배지: 기한 있으면 D-n, 없으면 'n일째', 다 먹었으면 '다 먹음' */
export function foodSummary(
  item: FoodItem,
  today: IsoDate,
  place?: Place,
  rules: Rules = DEFAULT_RULES
): FoodSummary {
  const first = lotsOf(item, today, place)[0];
  if (!first) return { first: null, days: null, badge: '다 먹음', tone: 'gray' };
  if (!first.exp) {
    const age = lotAge(first, today);
    return { first, days: null, badge: `${age}일째`, tone: ageTone(age, rules) };
  }
  const days = daysBetween(today, first.exp);
  return { first, days, badge: dBadge(days), tone: expTone(days, rules) };
}

/** 지금 남은 양으로 며칠 더 쓸 수 있는지 */
export function consDays(item: ConsumableItem): number {
  return item.qty * item.every;
}

export function consBadge(item: ConsumableItem, today: IsoDate): { text: string; tone: Tone } {
  const d = consDays(item);
  if (item.qty <= 0) return { text: '다 썼어요', tone: 'orange' };
  const when = addDays(today, d);
  if (d <= 7) return { text: '이번 주', tone: 'blue' };
  if (d <= 14) return { text: `${monthDay(when)}쯤`, tone: 'blue' };
  if (d > 45) return { text: `${monthOf(when)}월 중`, tone: 'gray' };
  return { text: `${monthDay(when)}쯤`, tone: 'gray' };
}
