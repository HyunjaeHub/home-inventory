import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform } from 'react-native';

import { Sheet } from '@/components/sheet';
import { todayIso, type IsoDate } from '@/domain';

export type ExpiryPickerProps = {
  /** 처음 보여 줄 날짜 */
  value: IsoDate;
  onPick: (iso: IsoDate) => void;
  onClose: () => void;
};

function toDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 유통기한 고르기: iOS는 시트 안 달력, Android는 시스템 날짜 창 (웹은 expiry-picker.web.tsx) */
export function ExpiryPicker({ value, onPick, onClose }: ExpiryPickerProps) {
  const [draft, setDraft] = useState(() => toDate(value));

  if (Platform.OS !== 'ios') {
    return (
      <DateTimePicker
        value={draft}
        mode="date"
        onValueChange={(_, d) => onPick(todayIso(d))}
        onDismiss={onClose}
      />
    );
  }

  return (
    <Sheet
      visible
      title="유통기한"
      saveLabel="선택"
      onClose={onClose}
      onSave={() => onPick(todayIso(draft))}>
      <DateTimePicker
        value={draft}
        mode="date"
        display="inline"
        locale="ko-KR"
        onValueChange={(_, d) => setDraft(d)}
      />
    </Sheet>
  );
}
