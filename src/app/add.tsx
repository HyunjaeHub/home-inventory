import { useLocalSearchParams } from 'expo-router';

import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';

export default function AddScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  return (
    <Screen title="빠른 추가" back>
      <PlaceholderCard
        title={name ? `${name} 넣기` : '재고 넣기'}
        description="이름을 쓰면 단위를 알아서 채우고, 고기처럼 큰 덩어리는 팩으로 나눠 넣을 수 있어요. 다음 단계에서 만들어요."
      />
    </Screen>
  );
}
