import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';

const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export default function HomeScreen() {
  const now = new Date();
  const title = `${now.getMonth() + 1}월 ${now.getDate()}일`;

  return (
    <Screen title={title} subtitle={WEEKDAYS[now.getDay()]}>
      <PlaceholderCard title="이번 주 기한" description="기한이 가까운 품목이 여기에 보여요." />
      <PlaceholderCard title="같이 할 일" description="둘이 함께 챙길 집안일 체크리스트예요." />
      <PlaceholderCard title="정리함" description="상대가 사 온 물건을 확인하고 재고에 넣어요." />
    </Screen>
  );
}
