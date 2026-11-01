import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, placeIcon } from '@/components/icon';
import { Sheet } from '@/components/sheet';
import {
  daysBetween,
  dBadge,
  expTone,
  fmt,
  monthDay,
  PLACES,
  todayIso,
  type IsoDate,
} from '@/domain';
import {
  blankForm,
  fromInbox,
  canSubmit,
  EXP_CHOICES,
  formExp,
  packPlaces,
  qtyStep,
  quickAmounts,
  toAddInput,
  togglePack,
  unitsFor,
  unitSourceText,
  withKind,
  withName,
  withPortions,
  withUnit,
  type AddForm,
} from '@/features/add/add-form';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, fonts, placeColors, radius, spacing, tones } from '@/theme';

const KINDS = [
  { kind: 'food', label: '식품', sub: '기한으로 관리', fg: '#2E6B4F', bg: '#DDF2E6' },
  { kind: 'cons', label: '소모품', sub: '쓰는 속도로 관리', fg: '#4B3FB0', bg: '#E9E6FF' },
] as const;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function weekday(iso: IsoDate): string {
  const [y, m, d] = iso.split('-').map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function toDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function AddScreen() {
  // name: 품목 상세의 '새로 산 것 넣기'에서, inboxId: 장보기의 '정리'에서 열 때
  const { name, inboxId } = useLocalSearchParams<{ name?: string; inboxId?: string }>();
  const items = useHome((s) => s.items);
  const today = useHome((s) => s.today);
  const addStock = useHome((s) => s.addStock);
  const entry = useHome((s) => (inboxId ? s.inbox.find((x) => x.id === inboxId) : undefined));
  const [form, setForm] = useState<AddForm>(() => {
    if (entry) return fromInbox(items, entry);
    return name ? withName(blankForm(), items, name) : blankForm();
  });
  const [unitOpen, setUnitOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickDraft, setPickDraft] = useState<Date | null>(null);

  const isFood = form.kind === 'food';
  const exp = isFood ? formExp(form, today) : null;
  const expDays = exp ? daysBetween(today, exp) : null;
  const ok = canSubmit(form);
  const step = qtyStep(form);
  const fridgeCount = form.place === '냉동' ? form.fridgePacks.length : 0;

  const submit = () => {
    const id = addStock(toAddInput(form, today), entry?.id);
    if (!id) return;
    // 장보기에서 왔으면 남은 정리할 것을 이어서 하도록 장보기로 돌아간다
    if (entry) router.back();
    else router.replace({ pathname: '/item/[id]', params: { id } });
  };

  const submitLabel = !form.name.trim()
    ? '이름을 입력해 주세요'
    : !(form.qty > 0)
      ? '양을 입력해 주세요'
      : isFood && form.split
        ? `${form.portions}팩으로 나눠 넣기`
        : `${fmt(form.qty)}${form.unit} 넣기`;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {entry ? '장본 것 정리' : '빠른 추가'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            onPress={() => router.back()}
            style={styles.close}>
            <Icon name="close" color={colors.text} size={24} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Field label="이름">
            <TextInput
              value={form.name}
              onChangeText={(v) => setForm((f) => withName(f, items, v))}
              placeholder="예: 요거트"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="이름"
              autoFocus={!name}
              returnKeyType="done"
              style={styles.nameInput}
            />
          </Field>

          <Field label="종류">
            <View style={styles.row}>
              {KINDS.map((k) => {
                const on = form.kind === k.kind;
                return (
                  <Pressable
                    key={k.kind}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    onPress={() => setForm((f) => withKind(f, k.kind))}
                    style={[styles.kind, on && { backgroundColor: k.bg, borderColor: k.fg }]}>
                    <Icon
                      name={k.kind === 'food' ? 'bowl' : 'home'}
                      color={on ? k.fg : colors.mutedText}
                    />
                    <View>
                      <Text style={[styles.kindLabel, { color: on ? k.fg : colors.mutedText }]}>
                        {k.label}
                      </Text>
                      <Text style={[styles.kindSub, { color: on ? k.fg : colors.mutedText }]}>
                        {k.sub}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="보관 장소">
            <View style={styles.row6}>
              {PLACES.map((p) => {
                const on = form.place === p;
                const off = !isFood && p !== '생활';
                const pc = placeColors[p];
                return (
                  <Pressable
                    key={p}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on, disabled: off }}
                    disabled={off}
                    onPress={() => setForm((f) => ({ ...f, place: p, fridgePacks: [] }))}
                    style={[
                      styles.place,
                      on && { backgroundColor: pc.tint, borderColor: pc.fg },
                      off && { opacity: 0.35 },
                    ]}>
                    <Icon name={placeIcon(p)} color={pc.fg} />
                    <Text style={[styles.placeLabel, { color: pc.fg }]}>{p}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <View style={styles.field}>
            <View style={styles.qtyHead}>
              <Text style={styles.label}>{form.split ? '전체 양' : '넣을 양'}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: unitOpen }}
                onPress={() => setUnitOpen((o) => !o)}
                style={styles.unitToggle}>
                <Text style={styles.unitToggleText}>
                  단위 <Text style={styles.bold}>{form.unit}</Text> ·{' '}
                  <Text style={styles.underline}>{unitOpen ? '닫기' : '바꾸기'}</Text>
                </Text>
              </Pressable>
            </View>
            {unitOpen && (
              <View style={styles.unitBox}>
                <Text style={styles.hint}>단위 고르기</Text>
                <View style={styles.segment}>
                  {unitsFor(form.kind).map((u) => {
                    const on = form.unit === u;
                    return (
                      <Pressable
                        key={u}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        onPress={() => {
                          setForm((f) => withUnit(f, u));
                          setUnitOpen(false);
                        }}
                        style={[styles.segmentItem, on && styles.segmentOn]}>
                        <Text style={[styles.segmentText, on && { color: colors.heading }]}>
                          {u}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
            <View style={styles.qtyBox}>
              {/* TextInput은 글자 길이만큼 늘어나지 않아서, 같은 글꼴의 숨은 Text로 너비를 잡는다 */}
              <View>
                <Text style={[styles.qtyInput, styles.qtyGhost]} aria-hidden>
                  {form.qty ? String(form.qty) : '0'}
                </Text>
                <TextInput
                  value={form.qty ? String(form.qty) : ''}
                  onChangeText={(v) => {
                    const n = parseFloat(v.replace(/[^0-9.]/g, ''));
                    setForm((f) => ({ ...f, qty: isNaN(n) ? 0 : n }));
                  }}
                  keyboardType="decimal-pad"
                  accessibilityLabel="넣을 양"
                  style={[styles.qtyInput, StyleSheet.absoluteFill]}
                />
              </View>
              <Text style={styles.qtyUnit}>{form.unit}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="양 줄이기"
                onPress={() => setForm((f) => ({ ...f, qty: Math.max(1, f.qty - step) }))}
                style={styles.qtyBtn}>
                <Icon name="minus" color={colors.heading} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="양 늘리기"
                onPress={() => setForm((f) => ({ ...f, qty: Math.min(99999, f.qty + step) }))}
                style={styles.qtyBtn}>
                <Icon name="plus" color={colors.heading} />
              </Pressable>
            </View>
            <View style={styles.row5}>
              {quickAmounts(form).map((q) => (
                <Chip
                  key={q.qty}
                  label={q.label}
                  on={form.qty === q.qty}
                  onPress={() => setForm((f) => ({ ...f, qty: q.qty }))}
                />
              ))}
            </View>
            <Text style={styles.hint}>{unitSourceText(form)}</Text>
          </View>

          {isFood ? (
            <>
              <Field label="보관 방법">
                <View style={styles.row6}>
                  <Chip
                    label="그대로 보관"
                    on={!form.split}
                    tall
                    onPress={() => setForm((f) => ({ ...f, split: false }))}
                  />
                  <Chip
                    label="나눠서 소분"
                    on={form.split}
                    tall
                    onPress={() => setForm((f) => ({ ...f, split: true }))}
                  />
                </View>
                {form.split && (
                  <View style={styles.splitBox}>
                    <View style={styles.splitHead}>
                      <Text style={styles.splitTitle}>
                        {fmt(form.qty)}
                        {form.unit} → {form.portions}팩
                      </Text>
                      <View style={styles.stepper}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="팩 수 줄이기"
                          onPress={() => setForm((f) => withPortions(f, f.portions - 1))}
                          style={styles.stepBtn}>
                          <Icon name="minus" color={colors.text} size={18} />
                        </Pressable>
                        <Text style={styles.stepValue}>{form.portions}팩</Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="팩 수 늘리기"
                          onPress={() => setForm((f) => withPortions(f, f.portions + 1))}
                          style={styles.stepBtn}>
                          <Icon name="plus" color={colors.text} size={18} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.packs}>
                      {packPlaces(form).map((p, k) => {
                        const pc = placeColors[p];
                        const tappable = form.place === '냉장' || form.place === '냉동';
                        return (
                          <Pressable
                            key={k}
                            accessibilityRole="button"
                            accessibilityLabel={`${k + 1}번째 팩 ${p}${tappable ? (p === '냉장' ? ' · 눌러서 냉동으로' : ' · 눌러서 냉장으로') : ''}`}
                            disabled={!tappable}
                            onPress={() => setForm((f) => togglePack(f, k))}
                            style={[styles.pack, { backgroundColor: pc.tint, borderColor: pc.fg }]}>
                            <Icon name={placeIcon(p)} color={pc.fg} size={18} />
                            <Text style={[styles.packSize, { color: pc.fg }]}>
                              {fmt(form.qty / form.portions)}
                              {form.unit}
                            </Text>
                            <Text style={[styles.packPlace, { color: pc.fg }]}>{p}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.note}>
                      {form.place === '냉동' || form.place === '냉장'
                        ? `팩을 누르면 냉장 ↔ 냉동이 바뀌어요 · 냉장 ${form.place === '냉장' ? form.portions : fridgeCount}팩, 냉동 ${form.place === '냉장' ? 0 : form.portions - fridgeCount}팩`
                        : `모두 ${form.place}에 넣어요`}
                    </Text>
                  </View>
                )}
              </Field>

              <Field label="유통기한">
                <View style={styles.row5}>
                  {EXP_CHOICES.map(([k, label]) => (
                    <Chip
                      key={k}
                      label={label}
                      on={form.exp === k}
                      onPress={() => setForm((f) => ({ ...f, exp: k }))}
                    />
                  ))}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="유통기한 날짜 고르기"
                  onPress={() => {
                    setPickDraft(toDate(exp ?? todayIso(toDate(today))));
                    setPickerOpen(true);
                  }}
                  style={styles.dateRow}>
                  <Text style={styles.dateText}>
                    {exp
                      ? `${monthDay(exp)} ${weekday(exp)}요일까지`
                      : '기한 없이 관리 · 눌러서 날짜 고르기'}
                  </Text>
                  {expDays !== null && (
                    <Text
                      style={[
                        styles.dateBadge,
                        {
                          backgroundColor: tones[expTone(expDays)].bg,
                          color: tones[expTone(expDays)].fg,
                        },
                      ]}>
                      {dBadge(expDays)}
                    </Text>
                  )}
                  <Icon name="chevronDown" color="#8A8E9C" size={18} />
                </Pressable>
                <Text style={styles.note}>
                  {!exp
                    ? '기한 없이 개수로 관리해요 · 2주 넘게 두면 홈에서 알려 줘요'
                    : `${form.split && fridgeCount > 0 ? '냉장에 둔 팩은 2일 안에 먹기로 잡아요 · ' : ''}날짜 줄을 누르면 달력에서 고를 수 있어요`}
                </Text>
              </Field>
            </>
          ) : (
            <Text style={styles.consNote}>
              소모품은 기한 대신 <Text style={styles.bold}>쓰는 속도</Text>로 관리해요. &quot;1
              {form.unit} 썼어요&quot;를 누를 때마다 기록되고, 떨어질 때쯤 장보기에 추천해요. 처음엔
              14일로 시작해요.
            </Text>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !ok }}
            disabled={!ok}
            onPress={submit}
            style={[styles.submit, !ok && { backgroundColor: colors.disabled }]}>
            <Text style={styles.submitText}>{submitLabel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {pickerOpen && Platform.OS === 'ios' && (
        <Sheet
          visible
          title="유통기한"
          saveLabel="선택"
          onClose={() => setPickerOpen(false)}
          onSave={() => {
            if (pickDraft) setForm((f) => ({ ...f, exp: 'pick', pick: todayIso(pickDraft) }));
            setPickerOpen(false);
          }}>
          <DateTimePicker
            value={pickDraft ?? toDate(today)}
            mode="date"
            display="inline"
            locale="ko-KR"
            onValueChange={(_, d) => setPickDraft(d)}
          />
        </Sheet>
      )}
      {pickerOpen && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={pickDraft ?? toDate(today)}
          mode="date"
          onValueChange={(_, d) => {
            setForm((f) => ({ ...f, exp: 'pick', pick: todayIso(d) }));
            setPickerOpen(false);
          }}
          onDismiss={() => setPickerOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  on,
  onPress,
  tall,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  tall?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, tall && styles.chipTall, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 28, color: colors.heading },
  close: {
    width: 44,
    height: 44,
    marginRight: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  field: { gap: spacing.sm },
  label: { fontSize: 13, fontWeight: '700', color: colors.link },
  bold: { fontWeight: '700', color: colors.heading },
  underline: { textDecorationLine: 'underline' },
  hint: { fontSize: fontSize.small, color: colors.textMuted },
  note: { fontSize: 13, color: colors.textSecondary },
  nameInput: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.heading,
    backgroundColor: colors.surface,
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  row6: { flexDirection: 'row', gap: 6 },
  row5: { flexDirection: 'row', gap: 5 },
  kind: {
    flex: 1,
    height: 62,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  kindLabel: { fontSize: fontSize.bodyLarge, fontWeight: '700' },
  kindSub: { fontSize: fontSize.caption, opacity: 0.85 },
  place: {
    flex: 1,
    height: 66,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  placeLabel: { fontSize: 13, fontWeight: '700' },
  qtyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unitToggle: { minHeight: 32, justifyContent: 'center' },
  unitToggleText: { fontSize: 13, color: colors.link },
  unitBox: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    borderRadius: radius.md,
    backgroundColor: colors.tabActive,
  },
  segmentItem: {
    flex: 1,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOn: { backgroundColor: colors.surface },
  segmentText: { fontSize: fontSize.body, fontWeight: '700', color: colors.textMuted },
  qtyBox: {
    paddingVertical: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  /** iOS TextInput에 lineHeight를 주면 글자가 아래로 밀리므로 넣지 않는다 */
  qtyInput: {
    height: 44,
    padding: 0,
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.heading,
    textAlignVertical: 'center',
  },
  /** 입력칸 너비를 정하는 보이지 않는 글자 (커서 자리만큼 여유) */
  qtyGhost: {
    minWidth: 28,
    paddingRight: 6,
    lineHeight: 44,
    opacity: 0,
  },
  qtyUnit: { flex: 1, fontFamily: fonts.display, fontSize: 30, color: colors.heading },
  qtyBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTall: { height: 44, borderRadius: radius.md },
  chipOn: { borderColor: colors.heading },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  chipTextOn: { fontWeight: '700', color: colors.heading },
  splitBox: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  splitHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  splitTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  stepBtn: { width: 44, height: 41, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 44, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  packs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pack: {
    width: '18.5%',
    flexGrow: 1,
    height: 84,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  packSize: { fontFamily: fonts.display, fontSize: 18 },
  packPlace: { fontSize: fontSize.caption, fontWeight: '700' },
  dateRow: {
    minHeight: 50,
    paddingLeft: 14,
    paddingRight: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: { flex: 1, fontSize: fontSize.bodyLarge, color: colors.heading },
  dateBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.sm,
    overflow: 'hidden',
    fontSize: fontSize.small,
    fontWeight: '700',
  },
  consNote: {
    paddingVertical: spacing.md,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    fontSize: 13,
    lineHeight: 21,
    color: colors.link,
    overflow: 'hidden',
  },
  footer: { paddingTop: 10, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  submit: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.toast,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontSize: 16, fontWeight: '700', color: colors.surface },
});
