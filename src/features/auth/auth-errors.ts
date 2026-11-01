/** Supabase 인증·가구 함수 오류를 화면에 보일 문구로 바꾼다 */
export function authErrorText(err: { code?: string; message?: string } | null | undefined): string {
  if (!err) return '알 수 없는 문제가 생겼어요. 다시 해 주세요';
  switch (err.code) {
    case 'invalid_credentials':
      return '이메일이나 비밀번호가 맞지 않아요';
    case 'user_already_exists':
    case 'email_exists':
      return '이미 가입한 이메일이에요. 로그인해 주세요';
    case 'weak_password':
      return '비밀번호가 너무 짧거나 쉬워요';
    case 'email_address_invalid':
    case 'validation_failed':
      return '이메일 형식을 확인해 주세요';
    case 'email_not_confirmed':
      return '이메일 인증을 아직 마치지 않았어요';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return '요청이 너무 많아요. 잠시 뒤에 다시 해 주세요';
  }
  const msg = err.message ?? '';
  // DB 함수(create_household 등)가 raise한 한국어 문구는 그대로 보여 준다
  if (/[가-힣]/.test(msg)) return msg;
  if (/network|fetch/i.test(msg)) return '인터넷 연결을 확인해 주세요';
  return '문제가 생겼어요. 다시 해 주세요';
}

/** 가입 전 입력 확인. 문제가 없으면 null */
export function signUpProblem(email: string, password: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return '이메일 형식을 확인해 주세요';
  if (password.length < 6) return '비밀번호는 6자 이상이어야 해요';
  return null;
}
