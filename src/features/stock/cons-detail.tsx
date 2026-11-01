import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Icon } from '@/components/icon';
import { InfoList, InfoRow } from '@/components/info-list';
import { Screen } from '@/components/screen';
import { addDays, consBadge, consDays, monthDay, type ConsumableItem } from '@/domain';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, fonts, radius, spacing } from '@/theme';

export function ConsDetail({ item }: { item: ConsumableItem }) {
  const today = useHome((s) => s.today);
  const actions = useHome.getState();
  const days = consDays(item);
  const b = consBadge(item, today);
  const empty = item.qty <= 0;
  const barWidth = `${Math.max(2, Math.min(100, Math.round((days / 60) * 100)))}%` as const;

  return (
    <Screen
      title={item.name}
      back
      actions={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="살 것에 담기"
          onPress={() => actions.addToShop(item.name, item.place)}
          style={styles.headerBtn}>
          <Icon name="shopping" color={colors.text} size={22} />
        </Pressable>
      }>
      <View style={styles.card}>
        <View style={styles.qtyRow}>
          <Text style={styles.qty}>
            {item.qty}
            {item.unit}
          </Text>
          <Text style={styles.qtySub}>남음 · {item.place} · 소모품</Text>
        </View>
        <View style={styles.badgeRow}>
          <Badge text={!empty && days <= 14 ? `${b.text} 사기` : b.text} tone={b.tone} />
          <Text style={styles.days}>{empty ? '지금 사야 해요' : `약 ${days}일 뒤 다 써요`}</Text>
        </View>
        <View style={styles.barWrap}>
          <View style={styles.barTrack}>
            <View style={[styles.bar, { width: barWidth }]} />
          </View>
          <View style={styles.barLabels}>
            <Text style={styles.barLabel}>오늘</Text>
            <Text style={styles.barLabel}>
              {empty ? '소진' : `${monthDay(addDays(today, days))} 소진 예상`}
            </Text>
          </View>
        </View>
        <Text style={styles.barLabel}>최근 사용 간격 평균 {item.every}일로 계산했어요</Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: empty }}
          disabled={empty}
          onPress={() => actions.useOne(item.id)}
          style={[styles.useBtn, empty && { backgroundColor: colors.disabled }]}>
          <Text style={styles.useText}>1개 썼어요</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => actions.buyOne(item.id)}
          style={styles.buyBtn}>
          <Text style={styles.buyText}>1개 샀어요</Text>
        </Pressable>
      </View>

      <InfoList title="사용 기록">
        {item.log.slice(0, 5).map((g, i) => (
          <InfoRow key={i} label={`${g.text} · ${g.by}`} value={monthDay(g.date)} />
        ))}
      </InfoList>
      <InfoList title="설정">
        <InfoRow label="1개로 쓰는 기간" value={`자동 (${item.every}일)`} />
        <InfoRow label="장보기 자동 추천" value="떨어지기 3일 전" />
        <InfoRow label="보관 장소" value={item.place} />
      </InfoList>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.consCard,
    gap: 14,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  qty: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.heading,
  },
  qtySub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  days: {
    fontSize: fontSize.body,
    color: colors.text,
  },
  barWrap: {
    gap: 6,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(75,63,176,0.18)',
    overflow: 'hidden',
  },
  bar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.consBar,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  useBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.toast,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useText: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.surface,
  },
  buyBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.text,
  },
});
