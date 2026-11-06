import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Sheet } from '@/components/sheet';
import type { Task } from '@/domain';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, fonts, radius, spacing, tones } from '@/theme';

type Props = { task: Task; onClose: () => void };

/** 할 일을 길게 누르면 뜨는 메뉴: 고치기 / 지우기 / 취소 */
export function TaskMenu({ task, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);

  if (editing) return <TaskEditSheet task={task} onClose={onClose} />;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="닫기" onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.head}>
            <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
              {task.text}
            </Text>
            <Text style={styles.sub}>같이 할 일</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setEditing(true)}
            style={[styles.action, { backgroundColor: colors.muted }]}>
            <Icon name="edit" color={colors.text} size={20} />
            <Text style={styles.actionText}>고치기</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              useHome.getState().removeTask(task.id);
              onClose();
            }}
            style={[styles.action, { backgroundColor: tones.orange.bg }]}>
            <Icon name="trash" color={tones.orange.fg} size={20} />
            <Text style={[styles.actionText, { color: tones.orange.fg }]}>지우기</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** 할 일 글자 고치기 */
function TaskEditSheet({ task, onClose }: Props) {
  const [text, setText] = useState(task.text);
  const save = () => {
    if (useHome.getState().updateTask(task.id, text)) onClose();
  };

  return (
    <Sheet visible title="할 일 고치기" onClose={onClose} onSave={save}>
      <View style={styles.field}>
        <Text style={styles.label}>할 일</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={save}
          autoFocus
          selectTextOnFocus
          accessibilityLabel="할 일"
          returnKeyType="done"
          style={styles.input}
        />
      </View>
    </Sheet>
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
    gap: spacing.md,
  },
  head: { gap: spacing.xs, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.heading },
  sub: { fontSize: 13, color: colors.textSecondary },
  action: {
    height: 54,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionText: { fontSize: 16, fontWeight: '700', color: colors.text },
  cancel: { height: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.link },
  field: { gap: 6 },
  label: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.heading,
    fontSize: 16,
    color: colors.text,
  },
});
