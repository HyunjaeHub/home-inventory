import { Alert, Platform } from 'react-native';

type Options = {
  title: string;
  message: string;
  /** 확인 버튼 글자 (예: '지우기') */
  confirmLabel: string;
  /** 지우기처럼 되돌릴 수 없는 일이면 빨간 버튼 (iOS) */
  destructive?: boolean;
  onConfirm: () => void;
};

/**
 * "정말 할까요?" 확인 창.
 * React Native의 Alert는 웹에서 버튼 있는 창을 띄우지 못해 눌러도 아무 일이 없으므로,
 * 웹에서는 브라우저 기본 확인 창을 쓴다.
 */
export function confirmAction({ title, message, confirmLabel, destructive, onConfirm }: Options) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: '취소', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
