import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Icon } from '@/components/icon';
import { usePlaceLook } from '@/components/place-look';
import { Screen } from '@/components/screen';
import type { Place } from '@/domain';
import {
  filterCounts,
  stockFilters,
  stockGroups,
  type StockFilter,
  type StockRow,
} from '@/features/stock/stock-groups';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, fonts, radius, spacing } from '@/theme';

export default function StockScreen() {
  const items = useHome((s) => s.items);
  const today = useHome((s) => s.today);
  const places = useHome((s) => s.places);
  const look = usePlaceLook();
  const [pickedFilter, setFilter] = useState<StockFilter>('전체');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState<Partial<Record<Place, boolean>>>({});

  // 고른 장소가 지워졌으면 전체로
  const filter =
    pickedFilter === '전체' || places.some((p) => p.id === pickedFilter) ? pickedFilter : '전체';
  const counts = useMemo(() => filterCounts(items, today, places), [items, today, places]);
  const groups = useMemo(
    () => stockGroups(items, today, filter, query, places),
    [items, today, filter, query, places]
  );

  const actions = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="품목 검색"
        accessibilityState={{ expanded: searchOpen }}
        onPress={() => setSearchOpen((o) => !o)}
        style={[styles.iconBtn, searchOpen && styles.iconBtnOn]}>
        <Icon
          name="search"
          color={searchOpen ? colors.surface : colors.heading}
          size={18}
          strokeWidth={2.2}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="재고 추가"
        onPress={() => router.push('/add')}
        style={styles.addBtn}>
        <Icon name="plus" color={colors.surface} size={18} strokeWidth={2.4} />
        <Text style={styles.addText}>추가</Text>
      </Pressable>
    </>
  );

  const fixed = (
    <>
      {searchOpen && (
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" color={colors.heading} size={18} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="품목 이름"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="품목 검색"
              returnKeyType="search"
              style={styles.searchInput}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setQuery('');
              setSearchOpen(false);
            }}
            style={styles.cancel}>
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersInner}
        accessibilityRole="tablist">
        {stockFilters(places).map((f) => {
          const on = f === filter;
          const color = on ? (f === '전체' ? colors.heading : look(f).fg) : '#8A8E9C';
          return (
            <Pressable
              key={f}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setFilter(f)}
              style={[styles.filter, on && { borderBottomColor: color }]}>
              <Text style={[styles.filterLabel, { color }]}>{f === '전체' ? f : look(f).name}</Text>
              <Text style={[styles.filterCount, { color }]}>{counts[f]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );

  return (
    <Screen title="재고" actions={actions} fixed={fixed}>
      <View style={styles.groups}>
        {groups.map((g) => {
          const open = !closed[g.place];
          const pc = look(g.place);
          return (
            <View key={g.place} style={[styles.group, { backgroundColor: pc.tint }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={`${pc.name} ${g.rows.length}가지 ${open ? '접기' : '펼치기'}`}
                onPress={() => setClosed((c) => ({ ...c, [g.place]: open }))}
                style={styles.groupHead}>
                <Icon name={pc.icon} color={pc.fg} />
                <Text style={[styles.groupTitle, { color: pc.fg }]}>{pc.name}</Text>
                <Text style={[styles.groupCount, { color: pc.fg }]}>{g.rows.length}가지</Text>
                <View style={styles.chevron}>
                  <Icon name={open ? 'chevronUp' : 'chevronDown'} color={pc.fg} size={16} />
                </View>
              </Pressable>
              {open && (
                <View style={styles.rows}>
                  {g.rows.map((row) => (
                    <StockRowView key={row.itemId} row={row} />
                  ))}
                </View>
              )}
            </View>
          );
        })}
        {groups.length === 0 && <Text style={styles.empty}>찾는 품목이 없어요</Text>}
      </View>
    </Screen>
  );
}

function StockRowView({ row }: { row: StockRow }) {
  const inMeal = useHome((s) => s.meal.some((m) => m.itemId === row.itemId));
  const addMeal = useHome((s) => s.addMeal);
  const removeMeal = useHome((s) => s.removeMealByItem);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${row.name} ${row.badge} ${row.sub}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: row.itemId } })}
        style={styles.rowMain}>
        <View style={styles.rowText}>
          <Text style={styles.rowName} numberOfLines={1}>
            {row.name}
          </Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {row.sub}
          </Text>
        </View>
        <Badge text={row.badge} tone={row.tone} />
      </Pressable>
      {row.isFood && row.firstLotId && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: inMeal }}
          accessibilityLabel={`${row.name} ${inMeal ? '다음 한끼에서 빼기' : '다음 한끼에 담기'}`}
          onPress={() =>
            inMeal ? removeMeal(row.itemId) : addMeal(row.itemId, row.firstLotId ?? undefined)
          }
          style={[styles.mealBtn, inMeal && styles.mealBtnOn]}>
          <Icon
            name={inMeal ? 'check' : 'plus'}
            color={inMeal ? colors.mutedText : colors.heading}
            size={15}
            strokeWidth={2.5}
          />
          <Text style={[styles.mealText, inMeal && { color: colors.mutedText }]}>
            {inMeal ? '담김' : '한끼'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnOn: {
    backgroundColor: colors.heading,
  },
  addBtn: {
    height: 42,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.toast,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addText: {
    color: colors.surface,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  searchRow: {
    marginTop: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.heading,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: fontSize.bodyLarge,
    color: colors.text,
  },
  cancel: {
    height: 42,
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.heading,
  },
  filters: {
    flexGrow: 0,
    marginTop: 2,
    marginHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#DCDDE3',
  },
  // 장소가 적으면 칸을 나눠 채우고, 많으면 가로로 넘긴다
  filtersInner: {
    flexGrow: 1,
  },
  filter: {
    flexGrow: 1,
    minWidth: 64,
    paddingHorizontal: spacing.sm,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  filterLabel: {
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  filterCount: {
    fontFamily: fonts.display,
    fontSize: fontSize.bodyLarge,
  },
  groups: {
    paddingTop: spacing.xs,
    gap: spacing.xl,
  },
  group: {
    borderRadius: radius.card,
    padding: spacing.xs,
  },
  groupHead: {
    minHeight: 48,
    paddingVertical: 6,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
  },
  groupCount: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rows: {
    gap: 1,
    backgroundColor: colors.divider,
    borderRadius: 20,
    overflow: 'hidden',
  },
  row: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowMain: {
    flex: 1,
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingLeft: 14,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.text,
  },
  rowSub: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  mealBtn: {
    width: 76,
    height: 40,
    marginRight: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  mealBtnOn: {
    borderColor: '#E6EAE7',
    backgroundColor: '#E6EAE7',
  },
  mealText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.heading,
  },
  empty: {
    paddingVertical: 32,
    textAlign: 'center',
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
});
