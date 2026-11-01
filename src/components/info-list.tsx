import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, fonts, spacing } from '@/theme';

/** '최근 기록', '설정' 같은 소제목 + 흰 줄 목록 */
export function InfoList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  title: {
    paddingHorizontal: 2,
    fontFamily: fonts.display,
    fontSize: fontSize.sectionTitle,
    color: colors.text,
  },
  list: {
    gap: 1,
    backgroundColor: colors.border,
    borderRadius: 20,
    overflow: 'hidden',
  },
  row: {
    minHeight: 48,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
  },
  label: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.text,
  },
  value: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
});
