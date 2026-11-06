import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import { MIN_PASSWORD, newPasswordProblem } from '@/features/auth/auth-errors';
import { useAuth } from '@/stores/auth-store';
import { showToast } from '@/stores/toast-store';
import { colors, fontSize, radius } from '@/theme';

/** 설정 › 계정 › 비밀번호 바꾸기 (이미 로그인했으니 지금 비밀번호는 묻지 않는다) */
export function PasswordSheet({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const problem = newPasswordProblem(pw, again, tried) ?? serverError;
  const pwBad = pw.length > 0 && pw.length < MIN_PASSWORD;
  const againBad = again.length > 0 && pw !== again;

  const save = async () => {
    if (busy) return;
    setTried(true);
    if (newPasswordProblem(pw, again, true)) return;
    setBusy(true);
    const err = await useAuth.getState().changePassword(pw);
    setBusy(false);
    if (err) {
      setServerError(err);
      return;
    }
    showToast('비밀번호를 바꿨어요');
    onClose();
  };

  return (
    <Sheet
      visible
      title="비밀번호 바꾸기"
      saveLabel={busy ? '바꾸는 중…' : '바꾸기'}
      onClose={onClose}
      onSave={save}>
      <Text style={styles.note}>지금 로그인한 계정의 비밀번호를 바꿔요</Text>
      <View style={styles.field}>
        <Text style={styles.label}>새 비밀번호</Text>
        <TextInput
          value={pw}
          onChangeText={(v) => {
            setPw(v);
            setServerError(null);
          }}
          placeholder={`${MIN_PASSWORD}자 이상`}
          placeholderTextColor={colors.disabled}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          accessibilityLabel="새 비밀번호"
          style={[styles.input, pwBad && styles.inputBad]}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>한 번 더</Text>
        <TextInput
          value={again}
          onChangeText={(v) => {
            setAgain(v);
            setServerError(null);
          }}
          onSubmitEditing={save}
          placeholder="같은 비밀번호"
          placeholderTextColor={colors.disabled}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          accessibilityLabel="새 비밀번호 한 번 더"
          returnKeyType="done"
          style={[styles.input, againBad && styles.inputBad]}
        />
      </View>
      {problem && (
        <Text style={styles.problem} accessibilityLiveRegion="polite">
          {problem}
        </Text>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: -8, fontSize: 13, color: colors.textSecondary },
  field: { gap: 6 },
  label: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
  },
  inputBad: { borderColor: colors.danger },
  problem: { marginTop: -6, fontSize: 13, color: colors.danger },
});
