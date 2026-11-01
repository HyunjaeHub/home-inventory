import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, placeIcon, type IconName } from '@/components/icon';
import { InfoList, InfoRow } from '@/components/info-list';
import { Screen } from '@/components/screen';
import {
  ageTone,
  daysBetween,
  dBadge,
  expTone,
  fmt,
  foodSummary,
  isBulk,
  lotAge,
  lotText,
  lotsOf,
  monthDay,
  oneText,
  unitLabel,
  type FoodItem,
  type Lot,
} from '@/domain';
import { EditQtySheet, SplitSheet } from '@/features/stock/lot-sheets';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, fonts, placeColors, radius, spacing, tones } from '@/theme';

/** 단위별 개수 합: '3팩 · 2개' */
function countText(lots: Lot[], sep = ' · '): string {
  const order: string[] = [];
  const sum: Record<string, number> = {};
  for (const l of lots) {
    const k = unitLabel(l);
    if (!(k in sum)) {
      sum[k] = 0;
      order.push(k);
    }
    sum[k] += l.qty;
  }
  return order.map((k) => `${fmt(sum[k])}${k}`).join(sep);
}

const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${m}/${d}`;
};

type SheetState = { type: 'edit' | 'split'; lot: Lot } | null;

export function FoodDetail({ item }: { item: FoodItem }) {
  const today = useHome((s) => s.today);
  const meal = useHome((s) => s.meal);
  const rules = useHome((s) => s.rules);
  const { eat, moveLot, addMeal, addToShop } = useHome.getState();
  const [sort, setSort] = useState<'exp' | 'qty'>('exp');
  const [openLots, setOpenLots] = useState<Record<string, boolean>>({});
  const [sheet, setSheet] = useState<SheetState>(null);

  const lots = lotsOf(item, today);
  const amount = (l: Lot) => (l.size ? l.size * l.qty : l.qty);
  const sorted = sort === 'qty' ? [...lots].sort((a, b) => amount(b) - amount(a)) : lots;
  const sm = foodSummary(item, today, undefined, rules);
  const places = [...new Set(lots.map((l) => l.place))];

  const first = sm.first;
  const firstUrgent = first
    ? first.exp
      ? (sm.days ?? 99) <= rules.urgentDays
      : lotAge(first, today) >= rules.oldDays
    : false;
  const firstColor = firstUrgent ? colors.danger : tones.green.fg;

  return (
    <Screen
      title={item.name}
      back
      actions={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="살 것에 담기"
          onPress={() => addToShop(item.name, item.place)}
          style={styles.headerBtn}>
          <Icon name="shopping" color={colors.text} size={22} />
        </Pressable>
      }>
      <View style={styles.summary}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>남은 양</Text>
          <Text style={styles.summaryNum}>{lots.length ? countText(lots) : `0${item.unit}`}</Text>
        </View>
        <View style={[styles.summaryCol, styles.summaryDivider]}>
          <Text style={[styles.summaryLabel, { color: firstColor }]} numberOfLines={1}>
            {!first
              ? '남은 것'
              : first.exp
                ? `${sm.badge} · ${shortDate(first.exp)}`
                : '가장 오래된 것'}
          </Text>
          <Text style={[styles.summaryNum, { color: firstColor }]}>
            {!first
              ? '없음'
              : first.exp
                ? isBulk(first)
                  ? lotText(first)
                  : `${fmt(first.qty)}${unitLabel(first)}`
                : `${lotAge(first, today)}일째`}
          </Text>
          {first && !first.exp && (
            <Text style={styles.summarySub}>{shortDate(first.bought)} 넣음</Text>
          )}
        </View>
        <View style={[styles.summaryCol, styles.summaryDivider, styles.placeCol]}>
          {places.map((p) => (
            <View
              key={p}
              style={styles.placeChip}
              accessibilityLabel={`${p} ${countText(
                lots.filter((l) => l.place === p),
                '·'
              )}`}>
              <Icon name={placeIcon(p)} color={placeColors[p].fg} size={18} />
              <Text style={[styles.placeCount, { color: placeColors[p].fg }]}>
                {countText(
                  lots.filter((l) => l.place === p),
                  '·'
                )}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          보관 중
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`정렬: ${sort === 'exp' ? '기한 빠른 순' : '양 많은 순'} · 바꾸기`}
          onPress={() => setSort((s) => (s === 'exp' ? 'qty' : 'exp'))}
          style={styles.sortBtn}>
          <Icon name="sort" color={colors.mutedText} size={14} />
          <Text style={styles.sortText}>{sort === 'exp' ? '기한 빠른 순' : '양 많은 순'}</Text>
        </Pressable>
      </View>

      {sorted.map((lot) => {
        const open = !!openLots[lot.id];
        const d = lot.exp ? daysBetween(today, lot.exp) : null;
        const age = lotAge(lot, today);
        const pc = placeColors[lot.place];
        const canMove = lot.place === '냉장' || lot.place === '냉동';
        const canSplit = !!lot.size || isBulk(lot) || lot.qty >= 2;
        const inMeal = meal.some((m) => m.lotId === lot.id);
        const badgeColor =
          d !== null
            ? expTone(d) === 'orange'
              ? colors.danger
              : colors.heading
            : ageTone(age) === 'orange'
              ? colors.danger
              : colors.heading;
        return (
          <View key={lot.id} style={styles.lot}>
            <View style={styles.lotHead}>
              <View style={[styles.lotIcon, { backgroundColor: pc.tint }]}>
                <Icon name={placeIcon(lot.place)} color={pc.fg} />
              </View>
              <View style={styles.lotText}>
                <Text style={styles.lotQty} numberOfLines={1}>
                  {lotText(lot)}
                </Text>
                <Text style={styles.lotMeta} numberOfLines={1}>
                  <Text style={{ color: badgeColor, fontWeight: '700' }}>
                    {d !== null ? dBadge(d) : `${age}일째`}
                  </Text>
                  <Text style={styles.lotDate}>
                    {'  '}
                    {lot.exp ? shortDate(lot.exp) : `${shortDate(lot.bought)} 넣음`} · {lot.by}
                  </Text>
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${lot.exp ? `${monthDay(lot.exp)} 기한 ` : ''}${oneText(lot)} 먹음`}
                onPress={() => eat(item.id, lot.id)}
                style={styles.eatBtn}>
                <Text style={styles.eatText}>{isBulk(lot) ? '다 먹음' : '먹음'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={`${lotText(lot)} 동작 ${open ? '접기' : '펼치기'}`}
                onPress={() => setOpenLots((o) => ({ ...o, [lot.id]: !open }))}
                style={styles.toggleBtn}>
                <Icon name={open ? 'chevronUp' : 'chevronDown'} color={colors.link} size={18} />
              </Pressable>
            </View>
            {open && (
              <View style={styles.actions}>
                <LotAction
                  icon="bowl"
                  label={inMeal ? '한끼에 담김' : '한끼로'}
                  onPress={() => addMeal(item.id, lot.id)}
                />
                <LotAction
                  icon="edit"
                  label="양 고치기"
                  onPress={() => setSheet({ type: 'edit', lot })}
                />
                <LotAction
                  icon="split"
                  label="나누기"
                  disabled={!canSplit}
                  onPress={() => setSheet({ type: 'split', lot })}
                />
                <LotAction
                  icon="move"
                  label={lot.place === '냉동' ? '해동' : '옮기기'}
                  disabled={!canMove}
                  accessibilityLabel={
                    canMove
                      ? `${oneText(lot)} ${lot.place === '냉동' ? '해동하기' : '냉동실로 옮기기'}`
                      : '옮길 수 없어요'
                  }
                  onPress={() => moveLot(item.id, lot.id)}
                />
              </View>
            )}
          </View>
        );
      })}

      {lots.length === 0 && (
        <Text style={styles.emptyCard}>다 먹었어요. 새로 사면 아래에서 넣어 주세요</Text>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/add', params: { name: item.name } })}
        style={styles.addNew}>
        <Icon name="plus" color={colors.text} size={18} />
        <Text style={styles.addNewText}>새로 산 것 넣기</Text>
      </Pressable>

      <InfoList title="최근 기록">
        {item.log.slice(0, 5).map((g, i) => (
          <InfoRow key={i} label={`${g.text} · ${g.by}`} value={monthDay(g.date)} />
        ))}
      </InfoList>
      <InfoList title="설정">
        <InfoRow label="보관 장소" value={(places.length ? places : [item.place]).join(' · ')} />
        <InfoRow label="기한 관리" value={item.noExp ? '안 함 · 개수로만' : '함'} />
        <InfoRow label="기한 알림" value={`${rules.urgentDays}일 전`} />
      </InfoList>

      {sheet?.type === 'edit' && (
        <EditQtySheet itemId={item.id} lot={sheet.lot} onClose={() => setSheet(null)} />
      )}
      {sheet?.type === 'split' && (
        <SplitSheet itemId={item.id} lot={sheet.lot} onClose={() => setSheet(null)} />
      )}
    </Screen>
  );
}

