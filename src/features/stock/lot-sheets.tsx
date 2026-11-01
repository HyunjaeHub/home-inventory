import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePlaceLook } from '@/components/place-look';
import { Sheet } from '@/components/sheet';
import { Stepper } from '@/components/stepper';
import { firstOfKind, fmt, isBulk, kindOf, lotText, type Lot, type Place } from '@/domain';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, radius, spacing } from '@/theme';

type Props = { itemId: string; lot: Lot; onClose: () => void };

function qtyStep(lot: Lot): number {
  if (lot.size) return 0.5;
  if (isBulk(lot)) return 50;
  if (lot.unit === '단') return 0.5;
  return 1;
}

/** 남은 양 고치기 */
export function EditQtySheet({ itemId, lot, onClose }: Props) {
  const setLotQty = useHome((s) => s.setLotQty);
  const [value, setValue] = useState(lot.qty);
  const step = qtyStep(lot);
  const unit = lot.size ? '팩' : lot.unit;

  return (
    <Sheet
      visible
      title="남은 양 고치기"
      onClose={onClose}
      onSave={() => {
        setLotQty(itemId, lot.id, value);
        onClose();
      }}>
      <Text style={styles.note}>
        지금 {lotText(lot)}
        {lot.size ? ` · 반 팩 단위로 고칠 수 있어요` : ''}
      </Text>
      <Stepper
        label="남은 양"
        valueText={`${fmt(value)}${unit}`}
        canDec={value > 0}
        onDec={() => setValue((v) => Math.max(0, Math.round((v - step) * 10) / 10))}
        onInc={() => setValue((v) => Math.round((v + step) * 10) / 10)}
      />
      {value === 0 && <Text style={styles.warn}>0으로 저장하면 이 묶음을 다 쓴 걸로 정리해요</Text>}
    </Sheet>
  );
}

/** 여러 팩으로 나누기 (일부는 다른 장소로) */
export function SplitSheet({ itemId, lot, onClose }: Props) {
  const splitLot = useHome((s) => s.splitLot);
  const total = lot.size ? lot.size * lot.qty : lot.qty;
  const [portions, setPortions] = useState(
    isBulk(lot) ? 3 : Math.min(10, Math.max(2, lot.size ? lot.qty * 2 : Math.round(lot.qty)))
  );
  const [other, setOther] = useState(0);
  const places = useHome((s) => s.places);
  const look = usePlaceLook();
  // 다른 곳 기본값: 냉동 종류면 첫 냉장, 아니면 첫 냉동
  const [otherPlace, setOtherPlace] = useState<Place>(() =>
    firstOfKind(places, kindOf(places, lot.place) === 'freezer' ? 'fridge' : 'freezer')
  );
  const choices = places.filter((p) => p.id !== lot.place && p.kind !== 'home').map((p) => p.id);

  return (
    <Sheet
      visible
      title="나누기"
      saveLabel="나누기"
      onClose={onClose}
      onSave={() => {
        splitLot(itemId, lot.id, portions, other, otherPlace);
        onClose();
      }}>
      <Text style={styles.note}>
        {lotText(lot)} → {fmt(total / portions)}
        {lot.unit}씩 {portions}팩
      </Text>
      <Stepper
        label="몇 팩으로"
        valueText={`${portions}팩`}
        canDec={portions > 2}
        canInc={portions < 10}
        onDec={() => {
          setPortions((p) => p - 1);
          setOther((o) => Math.min(o, portions - 2));
        }}
        onInc={() => setPortions((p) => p + 1)}
      />
      <Text style={styles.placesLabel}>다른 곳에 둘 팩</Text>
      <View style={styles.places}>
        {choices.map((p) => {
          const on = p === otherPlace;
          const pc = look(p);
          return (
            <Pressable
              key={p}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setOtherPlace(p)}
              style={[styles.chip, on && { backgroundColor: pc.tint, borderColor: pc.fg }]}>
              <Text style={[styles.chipText, on && { color: pc.fg }]}>{pc.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <Stepper
        label={`${look(otherPlace).name}에`}
        valueText={`${other}팩`}
        canDec={other > 0}
        canInc={other < portions - 1}
        onDec={() => setOther((o) => o - 1)}
        onInc={() => setOther((o) => o + 1)}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  warn: {
    fontSize: fontSize.small,
    color: colors.danger,
  },
  places: {
    marginTop: -spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  placesLabel: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.text,
  },
  chip: {
    minWidth: 56,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
