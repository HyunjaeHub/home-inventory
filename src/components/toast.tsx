import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/stores/toast-store';
import { colors, fontSize, radius, spacing } from '@/theme';

/** 화면 아래(탭 바 위)에 잠깐 뜨는 알림. 루트 레이아웃에 한 번만 둔다 */
export function Toast() {
  const message = useToast((s) => s.message);
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { bottom: insets.bottom + 84 }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    backgroundColor: colors.toast,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: {
    color: colors.surface,
    fontSize: fontSize.body,
    fontWeight: '500',
    textAlign: 'center',
    borderRadius: radius.md,
  },
});
