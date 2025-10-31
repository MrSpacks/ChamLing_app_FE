import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  requestNotificationPermission, 
  setupDailyNotifications, 
  saveNotificationSettings 
} from '../../utils/notifications';
import { FaBell, FaClock } from 'react-icons/fa';
import './NotificationSetup.css';

const NotificationSetup = ({ onComplete }) => {
  const { t } = useTranslation();
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Проверяем текущее разрешение
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    setIsLoading(false);
    
    if (!granted) {
      alert(t('NotificationSetup.permission_denied') || 'Разрешение на уведомления не предоставлено. Вы можете включить их позже в настройках.');
    }
  };

  const handleSave = () => {
    if (!permissionGranted) {
      alert(t('NotificationSetup.need_permission') || 'Сначала предоставьте разрешение на уведомления');
      return;
    }

    // Сохраняем настройки
    saveNotificationSettings(hour, minute);
    
    // Настраиваем ежедневные уведомления
    setupDailyNotifications(hour, minute);
    
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="notification_setup">
      <div className="notification_setup_header">
        <FaBell className="notification_icon" />
        <h3>{t('NotificationSetup.title') || 'Настройка напоминаний'}</h3>
        <p className="notification_setup_description">
          {t('NotificationSetup.description') || 'Выберите удобное время для ежедневных напоминаний об изучении слов'}
        </p>
      </div>

      <div className="notification_setup_content">
        {!permissionGranted ? (
          <div className="permission_request">
            <p>{t('NotificationSetup.permission_text') || 'Для отправки напоминаний нужно разрешение на уведомления'}</p>
            <button 
              className="permission_button"
              onClick={handleRequestPermission}
              disabled={isLoading}
            >
              {isLoading 
                ? (t('NotificationSetup.requesting') || 'Запрос...') 
                : (t('NotificationSetup.request_permission') || 'Разрешить уведомления')
              }
            </button>
          </div>
        ) : (
          <div className="time_selection">
            <div className="time_selector_label">
              <FaClock className="time_icon" />
              <span>{t('NotificationSetup.select_time') || 'Выберите время'}</span>
            </div>
            
            <div className="time_selectors">
              <div className="time_selector">
                <label>{t('NotificationSetup.hour') || 'Час'}</label>
                <select 
                  value={hour} 
                  onChange={(e) => setHour(parseInt(e.target.value))}
                  className="time_input"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <span className="time_separator">:</span>

              <div className="time_selector">
                <label>{t('NotificationSetup.minute') || 'Минута'}</label>
                <select 
                  value={minute} 
                  onChange={(e) => setMinute(parseInt(e.target.value))}
                  className="time_input"
                >
                  {[0, 15, 30, 45].map(m => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="selected_time_preview">
              {t('NotificationSetup.preview') || 'Напоминание будет приходить каждый день в'} {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
            </div>
          </div>
        )}

        <div className="notification_setup_actions">
          <button 
            className="save_button"
            onClick={handleSave}
            disabled={!permissionGranted}
          >
            {t('NotificationSetup.save') || 'Сохранить'}
          </button>
          <button 
            className="skip_button"
            onClick={handleSkip}
          >
            {t('NotificationSetup.skip') || 'Пропустить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSetup;

