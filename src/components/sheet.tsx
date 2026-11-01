import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, fonts, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
  children: ReactNode;
};

/** 아래에서 올라오는 시트: 제목, 내용, 취소/저장 버튼 */
export function Sheet({ visible, title, onClose, onSave, saveLabel = '저장', children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="닫기" onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {children}
          <View style={styles.buttons}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.button, styles.cancel]}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onSave}
              style={[styles.button, styles.save]}>
              <Text style={styles.saveText}>{saveLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(22,25,28,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.heading,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  cancelText: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.text,
  },
  save: {
    backgroundColor: colors.toast,
  },
  saveText: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.surface,
  },
});
