import { useHome } from '@/stores/home-store';

const food = (id: string) => {
  const it = useHome.getState().items.find((i) => i.id === id);
  if (!it || it.kind !== 'food') throw new Error(id);
  return it;
};

describe('home-store 설정 반영', () => {
  beforeEach(() => {
    useHome.getState().resetSample();
    useHome.setState({ rules: { ...useHome.getState().rules, chillDays: 2 } });
    useHome.getState().setPrefs({ useInbox: true });
  });

  it('냉장 기한 규칙을 바꾸면 해동할 때 반영된다', () => {
    useHome.getState().setRules({ chillDays: 1 });
    const frozen = food('chicken').lots.find((l) => l.place === '냉동')!;
    useHome.getState().moveLot('chicken', frozen.id);
    const thawed = food('chicken').lots.filter((l) => l.place === '냉장');
    expect(thawed.map((l) => l.exp)).toContain('2026-10-24');
  });

  it('정리함을 끄면 장보기 완료 시 바로 재고에 넣는다', () => {
    useHome.getState().setPrefs({ useInbox: false });
    const inboxBefore = useHome.getState().inbox.length;
    useHome.getState().completeShop();
    const s = useHome.getState();
    expect(s.inbox).toHaveLength(inboxBefore);
    expect(s.shop.every((x) => !x.checked)).toBe(true);
    expect(s.items.some((i) => i.name === '샴푸' && i.kind === 'cons')).toBe(true);
  });

  it('보관 장소 추가·이름 바꾸기·순서·지우기', () => {
    const s = () => useHome.getState();
    useHome.setState({ places: s().places.slice(0, 4) });
    expect(s().addPlace('김치냉장고', 'fridge')).toBe(true);
    expect(s().addPlace('김치냉장고', 'fridge')).toBe(false);
    const kimchi = s().places.at(-1)!;
    expect(kimchi).toMatchObject({ name: '김치냉장고', kind: 'fridge' });

    s().movePlace(kimchi.id, -1);
    expect(s().places.map((p) => p.name)).toEqual(['냉장', '냉동', '실온', '김치냉장고', '생활']);

    expect(s().updatePlace('냉장', { name: '양문형 냉장고' })).toBe(true);
    expect(s().places[0]).toMatchObject({ id: '냉장', name: '양문형 냉장고' });

    // 재고가 있는 장소, 종류의 마지막 장소는 못 지운다
    expect(s().removePlace('냉장')).toBe(false);
    expect(s().removePlace(kimchi.id)).toBe(true);
    expect(s().updatePlace('냉동', { kind: 'pantry' })).toBe(false);
  });

  it('정리함을 켜면 정리할 것으로 옮긴다', () => {
    useHome.getState().completeShop();
    expect(useHome.getState().inbox.map((x) => x.name)).toEqual(['삼겹살', '대파', '우유', '샴푸']);
  });
});