function LotAction({
  icon,
  label,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.action, disabled && { opacity: 0.35 }]}>
      <Icon name={icon} color={colors.mutedText} size={18} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    flexDirection: 'row',
  },
  summaryCol: {
    flex: 1,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  summaryDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  summaryLabel: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.mutedText,
  },
  summaryNum: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 38,
    color: colors.heading,
    textAlign: 'center',
  },
  summarySub: {
    fontSize: 13,
    color: colors.link,
  },
  placeCol: {
    alignItems: 'flex-start',
    paddingLeft: spacing.md,
    gap: spacing.xs,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  placeCount: {
    fontFamily: fonts.display,
    fontSize: 20,
  },
  sectionHead: {
    paddingTop: 6,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.sectionTitle,
    color: colors.text,
  },
  sortBtn: {
    minHeight: 32,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedText,
  },
  lot: {
    padding: 14,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    gap: 10,
  },
  lotHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lotIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotText: {
    flex: 1,
    gap: 2,
  },
  lotQty: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
  },
  lotMeta: {
    fontSize: 13,
  },
  lotDate: {
    fontSize: fontSize.small,
    color: '#8A8E9C',
  },
  eatBtn: {
    width: 64,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eatText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  toggleBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  action: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: fontSize.caption,
    color: colors.mutedText,
  },
  emptyCard: {
    padding: 18,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    fontSize: fontSize.body,
    color: colors.textSecondary,
    overflow: 'hidden',
  },
  addNew: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addNewText: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.text,
  },
});
