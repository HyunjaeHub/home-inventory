import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { colors, fontSize, fonts, radius, spacing } from '@/theme';

type Props = {
  label: string;
  /** 화면에 보일 값 (예: '1.5팩') */
  valueText: string;
  onDec: () => void;
  onInc: () => void;
  canDec?: boolean;
  canInc?: boolean;
};

/** - 값 + 형태의 수량 조절 */
export function Stepper({ label, valueText, onDec, onInc, canDec = true, canInc = true }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.box}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} 줄이기`}
          disabled={!canDec}
          onPress={onDec}
          style={[styles.btn, !canDec && styles.off]}>
          <Icon name="minus" color={colors.text} size={18} />
        </Pressable>
        <Text style={styles.value} accessibilityLabel={`${label} ${valueText}`}>
          {valueText}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} 늘리기`}
          disabled={!canInc}
          onPress={onInc}
          style={[styles.btn, !canInc && styles.off]}>
          <Icon name="plus" color={colors.text} size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.text,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: {
    opacity: 0.3,
  },
  value: {
    minWidth: 72,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.heading,
  },
});
