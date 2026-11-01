import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/app-tab-bar';
import { useHome } from '@/stores/home-store';

export default function TabLayout() {
  // 탭 배지: 한끼에 담은 수, 아직 안 산 살 것 수 (0이면 숨김)
  const mealCount = useHome((s) => s.meal.length);
  const shopLeft = useHome((s) => s.shop.filter((x) => !x.checked).length);

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="stock" options={{ title: '재고' }} />
      <Tabs.Screen name="meal" options={{ title: '한끼', tabBarBadge: mealCount || undefined }} />
      <Tabs.Screen
        name="shopping"
        options={{ title: '장보기', tabBarBadge: shopLeft || undefined }}
      />
      <Tabs.Screen name="settings" options={{ title: '설정' }} />
    </Tabs>
  );
}
