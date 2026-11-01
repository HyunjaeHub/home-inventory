import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';

export default function MealScreen() {
  return (
    <Screen title="다음 한끼">
      <PlaceholderCard
        title="재료 고르기"
        description="재고에서 재료를 골라 한끼를 계획하고, 먹고 나면 한 번에 차감해요."
      />
    </Screen>
  );
}
