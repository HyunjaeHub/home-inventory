import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSize, fonts, spacing } from '@/theme';

type Props = {
  title: string;
  /** 제목 옆 작은 글씨 (예: 요일) */
  subtitle?: string;
  children?: ReactNode;
};

/** 탭 화면 공통 틀: 바탕색 + Jua 제목 + 스크롤 영역 */
export function Screen({ title, subtitle, children }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {title}
          {subtitle ? <Text style={styles.subtitle}> {subtitle}</Text> : null}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: 6,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.title,
    lineHeight: fontSize.title * 1.2,
    color: colors.heading,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textMuted,
  },
  content: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: 10,
  },
});
