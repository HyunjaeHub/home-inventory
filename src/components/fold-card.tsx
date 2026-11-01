import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { colors, fontSize, fonts, radius, spacing } from '@/theme';

type Props = {
  title: string;
  /** 제목 옆 흐린 숫자 */
  count?: number;
  /** 오른쪽 요약 (예: '1 / 4 담음') */
  note?: string;
  icon?: IconName;
  tint: string;
  color: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/** 색 바탕 묶음 카드: 머리를 누르면 접고 펼친다. 안쪽은 흰 줄 목록 */
export function FoldCard({
  title,
  count,
  note,
  icon,
  tint,
  color,
  open,
  onToggle,
  children,
}: Props) {
  return (
    <View style={[styles.card, { backgroundColor: tint }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${count != null ? ` ${count}` : ''} ${open ? '접기' : '펼치기'}`}
        onPress={onToggle}
        style={styles.head}>
        {icon && <Icon name={icon} color={color} />}
        <Text style={[styles.title, { color }]}>{title}</Text>
        {count != null && <Text style={[styles.title, styles.count, { color }]}>{count}</Text>}
        {note && <Text style={[styles.note, { color }]}>{note}</Text>}
        <View style={[styles.chevron, !note && { marginLeft: 'auto' }]}>
          <Icon name={open ? 'chevronUp' : 'chevronDown'} color={color} size={16} />
        </View>
      </Pressable>
      {open && <View style={styles.rows}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.xs,
  },
  head: {
    minHeight: 48,
    paddingVertical: 6,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 19,
  },
  count: {
    opacity: 0.5,
  },
  note: {
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
});

/** FoldCard 안의 빈 목록 안내 */
export function FoldEmpty({ text }: { text: string }) {
  return <Text style={emptyStyle.text}>{text}</Text>;
}

const emptyStyle = StyleSheet.create({
  text: {
    paddingVertical: spacing.lg,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
    color: colors.textSecondary,
  },
});
