import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/components/screen';
import { ConsDetail } from '@/features/stock/cons-detail';
import { FoodDetail } from '@/features/stock/food-detail';
import { useHome } from '@/stores/home-store';
import { colors } from '@/theme';

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useHome((s) => s.items.find((i) => i.id === id));

  if (!item) {
    return (
      <Screen title="품목" back>
        <Text style={{ color: colors.textSecondary }}>품목을 찾을 수 없어요</Text>
      </Screen>
    );
  }
  return item.kind === 'food' ? <FoodDetail item={item} /> : <ConsDetail item={item} />;
}
