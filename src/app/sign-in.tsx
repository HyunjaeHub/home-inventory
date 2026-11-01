import { useState } from 'react';

import {
  AuthLayout,
  Card,
  ErrorText,
  Field,
  LinkButton,
  PrimaryButton,
} from '@/features/auth/auth-ui';
import { signUpProblem } from '@/features/auth/auth-errors';
import { useAuth } from '@/stores/auth-store';

/** 이메일+비밀번호 로그인 / 가입 */
export default function SignInScreen() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signUp = mode === 'signUp';

  const submit = async () => {
    const problem = signUp ? signUpProblem(email, password) : null;
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    const { signIn, signUp: register } = useAuth.getState();
    const err = signUp ? await register(email, password) : await signIn(email, password);
    // 성공하면 로그인 상태가 바뀌어 다음 화면으로 넘어간다
    setBusy(false);
    setError(err);
  };

  return (
    <AuthLayout
      title={signUp ? '가입하기' : '집 재고관리'}
      intro={
        signUp
          ? '이메일과 비밀번호로 가입해요. 가입한 뒤 우리 집을 만들거나 초대 코드로 합류해요.'
          : '함께 쓰는 집 재고를 보려면 로그인해 주세요.'
      }>
      <Card>
        <Field
          label="이메일"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <Field
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          placeholder={signUp ? '6자 이상' : ''}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={signUp ? 'new-password' : 'current-password'}
          textContentType={signUp ? 'newPassword' : 'password'}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <ErrorText text={error} />
        <PrimaryButton
          label={signUp ? '가입하기' : '로그인'}
          onPress={submit}
          busy={busy}
          disabled={!email.trim() || !password}
        />
      </Card>
      <LinkButton
        label={signUp ? '이미 계정이 있어요 · 로그인' : '처음이에요 · 가입하기'}
        onPress={() => {
          setMode(signUp ? 'signIn' : 'signUp');
          setError(null);
        }}
      />
    </AuthLayout>
  );
}
