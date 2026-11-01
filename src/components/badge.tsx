import { StyleSheet, Text } from 'react-native';

import type { Tone } from '@/domain';
import { fontSize, tones } from '@/theme';

/** 기한·소진 배지 (예: D-2, 이번 주, 18일째) */
export function Badge({ text, tone }: { text: string; tone: Tone }) {
  const t = tones[tone];
  return <Text style={[styles.badge, { backgroundColor: t.bg, color: t.fg }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    fontSize: fontSize.small,
    fontWeight: '700',
  },
});
