import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge } from '@/components/badge';
import { FoldCard, FoldEmpty } from '@/components/fold-card';
import { Icon } from '@/components/icon';
import { usePlaceLook } from '@/components/place-look';
import { Screen } from '@/components/screen';
import { consBadge, consDays, inboxPlan, inShop, runningOut } from '@/domain';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, fonts, radius, spacing } from '@/theme';

const INBOX_TINT = '#FFE680';
const BUY = { tint: '#DCD7FF', color: '#3B3480' };
const RECS = { tint: '#E4E6EC', color: colors.link };

export default function ShoppingScreen() {
  const items = useHome((s) => s.items);
  const places = useHome((s) => s.places);
  const look = usePlaceLook();
  const shop = useHome((s) => s.shop);
  const inbox = useHome((s) => s.inbox);
  const today = useHome((s) => s.today);
  const actions = useHome.getState();

  const [inboxOpen, setInboxOpen] = useState(false);
  // 홈의 '장본 것 정리'에서 오면 정리할 것을 펼친 채로 연다
  const { inbox: openInbox } = useLocalSearchParams<{ inbox?: string }>();
  if (openInbox === '1' && !inboxOpen) setInboxOpen(true);
  useEffect(() => {
    // 다음에 홈에서 다시 눌러도 열리도록 표시를 지운다
    if (openInbox === '1') router.setParams({ inbox: undefined });
  }, [openInbox]);
  const [listOpen, setListOpen] = useState(true);
  const [recsOpen, setRecsOpen] = useState(true);
  const [newText, setNewText] = useState('');

  const showInbox = inboxOpen && inbox.length > 0;
  const checked = shop.filter((s) => s.checked).length;
  // 체크해도 자리를 지켜야 뭐가 남았는지 한눈에 보인다 (넣은 순서 그대로)
  const list = shop;
  const rules = useHome((s) => s.rules);
  const autoRecommend = useHome((s) => s.prefs.autoRecommend);
  const recs = autoRecommend ? runningOut(items, rules).filter((it) => !inShop(shop, it.name)) : [];

  const addNew = () => {
    const name = newText.trim();
    if (!name) return;
    actions.addToShop(name);
    setNewText('');
  };

  const buyers = [...new Set(inbox.map((x) => x.by))];
  const bannerSub =
    inbox.map((x) => x.name).join(', ') +
    (buyers.length === 1
      ? ` · ${buyers[0] === '나' ? '내가 사 왔어요' : `${buyers[0]}이 사 왔어요`}`
      : '');

  const footer = showInbox ? null : (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: checked === 0 }}
      disabled={checked === 0}
      onPress={actions.completeShop}
      style={[styles.complete, checked === 0 && { backgroundColor: colors.disabled }]}>
      <Text style={styles.completeText}>
        {checked === 0 ? '산 것을 체크해 주세요' : `장보기 완료 · ${checked}개 정리할 것으로`}
      </Text>
    </Pressable>
  );

  return (
    <Screen title="장보기" footer={footer}>
      {inbox.length > 0 && !showInbox && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`장본 것 ${inbox.length}개 정리 펼치기`}
          onPress={() => setInboxOpen(true)}
          style={styles.banner}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>장본 것 {inbox.length}개 정리하기</Text>
            <Text style={styles.bannerSub} numberOfLines={1}>
              {bannerSub}
            </Text>
          </View>
          <Text style={styles.bannerBtn}>정리 ›</Text>
        </Pressable>
      )}

      {showInbox && (
        <FoldCard
          title="장본 것 정리"
          count={inbox.length}
          tint={INBOX_TINT}
          color="#3F3A1E"
          open
          onToggle={() => setInboxOpen(false)}>
          {inbox.map((x) => {
            const plan = inboxPlan(items, x, places);
            const planPlace = look(plan.place).name;
            return (
              <View key={x.id} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {x.name}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {x.by} · 그대로 넣으면 {planPlace} 1{plan.unit}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${x.name} 그대로 ${planPlace}에 넣기`}
                  onPress={() => actions.storeInbox(x.id)}
                  style={styles.outlineBtn}>
                  <Text style={styles.outlineText}>그대로</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${x.name} 정리하기`}
                  onPress={() => router.push({ pathname: '/add', params: { inboxId: x.id } })}
                  style={styles.darkBtn}>
                  <Text style={styles.darkText}>정리</Text>
                </Pressable>
              </View>
            );
          })}
        </FoldCard>
      )}

      <FoldCard
        title="살 것"
        icon="shopping"
        note={`${checked} / ${shop.length} 담음`}
        tint={BUY.tint}
        color={BUY.color}
        open={listOpen && !showInbox}
        onToggle={() => {
          if (showInbox) {
            setInboxOpen(false);
            setListOpen(true);
          } else setListOpen((o) => !o);
        }}>
        <View style={styles.addRow}>
          <TextInput
            value={newText}
            onChangeText={setNewText}
            onSubmitEditing={addNew}
            placeholder="살 것 추가"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="살 것 추가"
            returnKeyType="done"
            submitBehavior="submit"
            style={styles.addInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="목록에 추가"
            onPress={addNew}
            style={styles.addBtn}>
            <Icon name="plus" color={colors.surface} size={18} strokeWidth={2.4} />
          </Pressable>
        </View>
        {list.map((x) => (
          <View key={x.id} style={styles.row}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: x.checked }}
              accessibilityLabel={x.name}
              onPress={() => actions.toggleShop(x.id)}
              style={styles.checkHit}>
              <View style={[styles.checkBox, x.checked && styles.checkBoxOn]}>
                {x.checked && (
                  <Icon name="check" color={colors.surface} size={16} strokeWidth={2.6} />
                )}
              </View>
            </Pressable>
            <View style={styles.rowText}>
              <Text
                style={[
                  styles.shopName,
                  x.checked && { textDecorationLine: 'line-through', color: colors.textSecondary },
                ]}>
                {x.name}
              </Text>
              <Text style={styles.rowSub}>
                {look(x.place).name} · {x.by}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${x.name} 목록에서 빼기`}
              onPress={() => actions.removeShop(x.id)}
              style={styles.removeBtn}>
              <Icon name="close" color={colors.borderStrong} size={18} />
            </Pressable>
          </View>
        ))}
        {shop.length === 0 && <FoldEmpty text="목록이 비었어요. 위 칸에 살 것을 적어 보세요" />}
      </FoldCard>

      {recs.length > 0 && (
        <FoldCard
          title="곧 떨어져서 추천해요"
          note={`${recs.length}가지`}
          tint={RECS.tint}
          color={RECS.color}
          open={recsOpen}
          onToggle={() => setRecsOpen((o) => !o)}>
          {recs.map((it) => {
            const b = consBadge(it, today);
            return (
              <View key={it.id} style={[styles.row, styles.recRow]}>
                <Badge text={b.text} tone={b.tone} />
                <View style={styles.rowText}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {it.name}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {it.qty}
                    {it.unit} 남음 · 약 {consDays(it)}일
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${it.name} 살 것에 담기`}
                  onPress={() => actions.addToShop(it.name, it.place)}
                  style={styles.pickBtn}>
                  <Icon name="plus" color={colors.heading} size={15} strokeWidth={2.4} />
                  <Text style={styles.pickText}>담기</Text>
                </Pressable>
              </View>
            );
          })}
        </FoldCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 14,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    borderRadius: 22,
    backgroundColor: INBOX_TINT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerText: { flex: 1, gap: 2 },
  bannerTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.heading },
  bannerSub: { fontSize: 13, color: '#4F4A2E' },
  bannerBtn: {
    height: 38,
    lineHeight: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.toast,
    color: colors.surface,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  row: {
    minHeight: 56,
    paddingVertical: 6,
    paddingLeft: 14,
    paddingRight: spacing.xs,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recRow: { paddingVertical: 10, paddingRight: spacing.md, gap: 10 },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: fontSize.small, color: colors.textSecondary },
  shopName: { fontSize: fontSize.bodyLarge, fontWeight: '500', color: colors.text },
  outlineBtn: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
  },
  outlineText: { fontSize: 13, fontWeight: '700', color: colors.text },
  darkBtn: {
    height: 36,
    paddingHorizontal: 14,
    marginRight: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.toast,
    justifyContent: 'center',
  },
  darkText: { fontSize: 13, fontWeight: '700', color: colors.surface },
  addRow: {
    height: 52,
    paddingLeft: 14,
    paddingRight: 6,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addInput: { flex: 1, height: 44, fontSize: fontSize.bodyLarge, color: colors.text },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.toast,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkHit: {
    width: 44,
    height: 44,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: spacing.sm,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { borderColor: colors.toast, backgroundColor: colors.toast },
  removeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pickBtn: {
    width: 76,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pickText: { fontSize: 13, fontWeight: '700', color: colors.heading },
  complete: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.toast,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeText: { fontSize: 16, fontWeight: '700', color: colors.surface },
});
