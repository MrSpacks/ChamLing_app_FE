// Утилита для работы с уведомлениями

// Запрос разрешения на уведомления
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Этот браузер не поддерживает уведомления');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Регистрация Service Worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker зарегистрирован:', registration);
      return registration;
    } catch (error) {
      console.error('Ошибка регистрации Service Worker:', error);
      return null;
    }
  }
  return null;
};

// Планирование уведомления
export const scheduleNotification = (time, message = 'Время учить слова! 📚') => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      time,
      message
    });
  }
};

// Настройка ежедневных уведомлений
export const setupDailyNotifications = (hour, minute = 0, message = 'Время учить слова! 📚') => {
  // Вычисляем время первого уведомления
  const now = new Date();
  const notificationTime = new Date();
  notificationTime.setHours(hour, minute, 0, 0);

  // Если выбранное время уже прошло сегодня, планируем на завтра
  if (notificationTime <= now) {
    notificationTime.setDate(notificationTime.getDate() + 1);
  }

  // Используем более надежный метод планирования через scheduled notifications API
  if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
    // Если поддерживается Service Worker, используем его
    if (navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((registration) => {
        // Планируем первое уведомление
        scheduleNotification(notificationTime.toISOString(), message);

        // Функция для планирования следующего уведомления
        const scheduleNext = () => {
          const nextDay = new Date();
          nextDay.setDate(nextDay.getDate() + 1);
          nextDay.setHours(hour, minute, 0, 0);
          scheduleNotification(nextDay.toISOString(), message);
        };

        // Планируем следующее уведомление через время до первого уведомления
        const timeUntilFirst = notificationTime.getTime() - now.getTime();
        if (timeUntilFirst > 0) {
          setTimeout(() => {
            scheduleNext();
            // Планируем следующие уведомления каждые 24 часа
            setInterval(scheduleNext, 24 * 60 * 60 * 1000);
          }, timeUntilFirst);
        }
      });
    }
  } else {
    // Fallback: используем простой setTimeout (менее надежно, но работает)
    scheduleNotification(notificationTime.toISOString(), message);

    const scheduleNext = () => {
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(hour, minute, 0, 0);
      scheduleNotification(nextDay.toISOString(), message);
    };

    const timeUntilFirst = notificationTime.getTime() - now.getTime();
    if (timeUntilFirst > 0) {
      setTimeout(() => {
        scheduleNext();
        setInterval(scheduleNext, 24 * 60 * 60 * 1000);
      }, timeUntilFirst);
    }
  }
};

// Сохранение настроек уведомлений
export const saveNotificationSettings = (hour, minute) => {
  localStorage.setItem('notification_time', JSON.stringify({ hour, minute }));
  localStorage.setItem('notifications_enabled', 'true');
};

// Загрузка настроек уведомлений
export const loadNotificationSettings = () => {
  const timeStr = localStorage.getItem('notification_time');
  const enabled = localStorage.getItem('notifications_enabled') === 'true';
  
  if (timeStr) {
    const time = JSON.parse(timeStr);
    return { ...time, enabled };
  }
  
  return { hour: 9, minute: 0, enabled: false };
};

// Отключение уведомлений
export const disableNotifications = () => {
  localStorage.setItem('notifications_enabled', 'false');
};

// Показ немедленного уведомления (для тестирования)
export const showNotification = (title = 'ChamLing', options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: options.body || 'Время учить слова! 📚',
      icon: options.icon || '/logo192.png',
      badge: options.badge || '/logo192.png',
      vibrate: options.vibrate || [200, 100, 200],
      tag: options.tag || 'chamling-notification',
      ...options
    });
  }
};

