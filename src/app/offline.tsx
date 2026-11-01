import { useState } from 'react';

import { AuthLayout, LinkButton, PrimaryButton } from '@/features/auth/auth-ui';
import { useAuth } from '@/stores/auth-store';

/** 서버에 닿지 못했고 폰에 저장해 둔 데이터도 없을 때 */
export default function OfflineScreen() {
  const [busy, setBusy] = useState(false);

  const retry = async () => {
    setBusy(true);
    await useAuth.getState().loadHousehold();
    setBusy(false);
  };

  return (
    <AuthLayout
      title="연결할 수 없어요"
      intro="인터넷 연결을 확인한 뒤 다시 시도해 주세요. 한 번 열고 나면 다음부터는 인터넷이 없어도 마지막 데이터를 볼 수 있어요.">
      <PrimaryButton label="다시 시도" onPress={retry} busy={busy} />
      <LinkButton label="로그아웃" onPress={() => useAuth.getState().signOut()} />
    </AuthLayout>
  );
}
