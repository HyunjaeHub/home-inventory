import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { colors, fontSize, fonts, spacing } from '@/theme';

export type Tile = { icon: IconName; bg: string; fg: string };

export const TILES = {
  green: { bg: '#E2F1E9', fg: '#2E6B4F' },
  blue: { bg: '#E7EBF8', fg: '#4057A8' },
  teal: { bg: '#E1EFEE', fg: '#2F6F73' },
  sand: { bg: '#F4ECD6', fg: '#86651A' },
  purple: { bg: '#ECE9FF', fg: '#5A4BA8' },
  gray: { bg: '#EEEEF3', fg: '#4F5363' },
  red: { bg: '#FBE6DF', fg: colors.danger },
} as const;

/** 설정 묶음: 소제목 + 흰 줄 목록 */
export function SettingGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

type RowBase = {
  icon: IconName;
  tile: { bg: string; fg: string };
  label: string;
  sub?: string;
  danger?: boolean;
};

/** 눌러서 들어가거나 값을 고르는 줄 */
export function SettingRow({
  icon,
  tile,
  label,
  sub,
  value,
  danger,
  onPress,
}: RowBase & { value?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[label, sub, value].filter(Boolean).join(', ')}
      onPress={onPress}
      style={styles.row}>
      <TileIcon icon={icon} tile={tile} />
      <Label label={label} sub={sub} danger={danger} />
      {value && <Text style={styles.value}>{value}</Text>}
      <Icon name="chevronRight" color="#8A8E9C" size={18} />
    </Pressable>
  );
}

/** 켜고 끄는 줄 */
export function SettingSwitch({
  icon,
  tile,
  label,
  sub,
  value,
  onChange,
}: RowBase & { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <TileIcon icon={icon} tile={tile} />
      <Label label={label} sub={sub} />
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: '#2E8B63', false: '#C3C7CF' }}
        ios_backgroundColor="#C3C7CF"
      />
    </View>
  );
}

function TileIcon({ icon, tile }: { icon: IconName; tile: { bg: string; fg: string } }) {
  return (
    <View style={[styles.tile, { backgroundColor: tile.bg }]}>
      <Icon name={icon} color={tile.fg} size={17} />
    </View>
  );
}

function Label({ label, sub, danger }: { label: string; sub?: string; danger?: boolean }) {
  return (
    <View style={styles.label}>
      <Text style={[styles.labelText, danger && { color: colors.danger }]}>{label}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  groupTitle: {
    paddingHorizontal: 2,
    fontFamily: fonts.display,
    fontSize: fontSize.sectionTitle,
    color: colors.text,
  },
  list: { gap: 1, backgroundColor: colors.border, borderRadius: 20, overflow: 'hidden' },
  row: {
    minHeight: 56,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: spacing.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tile: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, gap: 2 },
  labelText: { fontSize: fontSize.bodyLarge, fontWeight: '500', color: colors.text },
  sub: { fontSize: fontSize.small, color: colors.textSecondary },
  value: { fontSize: fontSize.body, color: colors.textSecondary },
});
