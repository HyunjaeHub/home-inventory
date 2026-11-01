import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { colors, fonts, spacing } from '@/theme';

type Props = {
  title: string;
  /** 제목 옆 작은 글씨 (예: 요일) */
  subtitle?: string;
  /** 왼쪽 뒤로 버튼 표시 */
  back?: boolean;
  /** 제목 오른쪽 버튼들 */
  actions?: ReactNode;
  /** 제목과 스크롤 영역 사이에 고정되는 영역 (필터 등) */
  fixed?: ReactNode;
  children?: ReactNode;
};

/** 화면 공통 틀: 바탕색 + Jua 제목 + 스크롤 영역 */
export function Screen({ title, subtitle, back, actions, fixed, children }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={styles.back}>
            <Icon name="back" color={colors.text} size={24} />
          </Pressable>
        )}
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
          {subtitle ? <Text style={styles.subtitle}> {subtitle}</Text> : null}
        </Text>
        {actions}
      </View>
      {fixed}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 56,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  back: {
    width: 44,
    height: 44,
    marginLeft: -12,
    marginRight: -spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 28 * 1.25,
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
