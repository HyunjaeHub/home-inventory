import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';

export default function ShoppingScreen() {
  return (
    <Screen title="장보기">
      <PlaceholderCard
        title="살 것"
        description="둘이 함께 보는 장보기 목록이에요. 산 건 체크하면 재고로 넘어가요."
      />
    </Screen>
  );
}
