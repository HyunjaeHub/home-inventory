import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { consBadge, consDays, inShop, runningOut } from '@/domain';
import { ExpiryStrip } from '@/features/home/expiry-strip';
import { checkLines, mealNames, weekdayOf, type CheckLine } from '@/features/home/home-summary';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, fonts, radius, spacing } from '@/theme';

function goCheck(target: CheckLine['target']) {
  if (target === 'inbox') router.navigate({ pathname: '/shopping', params: { inbox: '1' } });
  else router.navigate(target === 'stock' ? '/stock' : '/shopping');
}

export default function HomeScreen() {
  const today = useHome((s) => s.today);
  const items = useHome((s) => s.items);
  const shop = useHome((s) => s.shop);
  const inbox = useHome((s) => s.inbox);
  const meal = useHome((s) => s.meal);
  const tasks = useHome((s) => s.tasks);
  const actions = useHome.getState();
  const [newTask, setNewTask] = useState('');

  const [, m, d] = today.split('-').map(Number);
  const checks = checkLines(items, shop, inbox, today);
  const names = mealNames(items, meal, today);
  const soon = runningOut(items);
  const left = tasks.filter((t) => !t.done).length;
  const done = tasks.length - left;
  const sortedTasks = [...tasks].sort((a, b) => Number(a.done) - Number(b.done));

  const addTask = () => {
    actions.addTask(newTask);
    setNewTask('');
  };

  return (
    <Screen title={`${m}월 ${d}일`} subtitle={`${weekdayOf(today)}요일`}>
      <ExpiryStrip />

      <View style={styles.bento}>
        <View style={[styles.bentoCard, { backgroundColor: '#FFE680' }]}>
          <View style={styles.bentoHead}>
            <Text style={styles.bentoTitle}>확인할 것</Text>
            <Text style={styles.bentoCount}>{checks.length}</Text>
          </View>
          {checks.slice(0, 2).map((c) => (
            <Pressable
              key={c.text}
              accessibilityRole="link"
              onPress={() => goCheck(c.target)}
              style={styles.bentoLine}>
              <Text style={[styles.bentoText, { color: '#5C4B00' }]} numberOfLines={1}>
                {c.text} <Text style={{ opacity: 0.75 }}>({c.detail})</Text>
              </Text>
            </Pressable>
          ))}
          {checks.length === 0 && (
            <Text style={[styles.bentoText, styles.bentoEmpty, { color: '#5C4B00' }]}>
              지금은 확인할 게 없어요
            </Text>
          )}
          {checks.length > 0 && (
            <BentoLink label="보기" color="#5C4B00" onPress={() => goCheck(checks[0].target)} />
          )}
        </View>

        <View style={[styles.bentoCard, { backgroundColor: '#BFEFD9' }]}>
          <View style={styles.bentoHead}>
            <Text style={styles.bentoTitle}>다음 한끼</Text>
            <Text style={styles.bentoCount}>{names.length}</Text>
          </View>
          {names.length > 0 ? (
            <>
              <Text style={[styles.bentoText, { color: '#174C38' }]} numberOfLines={1}>
                {names.slice(0, 3).join(', ')}
              </Text>
              {names.length > 3 && (
                <Text style={[styles.bentoText, { color: '#174C38', opacity: 0.75 }]}>
                  외 {names.length - 3}가지…
                </Text>
              )}
            </>
          ) : (
            <Text style={[styles.bentoText, styles.bentoEmpty, { color: '#174C38' }]}>
              아직 정한 게 없어요
            </Text>
          )}
          <BentoLink
            label={names.length ? '열기' : '고르기'}
            color="#174C38"
            onPress={() => router.navigate('/meal')}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            같이 할 일
          </Text>
          {tasks.length > 0 && (
            <Text style={styles.cardNote}>{left ? `${left}개 남음` : '다 했어요'}</Text>
          )}
          {done > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={actions.clearDoneTasks}
              style={styles.clearBtn}>
              <Icon name="check" color="#5A6168" size={14} />
              <Text style={styles.clearText}>완료 {done}개 지우기</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.list}>
          {sortedTasks.map((t) => (
            <View key={t.id} style={styles.taskRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: t.done }}
                accessibilityLabel={t.text}
                onPress={() => actions.toggleTask(t.id)}
                style={styles.checkHit}>
                <View style={[styles.checkBox, t.done && styles.checkBoxOn]}>
                  {t.done && (
                    <Icon name="check" color={colors.surface} size={16} strokeWidth={2.6} />
                  )}
                </View>
              </Pressable>
              <Text
                style={[
                  styles.taskText,
                  t.done && { textDecorationLine: 'line-through', color: colors.textSecondary },
                ]}>
                {t.text}
              </Text>
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput
              value={newTask}
              onChangeText={setNewTask}
              onSubmitEditing={addTask}
              placeholder="할 일 추가 (예: 냉장고 칸 닦기)"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="할 일 추가"
              returnKeyType="done"
              submitBehavior="submit"
              style={styles.addInput}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="할 일 추가"
              onPress={addTask}
              style={styles.addBtn}>
              <Icon name="plus" color={colors.surface} size={18} strokeWidth={2.4} />
            </Pressable>
          </View>
        </View>
      </View>

      {soon.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.consCard }]}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle} accessibilityRole="header">
              곧 떨어지는 생활용품
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.navigate('/shopping')}
              style={[styles.clearBtn, { marginLeft: 'auto' }]}>
              <Text style={[styles.clearText, { color: '#3B3480', fontWeight: '700' }]}>
                장보기
              </Text>
              <Icon name="chevronRight" color="#3B3480" size={14} />
            </Pressable>
          </View>
          <View style={[styles.list, { backgroundColor: 'rgba(75,63,176,0.14)' }]}>
            {soon.map((it) => {
              const on = inShop(shop, it.name);
              const days = consDays(it);
              return (
                <View key={it.id} style={[styles.soonRow, { backgroundColor: colors.consCard }]}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/item/[id]', params: { id: it.id } })}
                    style={styles.soonMain}>
                    <Badge
                      text={it.qty <= 0 ? '다 씀' : `D-${days}`}
                      tone={consBadge(it, today).tone}
                    />
                    <Text style={styles.soonName} numberOfLines={1}>
                      {it.name}
                      <Text style={styles.soonLeft}>
                        {'  '}
                        {it.qty}
                        {it.unit} 남음
                      </Text>
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${it.name} ${on ? '살 것에서 빼기' : '살 것에 담기'}`}
                    onPress={() =>
                      on ? actions.removeFromShop(it.name) : actions.addToShop(it.name, it.place)
                    }
                    style={[styles.pick, on && styles.pickOn]}>
                    <Icon
                      name={on ? 'check' : 'plus'}
                      color={on ? colors.mutedText : colors.heading}
                      size={13}
                      strokeWidth={2.6}
                    />
                    <Text style={[styles.pickText, on && { color: colors.mutedText }]}>
                      {on ? '담김' : '담기'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </Screen>
  );
}

function BentoLink({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.bentoLink}>
      <Text style={[styles.bentoLinkText, { color }]}>{label}</Text>
      <Icon name="chevronRight" color={color} size={14} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bento: { flexDirection: 'row', gap: 10 },
  bentoCard: {
    flex: 1,
    minHeight: 150,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderRadius: radius.card,
    gap: spacing.xs,
  },
  bentoHead: {
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bentoTitle: { fontFamily: fonts.display, fontSize: fontSize.sectionTitle, color: colors.heading },
  bentoCount: { fontFamily: fonts.display, fontSize: 34, lineHeight: 34, color: colors.heading },
  bentoLine: { minHeight: 26, justifyContent: 'center' },
  bentoText: { fontSize: 13, lineHeight: 19 },
  bentoEmpty: { opacity: 0.8 },
  bentoLink: {
    marginTop: 'auto',
    alignSelf: 'flex-end',
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bentoLinkText: { fontSize: 13, fontWeight: '700' },
  card: {
    paddingTop: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardHead: {
    minHeight: 32,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: fontSize.sectionTitle, color: colors.text },
  cardNote: { fontSize: fontSize.small, color: colors.textMuted },
  clearBtn: {
    marginLeft: 'auto',
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clearText: { fontSize: 13, color: '#5A6168' },
  list: { marginTop: 6, gap: 1, backgroundColor: colors.divider },
  taskRow: {
    minHeight: 52,
    paddingVertical: spacing.xs,
    paddingLeft: 14,
    paddingRight: spacing.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkHit: {
    width: 44,
    height: 44,
    marginLeft: -9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: spacing.sm,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { borderColor: colors.toast, backgroundColor: colors.toast },
  taskText: { flex: 1, fontSize: fontSize.bodyLarge, fontWeight: '500', color: colors.text },
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
  soonRow: {
    minHeight: 48,
    paddingVertical: 6,
    paddingLeft: 14,
    paddingRight: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  soonMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  soonName: { flex: 1, fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  soonLeft: { fontSize: 13, fontWeight: '400', color: colors.link },
  pick: {
    width: 62,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pickOn: { borderColor: '#E6EAE7', backgroundColor: '#E6EAE7' },
  pickText: { fontSize: fontSize.small, fontWeight: '700', color: colors.heading },
});
