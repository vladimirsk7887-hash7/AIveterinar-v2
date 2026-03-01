import { useEffect, useMemo } from 'react';

const wa = window.WebApp;

export function useMax() {
  useEffect(() => {
    if (!wa) return;
    wa.ready();
  }, []);

  const user = useMemo(() => wa?.initDataUnsafe?.user || null, []);
  const platform = wa?.platform || 'web';
  const initData = wa?.initData || '';

  const showBackButton = (onClick) => {
    if (!wa?.BackButton) return;
    wa.BackButton.show();
    wa.BackButton.offClick(onClick);
    wa.BackButton.onClick(onClick);
  };

  const hideBackButton = () => {
    if (!wa?.BackButton) return;
    wa.BackButton.hide();
  };

  // Max не поддерживает MainButton — no-op для совместимости с логикой TgApp
  const showMainButton = () => {};
  const hideMainButton = () => {};

  const haptic = (type = 'light') => {
    wa?.HapticFeedback?.impactOccurred(type);
  };

  const hapticNotification = (type = 'success') => {
    wa?.HapticFeedback?.notificationOccurred(type);
  };

  const close = () => wa?.close();

  return {
    wa,
    user,
    platform,
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
