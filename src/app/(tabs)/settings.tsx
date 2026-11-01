import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Share, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screen';
import { OptionSheet } from '@/features/settings/option-sheet';
import { SettingGroup, SettingRow, SettingSwitch, TILES } from '@/features/settings/setting-row';
import { useAuth } from '@/stores/auth-store';
import { useHome } from '@/stores/home-store';
import { showToast } from '@/stores/toast-store';
import { colors, fontSize, spacing } from '@/theme';

type OptionKey = 'urgent' | 'chill' | 'freeze' | 'time' | 'log';

const URGENT = [1, 3, 5, 7].map((v) => ({ value: v, label: `${v}일 전부터` }));
const CHILL = [1, 2, 3].map((v) => ({ value: v, label: `${v}일 안에` }));
const FREEZE = [
  { value: 14, label: '기한 +2주' },
  { value: 30, label: '기한 +1달' },
  { value: 60, label: '기한 +2달' },
];
const TIMES = ['오전 8시', '오전 9시', '저녁 7시'].map((v) => ({ value: v, label: v }));
const LOG = [3, 6, 12].map((v) => ({ value: v, label: `${v}개월` }));

const labelOf = <T,>(opts: { value: T; label: string }[], v: T) =>
  opts.find((o) => o.value === v)?.label ?? String(v);

/** 서버 연동 전이라 아직 열 수 없는 항목 */
const later = (what: string) => showToast(`${what}은(는) 서버를 연결한 뒤에 열려요`);

