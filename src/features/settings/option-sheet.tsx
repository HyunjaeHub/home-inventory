import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Sheet } from '@/components/sheet';
import { colors, fontSize, radius, spacing } from '@/theme';

type Props<T> = {
  title: string;
  note?: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/** 여러 값 중 하나 고르기 */
export function OptionSheet<T extends string | number>({
  title,
  note,
  options,
  value,
  onSelect,
  onClose,
}: Props<T>) {
  const [draft, setDraft] = useState(value);
  return (
    <Sheet
      visible
      title={title}
      onClose={onClose}
      onSave={() => {
        onSelect(draft);
        onClose();
      }}>
      {note && <Text style={styles.note}>{note}</Text>}
      <View style={styles.list}>
        {options.map((o) => {
          const on = o.value === draft;
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setDraft(o.value)}
              style={[styles.option, on && styles.optionOn]}>
              <Text style={[styles.optionText, on && styles.optionTextOn]}>{o.label}</Text>
              {on && <Icon name="check" color={colors.heading} size={18} />}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: fontSize.body, color: colors.textSecondary },
  list: { gap: spacing.xs },
  option: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionOn: { backgroundColor: colors.muted },
  optionText: { fontSize: fontSize.bodyLarge, color: colors.text },
  optionTextOn: { fontWeight: '700', color: colors.heading },
});
