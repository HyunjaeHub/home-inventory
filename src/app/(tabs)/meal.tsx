import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/badge';
import { FoldCard, FoldEmpty } from '@/components/fold-card';
import { Icon, placeIcon } from '@/components/icon';
import { Screen } from '@/components/screen';
import type { Place } from '@/domain';
import { MealPicker } from '@/features/meal/meal-picker';
import { mealRows, mealSuggestions } from '@/features/meal/meal-view';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, placeColors, radius, spacing } from '@/theme';

const MEAL = { tint: '#BFEFD9', color: '#1D5A41' };
const SUGG = { tint: '#E4E6EC', color: colors.mutedText };

export default function MealScreen() {
  const items = useHome((s) => s.items);
  const meal = useHome((s) => s.meal);
  const today = useHome((s) => s.today);
  const actions = useHome.getState();
  const [mealOpen, setMealOpen] = useState(true);
  const [suggOpen, setSuggOpen] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const rows = mealRows(items, meal, today);
  const rules = useHome((s) => s.rules);
  const sugg = mealSuggestions(items, meal, today, rules);
  const checked = rows.filter((r) => r.checked).length;

  const footer = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: checked === 0 }}
      disabled={checked === 0}
      onPress={actions.completeMeal}
      style={[styles.complete, checked === 0 && { backgroundColor: colors.disabled }]}>
      <Text style={styles.completeText}>
        {checked === 0 ? '먹은 걸 체크해 주세요' : `해치우기 완료 · ${checked}가지 재고에서 빼기`}
      </Text>
    </Pressable>
  );

  return (
    <Screen title="다음 한끼" footer={footer}>
      <FoldCard
        title="담은 재료"
        count={rows.length}
        note={`${checked}/${rows.length} 체크`}
        tint={MEAL.tint}
        color={MEAL.color}
        open={mealOpen}
        onToggle={() => setMealOpen((o) => !o)}>
        {rows.map((r) => (
          <View key={r.id} style={styles.row}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: r.checked }}
              accessibilityLabel={`${r.name} 먹음`}
              onPress={() => actions.toggleMeal(r.id)}
              style={styles.checkHit}>
              <View style={[styles.checkBox, r.checked && styles.checkBoxOn]}>
                {r.checked && (
                  <Icon name="check" color={colors.surface} size={16} strokeWidth={2.6} />
                )}
              </View>
            </Pressable>
            <View style={styles.rowText}>
              <Text
                numberOfLines={1}
                style={[
                  styles.name,
                  r.checked && { textDecorationLine: 'line-through', color: colors.textSecondary },
                ]}>
                {r.name}
              </Text>
              <PlaceLine place={r.place} rest={r.rest} />
            </View>
            <View style={styles.amountBox}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${r.name} 양 줄이기`}
                onPress={() => actions.changeMeal(r.id, -1)}
                style={styles.amountBtn}>
                <Icon name="minus" color={colors.text} size={16} />
              </Pressable>
              <Text style={styles.amount}>{r.amount}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${r.name} 양 늘리기`}
                onPress={() => actions.changeMeal(r.id, 1)}
                style={styles.amountBtn}>
                <Icon name="plus" color={colors.text} size={16} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${r.name} 다음 한끼에서 빼기`}
              onPress={() => actions.removeMeal(r.id)}
              style={styles.removeBtn}>
              <Icon name="close" color={colors.borderStrong} size={18} />
            </Pressable>
          </View>
        ))}
        {rows.length === 0 && (
          <FoldEmpty text="아직 담은 게 없어요. 아래 추천이나 재료 추가로 담아 보세요" />
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => setPickerOpen(true)}
          style={styles.addRow}>
          <Icon name="plus" color={colors.mutedText} size={18} />
          <Text style={styles.addText}>재료 추가</Text>
        </Pressable>
      </FoldCard>

      {sugg.length > 0 && (
        <FoldCard
          title="먼저 먹으면 좋아요"
          count={sugg.length}
          tint={SUGG.tint}
          color={SUGG.color}
          open={suggOpen}
          onToggle={() => setSuggOpen((o) => !o)}>
          {sugg.map((s) => (
            <View key={s.itemId} style={[styles.row, styles.suggRow]}>
              <Badge text={s.badge} tone={s.tone} />
              <View style={styles.rowText}>
                <Text style={styles.name} numberOfLines={1}>
                  {s.name}
                </Text>
                <PlaceLine place={s.place} rest={s.rest} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${s.name} 한끼로`}
                onPress={() => actions.addMeal(s.itemId, s.lotId)}
                style={styles.pick}>
                <Icon name="plus" color={colors.heading} size={15} strokeWidth={2.4} />
                <Text style={styles.pickText}>한끼</Text>
              </Pressable>
            </View>
          ))}
        </FoldCard>
      )}

      <MealPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} />
    </Screen>
  );
}

function PlaceLine({ place, rest }: { place: Place; rest: string }) {
  const pc = placeColors[place];
  return (
    <View style={styles.placeLine}>
      <Icon name={placeIcon(place)} color={pc.fg} size={13} />
      <Text style={[styles.placeLabel, { color: pc.fg }]}>{place}</Text>
      <Text style={styles.rest} numberOfLines={1}>
        · {rest}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    paddingVertical: 6,
    paddingLeft: 14,
    paddingRight: spacing.xs,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggRow: { minHeight: 56, paddingVertical: 10, paddingRight: spacing.md, gap: 10 },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { borderColor: colors.toast, backgroundColor: colors.toast },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  placeLine: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  placeLabel: { fontSize: fontSize.small, fontWeight: '700' },
  rest: { flex: 1, fontSize: fontSize.small, color: colors.textSecondary },
  amountBox: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountBtn: { width: 32, height: 34, alignItems: 'center', justifyContent: 'center' },
  amount: { minWidth: 40, textAlign: 'center', fontSize: fontSize.body, fontWeight: '700' },
  removeBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  addRow: {
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addText: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.mutedText },
  pick: {
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
