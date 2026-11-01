import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, fonts, radius, spacing } from '@/theme';

type Props = {
  title: string;
  description: string;
};

/** 아직 구현 전인 화면 영역을 표시하는 카드 */
export function PlaceholderCard({ title, description }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.sectionTitle,
    color: colors.text,
  },
  description: {
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
    color: colors.textSecondary,
  },
});
