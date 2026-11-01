import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, fontSize, radius, spacing } from '@/theme';

/** 로그인·가구 화면 공통 틀: 큰 제목 + 설명 + 내용 */
export function AuthLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.intro}>{intro}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.disabled}
        style={styles.input}
        {...input}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={[styles.primary, off && styles.primaryOff]}>
      {busy ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Text style={styles.primaryText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

export function ErrorText({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <Text style={styles.error} accessibilityLiveRegion="polite">
      {text}
    </Text>
  );
}

/** 흰 카드 묶음 */
export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    paddingTop: 48,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.title,
    lineHeight: fontSize.title * 1.25,
    color: colors.heading,
  },
  intro: {
    marginTop: -spacing.sm,
    fontSize: fontSize.bodyLarge,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  field: { gap: 6 },
  label: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.text,
  },
  primary: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.toast,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryOff: { backgroundColor: colors.disabled },
  primaryText: { fontSize: 16, fontWeight: '700', color: colors.surface },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontSize: fontSize.body, fontWeight: '700', color: colors.link },
  error: { fontSize: fontSize.body, lineHeight: 20, color: colors.danger },
});
