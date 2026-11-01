import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, placeIcon } from '@/components/icon';
import { addDays, daysBetween, lotAge, lotText, lotsOf, monthDay, totalText } from '@/domain';
import { expiryStrip, weekdayOf, type StripCol } from '@/features/home/home-summary';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, fonts, placeColors, radius, spacing } from '@/theme';

const ALERT_FG = '#B4380F';
const ALERT_BG = '#FFD8C8';
const MAX_SQUARES = 9;

const isAlertDay = (col: StripCol) => typeof col.key === 'number' && col.key >= 1 && col.key <= 3;

/** 홈 '이번 주 기한': 날짜 칸을 누르면 그날 기한인 재료가 아래에 펼쳐진다 */
export function ExpiryStrip() {
  const items = useHome((s) => s.items);
  const today = useHome((s) => s.today);
  const [sel, setSel] = useState<StripCol['key'] | null>(null);
  const { cols, laterCount } = expiryStrip(items, today);
  const selected = cols.find((c) => c.key === sel);

  const [, laterM, laterD] = addDays(today, 7).split('-').map(Number);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title} accessibilityRole="header">
            이번 주 기한
          </Text>
          {laterCount > 0 && (
            <Pressable
              accessibilityRole="link"
              onPress={() => router.navigate('/stock')}
              style={styles.more}>
              <Text style={styles.moreText}>
                {laterM}/{laterD} 이후 기한인 재료 {laterCount}가지
              </Text>
              <Icon name="chevronRight" color={colors.link} size={14} />
            </Pressable>
          )}
        </View>
        <View style={styles.cols}>
          {cols.map((col) => (
            <StripColumn
              key={String(col.key)}
              col={col}
              selected={sel === col.key}
              onPress={() => setSel((s) => (s === col.key ? null : col.key))}
            />
          ))}
        </View>
      </View>

      {selected && selected.entries.length > 0 && (
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>
              {selected.key === 'old'
                ? '기한 없이 2주 넘게 둔 것'
                : `${monthDay(selected.date)} ${weekdayOf(selected.date)}요일까지`}
            </Text>
            {selected.key !== 'old' && (
              <Text
                style={[
                  styles.panelBadge,
                  selected.key <= 3 && { backgroundColor: '#FBE7DC', color: '#C2410C' },
                ]}>
                {selected.key === 0 ? '오늘' : `D-${selected.key}`}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => setSel(null)}
              style={styles.panelClose}>
              <Icon name="close" color={colors.heading} size={16} />
              <Text style={styles.panelCloseText}>닫기</Text>
            </Pressable>
          </View>
          {selected.entries.map(({ item, lot }) => {
            const pc = placeColors[lot.place];
            const all = lotsOf(item, today);
            const overdue = lot.exp ? daysBetween(today, lot.exp) : 0;
            const extra =
              selected.key === 'old'
                ? `${lotAge(lot, today)}일째`
                : all.length > 1
                  ? `총 ${totalText(all)} 중`
                  : overdue < 0
                    ? `${-overdue}일 지남`
                    : '';
            return (
              <Pressable
                key={lot.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                style={styles.row}>
                <View style={[styles.tile, { backgroundColor: pc.tint }]}>
                  <Icon name={placeIcon(lot.place)} color={pc.fg} size={16} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {lot.place}
                    {extra ? ` · ${extra}` : ''}
                  </Text>
                </View>
                <Text style={styles.rowQty}>{lotText(lot).replace(' × ', '×')}</Text>
                <Icon name="chevronRight" color={colors.textSecondary} size={16} />
              </Pressable>
            );
          })}
        </View>
      )}
    </>
  );
}

function StripColumn({
  col,
  selected,
  onPress,
}: {
  col: StripCol;
  selected: boolean;
  onPress: () => void;
}) {
  const old = col.key === 'old';
  const today = col.key === 0;
  const alert = isAlertDay(col);
  const label = old ? '오래' : today ? '오늘' : weekdayOf(col.date);
  const num = old ? '2주+' : String(Number(col.date.split('-')[2]));
  const squares = col.entries.slice(0, MAX_SQUARES);
  const aria = old
    ? `2주 넘게 둔 것 ${col.entries.length}가지`
    : `${monthDay(col.date)}${today ? ' 오늘' : ''} 기한 ${col.entries.length}가지`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={aria}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.col}>
      <Text
        style={[
          styles.wd,
          today && { color: colors.heading, fontWeight: '700' },
          alert && { color: ALERT_FG },
        ]}>
        {label}
      </Text>
      <View style={[styles.ring, selected && !old && { borderColor: colors.heading }]}>
        <View
          style={[
            styles.num,
            today && { backgroundColor: colors.heading },
            alert && { backgroundColor: ALERT_BG },
            old && {
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: selected ? colors.heading : '#C3C6D0',
            },
          ]}>
          <Text
            style={[
              styles.numText,
              old && { fontSize: fontSize.small },
              today && { color: colors.surface },
              alert && { color: ALERT_FG },
            ]}>
            {num}
          </Text>
        </View>
      </View>
      <View style={styles.squares}>
        {squares.map(({ lot }) => (
          <View
            key={lot.id}
            style={[styles.square, { backgroundColor: placeColors[lot.place].fg }]}
          />
        ))}
      </View>
      {col.entries.length > MAX_SQUARES && (
        <Text style={styles.over}>+{col.entries.length - MAX_SQUARES}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    gap: 10,
  },
  head: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { fontFamily: fonts.display, fontSize: fontSize.sectionTitle, color: colors.text },
  more: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 2 },
  moreText: { fontSize: 13, color: colors.link },
  cols: { flexDirection: 'row', gap: 2 },
  col: { flex: 1, minHeight: 76, alignItems: 'center', gap: 5 },
  wd: { fontSize: fontSize.caption, color: colors.textMuted },
  ring: {
    padding: 2,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  num: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontFamily: fonts.display, fontSize: 18, color: colors.heading },
  squares: {
    width: 25,
    minHeight: 7,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  square: { width: 7, height: 7, borderRadius: 2 },
  over: { fontSize: 10, fontWeight: '700', color: colors.link },
  panel: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  panelHead: {
    paddingLeft: 14,
    paddingRight: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  panelTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  panelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#EEF0EE',
    color: '#4C545B',
    fontSize: fontSize.small,
    fontWeight: '700',
  },
  panelClose: {
    marginLeft: 'auto',
    height: 44,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  panelCloseText: { fontSize: fontSize.body, fontWeight: '700', color: colors.heading },
  row: {
    minHeight: 56,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tile: {
    width: 28,
    height: 28,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontSize: 16, fontWeight: '500', color: colors.heading },
  rowSub: { fontSize: fontSize.small, color: '#5A6168' },
  rowQty: { fontSize: 17, fontWeight: '600', color: colors.heading },
});
