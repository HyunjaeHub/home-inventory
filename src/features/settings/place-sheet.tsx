import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { lookOfKind } from '@/components/place-look';
import { Sheet } from '@/components/sheet';
import { PLACE_KINDS, type PlaceKind, type StoragePlace } from '@/domain';
import { useHome } from '@/stores/home-store';
import { colors, fontSize, radius, spacing } from '@/theme';

type Props = {
  /** 고칠 장소. 없으면 새로 추가 */
  place?: StoragePlace;
  onClose: () => void;
};

/** 보관 장소 추가·고치기: 이름과 종류(기한 규칙), 지우기 */
export function PlaceSheet({ place, onClose }: Props) {
  const actions = useHome.getState();
  const [name, setName] = useState(place?.name ?? '');
  const [kind, setKind] = useState<PlaceKind>(place?.kind ?? 'fridge');

  const save = () => {
    const ok = place ? actions.updatePlace(place.id, { name, kind }) : actions.addPlace(name, kind);
    if (ok) onClose();
  };

  const remove = () => {
    if (!place) return;
    Alert.alert(`${place.name} 지우기`, '이 장소를 목록에서 지워요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '지우기',
        style: 'destructive',
        onPress: () => {
          if (actions.removePlace(place.id)) onClose();
        },
      },
    ]);
  };

  return (
    <Sheet
      visible
      title={place ? '보관 장소 고치기' : '보관 장소 추가'}
      onClose={onClose}
      onSave={save}>
      <View style={styles.field}>
        <Text style={styles.label}>이름</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="예: 김치냉장고, 베란다"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="장소 이름"
          autoFocus={!place}
          maxLength={12}
          returnKeyType="done"
          style={styles.input}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>종류 · 기한 규칙을 이 종류대로 따라요</Text>
        <View style={styles.kinds}>
          {PLACE_KINDS.map((k) => {
            const on = k.kind === kind;
            const look = lookOfKind(k.kind);
            return (
              <Pressable
                key={k.kind}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${k.label}, ${k.sub}`}
                onPress={() => setKind(k.kind)}
                style={[styles.kind, on && { backgroundColor: look.tint, borderColor: look.fg }]}>
                <Icon name={look.icon} color={look.fg} size={18} />
                <View style={styles.kindText}>
                  <Text style={[styles.kindLabel, { color: on ? look.fg : colors.text }]}>
                    {k.label}
                  </Text>
                  <Text style={styles.kindSub}>{k.sub}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      {place && (
        <Pressable accessibilityRole="button" onPress={remove} style={styles.remove}>
          <Icon name="trash" color={colors.danger} size={18} />
          <Text style={styles.removeText}>이 장소 지우기</Text>
        </Pressable>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { fontSize: 13, fontWeight: '700', color: colors.link },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.heading,
    fontSize: 17,
    color: colors.text,
  },
  kinds: { gap: 6 },
  kind: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  kindText: { flex: 1 },
  kindLabel: { fontSize: fontSize.bodyLarge, fontWeight: '700' },
  kindSub: { fontSize: fontSize.small, color: colors.textSecondary },
  remove: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  removeText: { fontSize: fontSize.body, fontWeight: '700', color: colors.danger },
});
