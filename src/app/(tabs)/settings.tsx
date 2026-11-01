import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';

export default function SettingsScreen() {
  return (
    <Screen title="설정">
      <PlaceholderCard
        title="우리 집 규칙"
        description="기한 알림 기준, 소분 팩 기한, 알림 시간 같은 규칙을 정해요."
      />
      <PlaceholderCard title="함께 쓰는 사람" description="초대 링크로 가족 폰을 연결해요." />
    </Screen>
  );
}
