import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';

export default function StockScreen() {
  return (
    <Screen title="재고">
      <PlaceholderCard
        title="냉장 · 냉동 · 실온 · 생활"
        description="보관 장소별로 품목과 남은 양, 기한을 보여줘요."
      />
    </Screen>
  );
}
