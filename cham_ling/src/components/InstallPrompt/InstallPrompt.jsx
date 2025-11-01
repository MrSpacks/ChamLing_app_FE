import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  shouldShowInstallPrompt, 
  promptInstall, 
  dismissInstallPrompt,
  isPWAInstalled,
  getInstallPrompt
} from '../../utils/pwaInstall';
import { FaTimes, FaDownload, FaMobileAlt } from 'react-icons/fa';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Проверяем, нужно ли показывать предложение при каждом открытии
    const checkShow = () => {
      // Не показываем, если уже установлено
      if (isPWAInstalled()) {
        setShow(false);
        return;
      }

      // Проверяем наличие beforeinstallprompt события (для Chrome/Edge)
      if (getInstallPrompt()) {
        // Показываем только если пользователь не отключил предложение
        if (shouldShowInstallPrompt()) {
          // Небольшая задержка для лучшего UX
          setTimeout(() => {
            setShow(true);
          }, 1000);
        }
      }
    };

    // Проверяем сразу при монтировании
    checkShow();

    // Слушаем кастомное событие от initInstallPrompt
    const handleInstallPromptAvailable = () => {
      if (shouldShowInstallPrompt() && !isPWAInstalled()) {
        setTimeout(() => {
          setShow(true);
        }, 1000);
      }
    };

    window.addEventListener('installpromptavailable', handleInstallPromptAvailable);

    // Также проверяем периодически на случай если событие уже было до монтирования компонента
    const checkInterval = setInterval(() => {
      if (getInstallPrompt() && shouldShowInstallPrompt() && !isPWAInstalled()) {
        setShow(true);
        clearInterval(checkInterval);
      }
    }, 2000);

    // Очищаем интервал через 10 секунд
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);

    return () => {
      window.removeEventListener('installpromptavailable', handleInstallPromptAvailable);
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleInstall = async () => {
    try {
      const accepted = await promptInstall();
      if (accepted) {
        setShow(false);
      }
    } catch (error) {
      console.error('Ошибка при установке:', error);
      // Если не удалось установить через prompt, можно показать инструкции
      alert(t('InstallPrompt.manual_instructions') || 'Откройте меню браузера и выберите "Установить приложение" или "Добавить на главный экран"');
    }
  };

  const handleDismiss = () => {
    if (dontShowAgain) {
      dismissInstallPrompt();
    }
    setShow(false);
  };

  const handleClose = () => {
    setShow(false);
  };

  if (!show || isPWAInstalled()) {
    return null;
  }

  return (
    <div className="install_prompt_overlay">
      <div className="install_prompt">
        <button className="install_prompt_close" onClick={handleClose}>
          <FaTimes />
        </button>
        
        <div className="install_prompt_header">
          <FaMobileAlt className="install_icon" />
          <h3>{t('InstallPrompt.title') || 'Установите ChamLing'}</h3>
          <p className="install_prompt_description">
            {t('InstallPrompt.description') || 'Установите приложение для быстрого доступа и работы в офлайн-режиме'}
          </p>
        </div>

        <div className="install_prompt_benefits">
          <div className="benefit_item">
            <span className="benefit_icon">⚡</span>
            <span>{t('InstallPrompt.benefit_1') || 'Быстрый доступ'}</span>
          </div>
          <div className="benefit_item">
            <span className="benefit_icon">📱</span>
            <span>{t('InstallPrompt.benefit_2') || 'Работа офлайн'}</span>
          </div>
          <div className="benefit_item">
            <span className="benefit_icon">🔔</span>
            <span>{t('InstallPrompt.benefit_3') || 'Уведомления'}</span>
          </div>
        </div>

        <div className="install_prompt_actions">
          <button className="install_button" onClick={handleInstall}>
            <FaDownload />
            <span>{t('InstallPrompt.install') || 'Установить'}</span>
          </button>
          
          <button className="later_button" onClick={handleDismiss}>
            {t('InstallPrompt.later') || 'Позже'}
          </button>
        </div>

        <div className="install_prompt_checkbox">
          <label>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>{t('InstallPrompt.dont_show_again') || 'Больше не предлагать'}</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;

