import { authErrorText, isNetworkError, signUpProblem } from '@/features/auth/auth-errors';

describe('authErrorText', () => {
  it('Supabase 오류 코드를 한국어 문구로', () => {
    expect(authErrorText({ code: 'invalid_credentials' })).toBe(
      '이메일이나 비밀번호가 맞지 않아요'
    );
    expect(authErrorText({ code: 'user_already_exists' })).toContain('이미 가입한');
  });

  it('DB 함수가 낸 한국어 문구는 그대로', () => {
    expect(authErrorText({ message: '초대 코드를 찾을 수 없어요' })).toBe(
      '초대 코드를 찾을 수 없어요'
    );
  });

  it('네트워크 오류와 알 수 없는 오류', () => {
    expect(authErrorText({ message: 'TypeError: Network request failed' })).toBe(
      '인터넷 연결을 확인해 주세요'
    );
    expect(authErrorText({ message: 'boom' })).toBe('문제가 생겼어요. 다시 해 주세요');
  });
});

describe('isNetworkError', () => {
  it('인터넷 문제와 서버 거절을 구분', () => {
    expect(isNetworkError(new TypeError('Network request failed'))).toBe(true);
    expect(isNetworkError({ message: 'TypeError: Failed to fetch' })).toBe(true);
    expect(isNetworkError({ code: '42501', message: 'permission denied for table items' })).toBe(
      false
    );
    expect(isNetworkError(null)).toBe(false);
  });
});

describe('signUpProblem', () => {
  it('이메일 형식과 비밀번호 길이를 확인', () => {
    expect(signUpProblem('a@b', '123456')).toBe('이메일 형식을 확인해 주세요');
    expect(signUpProblem('a@b.com', '12345')).toBe('비밀번호는 6자 이상이어야 해요');
    expect(signUpProblem(' a@b.com ', '123456')).toBeNull();
  });
});
