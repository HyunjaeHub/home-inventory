import { useState } from 'react';

import { Sheet } from '@/components/sheet';
import { colors, fontSize, radius } from '@/theme';

import type { ExpiryPickerProps } from './expiry-picker';

/**
 * 웹용 유통기한 고르기.
 * 네이티브 날짜 선택기(@react-native-community/datetimepicker)는 웹을 지원하지 않아
 * 브라우저 기본 날짜 입력을 쓴다 (아이폰 Safari에서는 iOS 날짜 휠이 뜬다).
 */
export function ExpiryPicker({ value, onPick, onClose }: ExpiryPickerProps) {
  const [draft, setDraft] = useState(value);

  return (
    <Sheet
      visible
      title="유통기한"
      saveLabel="선택"
      onClose={onClose}
      onSave={() => draft && onPick(draft)}>
      <input
        type="date"
        aria-label="유통기한"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        style={{
          height: 52,
          padding: '0 14px',
          borderRadius: radius.md,
          border: `1.5px solid ${colors.border}`,
          backgroundColor: colors.surface,
          color: colors.text,
          fontSize: fontSize.bodyLarge + 1,
          fontFamily: 'inherit',
        }}
      />
    </Sheet>
  );
}