export default function SettingsScreen() {
  const rules = useHome((s) => s.rules);
  const prefs = useHome((s) => s.prefs);
  const items = useHome((s) => s.items);
  const tasks = useHome((s) => s.tasks);
  const places = useHome((s) => s.places);
  const actions = useHome.getState();
  const [open, setOpen] = useState<OptionKey | null>(null);
  const household = useAuth((s) => s.household);
  const members = useAuth((s) => s.members);
  const myId = useAuth((s) => s.session?.user.id);
  const email = useAuth((s) => s.session?.user.email);

  const shareInvite = () => {
    if (!household) return;
    Share.share({
      message: `집 재고관리에 같이 들어와요. 가입한 뒤 "초대 코드를 받았어요"에서 이 코드를 넣어 주세요: ${household.inviteCode}`,
    });
  };

  const confirmSignOut = () =>
    Alert.alert('로그아웃', '이 폰에서 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => useAuth.getState().signOut() },
    ]);

  const confirmClear = () =>
    Alert.alert('모든 재고 지우기', '재고, 살 것, 정리할 것, 다음 한끼가 모두 지워져요.', [
      { text: '취소', style: 'cancel' },
      { text: '지우기', style: 'destructive', onPress: actions.clearAll },
    ]);

  return (
    <Screen title="설정">
      <SettingGroup title="함께 쓰는 사람">
        {household ? (
          <>
            {members.map((m) => {
              const isMe = m.userId === myId;
              return (
                <SettingRow
                  key={m.userId}
                  icon="user"
                  tile={isMe ? TILES.green : TILES.blue}
                  label={m.displayName}
                  sub={isMe ? '기록에 내 이름으로 남아요' : '함께 쓰는 중'}
                  value={isMe ? '나' : undefined}
                  onPress={() => later('이름 바꾸기')}
                />
              );
            })}
            <SettingRow
              icon="link"
              tile={TILES.gray}
              label="초대 코드 보내기"
              sub={members.length < 2 ? '함께 쓸 사람이 이 코드로 합류해요' : undefined}
              value={household.inviteCode}
              onPress={shareInvite}
            />
          </>
        ) : (
          <SettingRow
            icon="user"
            tile={TILES.green}
            label="나"
            sub="서버 설정(.env)이 없어 이 폰에서만 써요"
            value="이 폰"
            onPress={() => later('함께 쓰는 사람')}
          />
        )}
      </SettingGroup>

      <SettingGroup title="보관과 기한">
        <SettingRow
          icon="fridge"
          tile={TILES.teal}
          label="보관 장소"
          sub={places.map((p) => p.name).join(' · ')}
          value={`${places.length}곳`}
          onPress={() => router.push('/places')}
        />
        <SettingRow
          icon="clock"
          tile={TILES.sand}
          label="기한 임박 기준"
          sub="홈의 확인할 것·먼저 먹을 것에 띄워요"
          value={labelOf(URGENT, rules.urgentDays)}
          onPress={() => setOpen('urgent')}
        />
        <SettingRow
          icon="fridge"
          tile={TILES.teal}
          label="냉장에 둔 소분 팩"
          sub="해동하거나 냉장으로 꺼낸 팩"
          value={labelOf(CHILL, rules.chillDays)}
          onPress={() => setOpen('chill')}
        />
        <SettingRow
          icon="freezer"
          tile={TILES.blue}
          label="냉동으로 옮긴 팩"
          value={labelOf(FREEZE, rules.freezeMinDays)}
          onPress={() => setOpen('freeze')}
        />
      </SettingGroup>

      <SettingGroup title="알림">
        <SettingSwitch
          icon="bell"
          tile={TILES.sand}
          label="기한 알림"
          sub={`기한 ${rules.urgentDays}일 전부터 알려 줘요`}
          value={prefs.expAlert}
          onChange={(v) => actions.setPrefs({ expAlert: v })}
        />
        <SettingSwitch
          icon="bell"
          tile={TILES.purple}
          label="생활용품 떨어짐 알림"
          sub="떨어지기 3일 전"
          value={prefs.lowAlert}
          onChange={(v) => actions.setPrefs({ lowAlert: v })}
        />
        <SettingRow
          icon="clock"
          tile={TILES.gray}
          label="알림 받는 시간"
          value={prefs.alertTime}
          onPress={() => setOpen('time')}
        />
      </SettingGroup>

      <SettingGroup title="품목">
        <SettingRow
          icon="tag"
          tile={TILES.gray}
          label="기억한 단위"
          sub="이름 쓰면 자동으로 채우는 단위"
          value={`${items.length}개 품목`}
          onPress={() => later('기억한 단위 목록')}
        />
      </SettingGroup>

      <SettingGroup title="장보기">
        <SettingSwitch
          icon="shopping"
          tile={TILES.blue}
          label="장보기 자동 추천"
          sub="곧 떨어지는 생활용품을 추천해요"
          value={prefs.autoRecommend}
          onChange={(v) => actions.setPrefs({ autoRecommend: v })}
        />
        <SettingSwitch
          icon="check"
          tile={TILES.green}
          label="장본 건 정리함으로"
          sub={
            prefs.useInbox
              ? '바로 넣지 않고 집에서 소분·장소 정해요'
              : '장보기 완료하면 바로 재고에 넣어요'
          }
          value={prefs.useInbox}
          onChange={(v) => actions.setPrefs({ useInbox: v })}
        />
      </SettingGroup>

      <SettingGroup title="홈">
        <SettingRow
          icon="check"
          tile={TILES.gray}
          label="같이 할 일"
          sub={tasks.map((t) => t.text).join(' · ') || '아직 없어요'}
          value={`${tasks.length}개`}
          onPress={() => router.navigate('/')}
        />
      </SettingGroup>

      <SettingGroup title="데이터">
        <SettingRow
          icon="download"
          tile={TILES.gray}
          label="백업 파일로 내보내기"
          onPress={() => later('백업')}
        />
        <SettingRow
          icon="upload"
          tile={TILES.gray}
          label="백업 파일 가져오기"
          onPress={() => later('백업 가져오기')}
        />
        <SettingRow
          icon="clock"
          tile={TILES.gray}
          label="기록 보관 기간"
          value={labelOf(LOG, prefs.logMonths)}
          onPress={() => setOpen('log')}
        />
        <SettingRow
          icon="refresh"
          tile={TILES.gray}
          label="샘플 데이터로 되돌리기"
          sub="개발용 · 시안 데이터로 다시 채워요"
          onPress={actions.resetSample}
        />
        <SettingRow
          icon="trash"
          tile={TILES.red}
          label="모든 재고 지우기"
          danger
          onPress={confirmClear}
        />
      </SettingGroup>
      {household && (
        <SettingGroup title="계정">
          <SettingRow
            icon="user"
            tile={TILES.gray}
            label="로그아웃"
            sub={email}
            onPress={confirmSignOut}
          />
        </SettingGroup>
      )}
      <Text style={styles.foot}>
        재고 데이터는 아직 이 폰에만 저장돼요. 앱을 다시 켜면 샘플 데이터로 돌아가요.
      </Text>

      {open === 'urgent' && (
        <OptionSheet
          title="기한 임박 기준"
          note="이 날짜 안에 기한이 끝나면 먼저 먹을 것으로 띄워요"
          options={URGENT}
          value={rules.urgentDays}
          onSelect={(v) => actions.setRules({ urgentDays: v })}
          onClose={() => setOpen(null)}
        />
      )}
      {open === 'chill' && (
        <OptionSheet
          title="냉장에 둔 소분 팩"
          note="해동하거나 냉장으로 꺼낸 팩은 이 안에 먹기로 잡아요"
          options={CHILL}
          value={rules.chillDays}
          onSelect={(v) => actions.setRules({ chillDays: v })}
          onClose={() => setOpen(null)}
        />
      )}
      {open === 'freeze' && (
        <OptionSheet
          title="냉동으로 옮긴 팩"
          note="냉동실로 옮기면 기한을 최소 이만큼으로 늘려요"
          options={FREEZE}
          value={rules.freezeMinDays}
          onSelect={(v) => actions.setRules({ freezeMinDays: v })}
          onClose={() => setOpen(null)}
        />
      )}
      {open === 'time' && (
        <OptionSheet
          title="알림 받는 시간"
          options={TIMES}
          value={prefs.alertTime}
          onSelect={(v) => actions.setPrefs({ alertTime: v })}
          onClose={() => setOpen(null)}
        />
      )}
      {open === 'log' && (
        <OptionSheet
          title="기록 보관 기간"
          options={LOG}
          value={prefs.logMonths}
          onSelect={(v) => actions.setPrefs({ logMonths: v })}
          onClose={() => setOpen(null)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  foot: {
    paddingHorizontal: spacing.xs,
    fontSize: fontSize.small,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
