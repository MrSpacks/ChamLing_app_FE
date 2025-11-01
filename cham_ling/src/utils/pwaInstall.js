// Утилита для работы с установкой PWA

// Проверка, установлено ли приложение как PWA
export const isPWAInstalled = () => {
  // Проверяем различные индикаторы установки PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Для iOS
  if (window.navigator.standalone === true) {
    return true;
  }
  
  // Для других платформ
  if (document.referrer.includes('android-app://')) {
    return true;
  }
  
  return false;
};

// Проверка, был ли отключен показ предложения установки
export const isInstallPromptDismissed = () => {
  return localStorage.getItem('pwa_install_dismissed') === 'true';
};

// Сохранение состояния "больше не предлагать"
export const dismissInstallPrompt = () => {
  localStorage.setItem('pwa_install_dismissed', 'true');
};

// Проверка, нужно ли показывать предложение установки
export const shouldShowInstallPrompt = () => {
  // Не показываем, если уже установлено
  if (isPWAInstalled()) {
    return false;
  }
  
  // Не показываем, если пользователь отключил предложение
  if (isInstallPromptDismissed()) {
    return false;
  }
  
  // Показываем, если поддерживается установка
  return isInstallSupported();
};

// Проверка поддержки установки
export const isInstallSupported = () => {
  // Проверяем наличие beforeinstallprompt события
  // Это событие доступно только в поддерживаемых браузерах
  return 'serviceWorker' in navigator && 
         (window.matchMedia('(display-mode: standalone)').matches === false);
};

// Отслеживание события beforeinstallprompt
let deferredPrompt = null;

export const getInstallPrompt = () => {
  return deferredPrompt;
};

export const setInstallPrompt = (event) => {
  deferredPrompt = event;
};

export const clearInstallPrompt = () => {
  deferredPrompt = null;
};

// Инициализация отслеживания установки
let isInitialized = false;

export const initInstallPrompt = () => {
  // Предотвращаем дублирование слушателей
  if (isInitialized) {
    return;
  }
  
  isInitialized = true;
  
  const handleBeforeInstallPrompt = (e) => {
    // Предотвращаем автоматическое отображение подсказки браузера
    e.preventDefault();
    // Сохраняем событие для использования позже
    setInstallPrompt(e);
    console.log('beforeinstallprompt event captured');
    
    // Отправляем кастомное событие для компонента InstallPrompt
    window.dispatchEvent(new CustomEvent('installpromptavailable'));
  };

  const handleAppInstalled = () => {
    clearInstallPrompt();
    console.log('PWA было установлено');
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
  
  // Возвращаем функцию очистки
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
    isInitialized = false;
  };
};

// Запуск установки
export const promptInstall = async () => {
  if (deferredPrompt) {
    try {
      // Показываем предложение установки
      await deferredPrompt.prompt();
      
      // Ждем, пока пользователь ответит на предложение
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Пользователь принял предложение установки');
      } else {
        console.log('Пользователь отклонил предложение установки');
      }
      
      // Очищаем сохраненное событие
      clearInstallPrompt();
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Ошибка при показе промпта установки:', error);
      clearInstallPrompt();
      return false;
    }
  }
  
  console.warn('deferredPrompt is not available');
  return false;
};

