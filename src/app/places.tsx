import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { lookOfKind } from '@/components/place-look';
import { Screen } from '@/components/screen';
import { PLACE_KINDS, type StoragePlace } from '@/domain';
import { PlaceSheet } from '@/features/settings/place-sheet';
import { filterCounts } from '@/features/stock/stock-groups';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, radius, spacing } from '@/theme';

const kindLabel = (p: StoragePlace) => PLACE_KINDS.find((k) => k.kind === p.kind)!.label;

/** 설정 › 보관 장소: 추가, 이름·종류 고치기, 순서 바꾸기, 지우기 */
export default function PlacesScreen() {
  const places = useHome((s) => s.places);
  const items = useHome((s) => s.items);
  const today = useHome((s) => s.today);
  const actions = useHome.getState();
  // undefined: 닫힘, null: 새로 추가, StoragePlace: 고치기
  const [editing, setEditing] = useState<StoragePlace | null | undefined>(undefined);
  const counts = filterCounts(items, today, places);

  return (
    <Screen
      title="보관 장소"
      back
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => setEditing(null)}
          style={styles.addBtn}>
          <Icon name="plus" color={colors.surface} size={18} strokeWidth={2.4} />
          <Text style={styles.addText}>장소 추가</Text>
        </Pressable>
      }>
      <Text style={styles.intro}>
        순서대로 재고 목록과 빠른 추가에 보여요. 종류에 따라 해동·냉동 기한 규칙이 정해져요.
      </Text>
      <View style={styles.list}>
        {places.map((p, i) => {
          const look = lookOfKind(p.kind);
          return (
            <View key={p.id} style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${p.name}, ${kindLabel(p)} 종류, ${counts[p.id] ?? 0}가지 · 고치기`}
                onPress={() => setEditing(p)}
                style={styles.main}>
                <View style={[styles.tile, { backgroundColor: look.tint }]}>
                  <Icon name={look.icon} color={look.fg} size={18} />
                </View>
                <View style={styles.text}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.sub}>
                    {kindLabel(p)} 종류 · {counts[p.id] ?? 0}가지
                  </Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${p.name} 위로`}
                accessibilityState={{ disabled: i === 0 }}
                disabled={i === 0}
                onPress={() => actions.movePlace(p.id, -1)}
                style={[styles.orderBtn, i === 0 && styles.off]}>
                <Icon name="chevronUp" color={colors.mutedText} size={18} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${p.name} 아래로`}
                accessibilityState={{ disabled: i === places.length - 1 }}
                disabled={i === places.length - 1}
                onPress={() => actions.movePlace(p.id, 1)}
                style={[styles.orderBtn, i === places.length - 1 && styles.off]}>
                <Icon name="chevronDown" color={colors.mutedText} size={18} />
              </Pressable>
            </View>
          );
        })}
      </View>
      <Text style={styles.foot}>
        재고나 살 것이 있는 장소, 종류의 마지막 한 곳은 지울 수 없어요.
      </Text>

      {editing !== undefined && (
        <PlaceSheet place={editing ?? undefined} onClose={() => setEditing(undefined)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingHorizontal: spacing.xs,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  list: { gap: 1, backgroundColor: colors.border, borderRadius: 20, overflow: 'hidden' },
  row: {
    minHeight: 60,
    paddingRight: spacing.xs,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    minHeight: 60,
    paddingLeft: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  sub: { fontSize: fontSize.small, color: colors.textSecondary },
  orderBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.25 },
  foot: { paddingHorizontal: spacing.xs, fontSize: fontSize.small, color: colors.textSecondary },
  addBtn: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.toast,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addText: { fontSize: 16, fontWeight: '700', color: colors.surface },
});
