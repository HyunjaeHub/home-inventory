import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TabIcon, type TabIconName } from '@/components/tab-icon';
import { colors, fontSize, radius, spacing } from '@/theme';

const ICONS: Record<string, TabIconName> = {
  index: 'home',
  stock: 'stock',
  meal: 'meal',
  shopping: 'shopping',
  settings: 'settings',
};

/** 시안의 하단 탭 바: 흰 바탕, 활성 탭은 둥근 회색 배경 + 굵은 글씨 */
export function AppTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = index === state.index;
        const label = options.title ?? route.name;
        const color = focused ? colors.heading : colors.textMuted;
        const badge = options.tabBarBadge;

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={[styles.item, focused && styles.itemActive]}>
            <TabIcon name={ICONS[route.name] ?? 'home'} color={color} />
            <Text style={[styles.label, { color, fontWeight: focused ? '700' : '500' }]}>
              {label}
            </Text>
            {badge != null && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: route.name === 'meal' ? colors.accentGreen : colors.accentBlue,
                  },
                ]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  item: {
    flex: 1,
    height: 58,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  itemActive: {
    backgroundColor: colors.tabActive,
  },
  label: {
    fontSize: fontSize.caption,
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: '50%',
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.surface,
    fontSize: fontSize.caption,
    fontWeight: '700',
  },
});
