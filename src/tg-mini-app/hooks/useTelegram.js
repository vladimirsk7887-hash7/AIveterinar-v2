import { useEffect, useMemo } from 'react';

const tg = window.Telegram?.WebApp;

export function useTelegram() {
  useEffect(() => {
    if (!tg) return;
    tg.ready();
    tg.expand();
  }, []);

  const user = useMemo(() => tg?.initDataUnsafe?.user || null, []);
  const colorScheme = tg?.colorScheme || 'dark';
  const initData = tg?.initData || '';

  const showMainButton = (text, onClick) => {
    if (!tg) return;
    tg.MainButton.setText(text);
    tg.MainButton.show();
    tg.MainButton.offClick(onClick);
    tg.MainButton.onClick(onClick);
  };

  const hideMainButton = () => {
    if (!tg) return;
    tg.MainButton.hide();
  };

  const showBackButton = (onClick) => {
    if (!tg) return;
    tg.BackButton.show();
    tg.BackButton.offClick(onClick);
    tg.BackButton.onClick(onClick);
  };

  const hideBackButton = () => {
    if (!tg) return;
    tg.BackButton.hide();
  };

  const haptic = (type = 'light') => {
    tg?.HapticFeedback?.impactOccurred(type);
  };

  const hapticNotification = (type = 'success') => {
    tg?.HapticFeedback?.notificationOccurred(type);
  };

  const close = () => tg?.close();

  return {
    tg,
    user,
    colorScheme,
    initData,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    haptic,
    hapticNotification,
    close,
  };
}
