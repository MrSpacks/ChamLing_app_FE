/**
 * Компонент индикатора офлайн статуса.
 * 
 * Показывает когда приложение работает в офлайн режиме.
 * 
 * @module components/OfflineIndicator
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle } from 'react-icons/fa';
import { subscribeToOnlineStatus } from '../../utils/offlineStatus';
import './OfflineIndicator.css';

/**
 * Компонент индикатора офлайн статуса.
 * 
 * Автоматически показывает/скрывается при изменении статуса интернета.
 * 
 * @returns {JSX.Element|null} Индикатор офлайн статуса или null если онлайн
 */
const OfflineIndicator = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToOnlineStatus((online) => {
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline_indicator">
      <FaExclamationTriangle className="offline_icon" />
      <span className="offline_text">
        {t("offline.indicator") || "Работа в офлайн режиме"}
      </span>
    </div>
  );
};

export default OfflineIndicator;

