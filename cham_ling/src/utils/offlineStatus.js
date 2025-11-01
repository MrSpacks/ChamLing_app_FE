/**
 * Утилита для отслеживания онлайн/офлайн статуса.
 * 
 * @module utils/offlineStatus
 */

/**
 * Проверяет, есть ли интернет соединение.
 * 
 * @returns {boolean} True если онлайн, false если офлайн
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Подписывается на изменения онлайн/офлайн статуса.
 * 
 * @param {Function} callback - Функция вызываемая при изменении статуса
 * @returns {Function} Функция для отписки
 */
export const subscribeToOnlineStatus = (callback) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Вызываем сразу с текущим статусом
  callback(isOnline());

  // Возвращаем функцию отписки
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

