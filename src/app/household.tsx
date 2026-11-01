import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import {
  AuthLayout,
  Card,
  ErrorText,
  Field,
  LinkButton,
  PrimaryButton,
} from '@/features/auth/auth-ui';
import { useAuth } from '@/stores/auth-store';
import { colors, fontSize } from '@/theme';

/** 로그인 후 가구가 없을 때: 우리 집 만들기 또는 초대 코드로 합류 */
export default function HouseholdScreen() {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const join = mode === 'join';

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { createHousehold, joinHousehold } = useAuth.getState();
    const err = join ? await joinHousehold(code, name) : await createHousehold(name);
    setBusy(false);
    setError(err);
  };

  return (
    <AuthLayout
      title={join ? '초대 코드로 합류' : '우리 집 만들기'}
      intro={
        join
          ? '먼저 우리 집을 만든 사람의 설정 화면에 있는 초대 코드를 넣어 주세요.'
          : '처음 쓰는 사람이 우리 집을 만들어요. 만든 뒤 설정에서 초대 코드를 함께 쓸 사람에게 보내요.'
      }>
      <Card>
        <Field
          label="내 이름"
          value={name}
          onChangeText={setName}
          placeholder="이름이나 별명"
          maxLength={10}
          returnKeyType={join ? 'next' : 'done'}
        />
        <Text style={styles.hint}>재고 기록에 “누가 샀어요”로 보여요</Text>
        {join && (
          <Field
            label="초대 코드"
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            placeholder="8자리"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        )}
        <ErrorText text={error} />
        <PrimaryButton
          label={join ? '합류하기' : '만들기'}
          onPress={submit}
          busy={busy}
          disabled={!name.trim() || (join && code.trim().length < 8)}
        />
      </Card>
      <LinkButton
        label={join ? '우리 집을 새로 만들래요' : '초대 코드를 받았어요'}
        onPress={() => {
          setMode(join ? 'create' : 'join');
          setError(null);
        }}
      />
      <LinkButton label="로그아웃" onPress={() => useAuth.getState().signOut()} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: -6, fontSize: fontSize.small, color: colors.textSecondary },
});
