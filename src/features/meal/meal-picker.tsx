import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/badge';
import { Icon } from '@/components/icon';
import { usePlaceLook } from '@/components/place-look';
import { pickerGroups } from '@/features/meal/meal-view';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, fonts, radius, spacing } from '@/theme';

/** 재료 고르기: 장소별 식품을 눌러 다음 한끼에 담고 뺀다 */
export function MealPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const items = useHome((s) => s.items);
  const meal = useHome((s) => s.meal);
  const today = useHome((s) => s.today);
  const actions = useHome.getState();
  const places = useHome((s) => s.places);
  const look = usePlaceLook();
  const [query, setQuery] = useState('');
  const groups = pickerGroups(items, meal, today, query, places);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            재료 고르기
          </Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.done}>
            <Text style={styles.doneText}>완료 · {meal.length}가지</Text>
          </Pressable>
        </View>
        <View style={styles.searchBox}>
          <Icon name="search" color={colors.heading} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="재료 이름"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="재료 검색"
            style={styles.searchInput}
          />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {groups.map((g) => {
            const pc = look(g.place);
            return (
              <View key={g.place} style={[styles.group, { backgroundColor: pc.tint }]}>
                <View style={styles.groupHead}>
                  <Icon name={pc.icon} color={pc.fg} />
                  <Text style={[styles.groupTitle, { color: pc.fg }]}>{pc.name}</Text>
                  <Text style={[styles.groupCount, { color: pc.fg }]}>{g.items.length}</Text>
                </View>
                <View style={styles.rows}>
                  {g.items.map((it) => (
                    <Pressable
                      key={it.itemId}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: it.inMeal }}
                      accessibilityLabel={`${it.name} ${pc.name} ${it.inMeal ? '담김, 눌러서 빼기' : '눌러서 한끼에 담기'}`}
                      onPress={() =>
                        it.inMeal
                          ? actions.removeMealByItem(it.itemId)
                          : actions.addMeal(it.itemId, it.lotId)
                      }
                      style={styles.row}>
                      <View style={[styles.dot, it.inMeal && styles.dotOn]}>
                        <Icon
                          name={it.inMeal ? 'check' : 'plus'}
                          color={it.inMeal ? colors.surface : '#8A8E9C'}
                          size={14}
                          strokeWidth={2.6}
                        />
                      </View>
                      <Text style={styles.name} numberOfLines={1}>
                        {it.name}
                      </Text>
                      <Text style={styles.qty}>{it.qty}</Text>
                      <Badge text={it.badge} tone={it.tone} />
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
          {groups.length === 0 && <Text style={styles.empty}>찾는 재료가 없어요</Text>}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 26, color: colors.heading },
  done: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.toast,
    justifyContent: 'center',
  },
  doneText: { fontSize: fontSize.body, fontWeight: '700', color: colors.surface },
  searchBox: {
    marginHorizontal: spacing.lg,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: { flex: 1, height: 40, fontSize: fontSize.bodyLarge, color: colors.text },
  content: { padding: spacing.lg, gap: spacing.md },
  group: { borderRadius: radius.card, padding: spacing.xs },
  groupHead: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupTitle: { fontFamily: fonts.display, fontSize: 19 },
  groupCount: { fontFamily: fonts.display, fontSize: 19, opacity: 0.5 },
  rows: { gap: 1, backgroundColor: colors.divider, borderRadius: 20, overflow: 'hidden' },
  row: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#CDD0D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { borderColor: colors.heading, backgroundColor: colors.heading },
  name: { flex: 1, fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  qty: { fontSize: 13, color: colors.textSecondary },
  empty: {
    paddingVertical: 32,
    textAlign: 'center',
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
});
