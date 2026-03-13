// Telegram Web App utilities
export const getTelegramUser = () => {
  if (window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe?.user;
  }
  return null;
};

export const closeWebApp = () => {
  if (window.Telegram?.WebApp?.close) {
    window.Telegram.WebApp.close();
  }
};