import type {
  ConsumableItem,
  FoodItem,
  InboxItem,
  IsoDate,
  Item,
  Lot,
  LogEntry,
  Place,
  ShopItem,
  Task,
} from './types';

/** 시안의 기준일. 시드 데이터의 기한·구매일이 이 날짜에 맞춰져 있다 */
export const SEED_TODAY: IsoDate = '2026-10-23';

/** 시안(Main.dc.html)의 seed() 데이터. 개발·테스트용 */
export function seedData(): {
  items: Item[];
  shop: ShopItem[];
  inbox: InboxItem[];
  tasks: Task[];
} {
  let seq = 0;
  const id = (p: string) => `${p}${++seq}`;
  const L = (
    exp: IsoDate | null,
    qty: number,
    unit: string,
    place: Place,
    bought: IsoDate,
    by: string,
    size: number | null = null
  ): Lot => ({ id: id('l'), exp, qty, unit, place, bought, by, size });
  const log = (text: string, by: string, date: IsoDate): LogEntry => ({ text, by, date });
  const food = (
    itemId: string,
    name: string,
    place: Place,
    unit: string,
    noExp: boolean,
    lots: Lot[],
    logs: LogEntry[]
  ): FoodItem => ({ id: itemId, name, kind: 'food', place, unit, noExp, lots, log: logs });
  const cons = (
    itemId: string,
    name: string,
    unit: string,
    qty: number,
    every: number,
    logs: LogEntry[]
  ): ConsumableItem => ({
    id: itemId,
    name,
    kind: 'cons',
    place: '생활',
    unit,
    qty,
    every,
    log: logs,
  });

  const items: Item[] = [
    food(
      'daepa',
      '대파',
      '냉장',
      '단',
      true,
      [L(null, 1, '단', '냉장', '2026-10-15', '나')],
      [log('1단 넣음', '나', '2026-10-15')]
    ),
    food(
      'onion',
      '양파',
      '실온',
      '개',
      true,
      [L(null, 4, '개', '실온', '2026-10-05', '남편')],
      [log('1개 먹음', '나', '2026-10-19'), log('5개 넣음', '남편', '2026-10-05')]
    ),
    food(
      'potato',
      '감자',
      '실온',
      '개',
      true,
      [L(null, 3, '개', '실온', '2026-10-12', '나')],
      [log('3개 넣음', '나', '2026-10-12')]
    ),
    food(
      'chicken',
      '닭다리살',
      '냉동',
      'g',
      false,
      [
        L('2026-10-25', 1, 'g', '냉장', '2026-10-20', '나', 200),
        L('2026-12-20', 2, 'g', '냉동', '2026-10-20', '나', 200),
      ],
      [log('1팩 해동', '나', '2026-10-23'), log('600g 사서 3팩으로 나눔', '나', '2026-10-20')]
    ),
    food(
      'yogurt',
      '요거트',
      '냉장',
      '개',
      false,
      [
        L('2026-10-25', 1, '개', '냉장', '2026-10-18', '나'),
        L('2026-11-01', 2, '개', '냉장', '2026-10-21', '남편'),
      ],
      [
        log('1개 먹음', '남편', '2026-10-22'),
        log('2개 넣음', '남편', '2026-10-21'),
        log('2개 넣음', '나', '2026-10-18'),
      ]
    ),
    food(
      'milk',
      '우유',
      '냉장',
      '개',
      false,
      [
        L('2026-10-26', 1, '개', '냉장', '2026-10-19', '나'),
        L('2026-11-02', 1, '개', '냉장', '2026-10-22', '남편'),
      ],
      [log('1개 넣음', '남편', '2026-10-22'), log('1개 넣음', '나', '2026-10-19')]
    ),
    food(
      'egg',
      '계란',
      '냉장',
      '개',
      false,
      [L('2026-11-04', 10, '개', '냉장', '2026-10-20', '나')],
      [log('10개 넣음', '나', '2026-10-20')]
    ),
    food(
      'tofu',
      '두부',
      '냉장',
      '개',
      false,
      [
        L('2026-10-27', 1, '개', '냉장', '2026-10-21', '나'),
        L('2026-10-30', 1, '개', '냉장', '2026-10-21', '나'),
      ],
      [log('2개 넣음', '나', '2026-10-21')]
    ),
    food(
      'mandu',
      '만두',
      '냉동',
      '봉',
      false,
      [
        L('2026-12-22', 1, '봉', '냉동', '2026-10-01', '남편'),
        L('2027-01-15', 1, '봉', '냉동', '2026-10-15', '나'),
      ],
      [log('1봉 넣음', '나', '2026-10-15'), log('1봉 넣음', '남편', '2026-10-01')]
    ),
    food(
      'cereal',
      '시리얼',
      '실온',
      '봉',
      false,
      [L('2026-10-25', 1, '봉', '실온', '2026-09-25', '남편')],
      [log('1봉 넣음', '남편', '2026-09-25')]
    ),
    cons('trash', '쓰레기봉투', '개', 2, 3, [
      log('1개 사용', '나', '2026-10-21'),
      log('1개 사용', '남편', '2026-10-18'),
    ]),
    cons('razor', '면도기날', '개', 1, 10, [
      log('1개 사용', '남편', '2026-10-22'),
      log('1개 사용', '남편', '2026-10-12'),
      log('1개 사용', '남편', '2026-10-02'),
      log('3개 구매', '나', '2026-09-28'),
    ]),
    cons('sponge', '수세미', '개', 1, 14, [log('1개 사용', '나', '2026-10-09')]),
    cons('tissue', '휴지', '롤', 8, 4, [log('1개 사용', '나', '2026-10-20')]),
    cons('paste', '치약', '개', 2, 30, [log('1개 사용', '남편', '2026-10-05')]),
  ];

  const shop: ShopItem[] = [
    { id: 's1', name: '우유', place: '냉장', by: '나', checked: true },
    { id: 's2', name: '샴푸', place: '생활', by: '남편', checked: true },
    { id: 's3', name: '양파', place: '실온', by: '남편', checked: false },
    { id: 's4', name: '식용유', place: '실온', by: '나', checked: false },
  ];

  const inbox: InboxItem[] = [
    { id: 'i1', name: '삼겹살', place: '냉장', by: '남편', date: '2026-10-23' },
    { id: 'i2', name: '대파', place: '냉장', by: '남편', date: '2026-10-23' },
  ];

  const tasks: Task[] = [
    { id: 't1', text: '냉장고 칸 닦기', done: false },
    { id: 't2', text: '분리수거 내놓기', done: true },
  ];

  return { items, shop, inbox, tasks };
}
