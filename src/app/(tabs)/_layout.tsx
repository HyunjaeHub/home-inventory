import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/app-tab-bar';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="stock" options={{ title: '재고' }} />
      <Tabs.Screen name="meal" options={{ title: '한끼' }} />
      <Tabs.Screen name="shopping" options={{ title: '장보기' }} />
      <Tabs.Screen name="settings" options={{ title: '설정' }} />
    </Tabs>
  );
}
