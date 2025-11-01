/**
 * Утилита для синхронизации прогресса изучения слов с сервером.
 * 
 * Автоматически синхронизирует прогресс при восстановлении интернета
 * и добавляет задачи в очередь при офлайн режиме.
 * 
 * @module utils/syncProgress
 */
import { isOnline, subscribeToOnlineStatus } from './offlineStatus';
import {
  getSyncQueue,
  addToSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueStatus,
  saveProgress as saveProgressToDB,
  getCachedProgress,
} from './indexedDB';

/**
 * Сохраняет прогресс изучения словаря.
 * 
 * Пытается сохранить на сервер, если онлайн.
 * Если офлайн - сохраняет локально и добавляет в очередь синхронизации.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @param {Array} learnedWords - Массив ID изученных слов
 * @param {Function} saveProgressAPI - API функция для сохранения прогресса на сервер
 * @returns {Promise<void>}
 */
export const saveProgress = async (dictionaryId, learnedWords, saveProgressAPI) => {
  // Сохраняем локально в IndexedDB всегда
  try {
    await saveProgressToDB(dictionaryId, learnedWords);
  } catch (error) {
    console.error('Error saving progress to IndexedDB:', error);
  }

  // Сохраняем в localStorage для обратной совместимости
  const progressKey = `dict_${dictionaryId}_progress`;
  localStorage.setItem(progressKey, JSON.stringify(learnedWords));

  if (isOnline()) {
    // Если онлайн - сохраняем на сервер
    try {
      await saveProgressAPI(dictionaryId, learnedWords);
      console.log('Progress synced to server');
    } catch (error) {
      console.error('Error syncing progress to server:', error);
      // Добавляем в очередь для повторной синхронизации
      await addToSyncQueue('progress', {
        dictionary_id: dictionaryId,
        learned_words: learnedWords
      });
    }
  } else {
    // Если офлайн - добавляем в очередь синхронизации
    await addToSyncQueue('progress', {
      dictionary_id: dictionaryId,
      learned_words: learnedWords
    });
    console.log('Progress saved locally, will sync when online');
  }
};

/**
 * Синхронизирует все задачи из очереди с сервером.
 * 
 * Обрабатывает все pending задачи из очереди синхронизации
 * и пытается выполнить их через соответствующие API функции.
 * 
 * @param {Function} saveProgressAPI - API функция для сохранения прогресса
 * @returns {Promise<number>} Количество синхронизированных задач
 */
export const syncQueue = async (saveProgressAPI) => {
  if (!isOnline()) {
    console.log('Cannot sync: offline');
    return 0;
  }

  try {
    const queue = await getSyncQueue('pending');
    let syncedCount = 0;

    for (const item of queue) {
      try {
        await updateSyncQueueStatus(item.id, 'syncing');

        if (item.type === 'progress') {
          const { dictionary_id, learned_words } = item.data;
          await saveProgressAPI(dictionary_id, learned_words);
          
          // Обновляем локальный прогресс
          await saveProgressToDB(dictionary_id, learned_words);
          
          await updateSyncQueueStatus(item.id, 'completed');
          await removeFromSyncQueue(item.id);
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error syncing queue item ${item.id}:`, error);
        
        // Если больше 3 попыток - помечаем как failed
        if (item.attempts >= 3) {
          await updateSyncQueueStatus(item.id, 'failed');
        } else {
          await updateSyncQueueStatus(item.id, 'pending');
        }
      }
    }

    console.log(`Synced ${syncedCount} items from queue`);
    return syncedCount;
  } catch (error) {
    console.error('Error syncing queue:', error);
    return 0;
  }
};

/**
 * Инициализирует автоматическую синхронизацию при восстановлении интернета.
 * 
 * Подписывается на изменения онлайн статуса и автоматически
 * синхронизирует очередь при восстановлении интернета.
 * 
 * @param {Function} saveProgressAPI - API функция для сохранения прогресса
 * @returns {Function} Функция для отписки от событий
 */
export const initAutoSync = (saveProgressAPI) => {
  return subscribeToOnlineStatus(async (online) => {
    if (online) {
      // Интернет восстановился - синхронизируем очередь
      console.log('Internet restored, syncing queue...');
      await syncQueue(saveProgressAPI);
    }
  });
};

/**
 * Получает прогресс изучения словаря.
 * 
 * Пытается получить с сервера, если онлайн.
 * Если офлайн или ошибка - использует локальный кеш.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @param {Function} getProgressAPI - API функция для получения прогресса
 * @returns {Promise<Array>} Массив ID изученных слов
 */
export const getProgress = async (dictionaryId, getProgressAPI) => {
  if (isOnline()) {
    try {
      const progress = await getProgressAPI(dictionaryId);
      const learnedWords = progress.learned_words || [];
      
      // Сохраняем полученный прогресс локально
      if (learnedWords.length > 0) {
        await saveProgressToDB(dictionaryId, learnedWords);
        
        // Также сохраняем в localStorage для обратной совместимости
        const progressKey = `dict_${dictionaryId}_progress`;
        localStorage.setItem(progressKey, JSON.stringify(learnedWords));
      }
      
      return learnedWords;
    } catch (error) {
      console.error('Error getting progress from server:', error);
      // Пробуем получить из локального кеша
      const cached = await getCachedProgress(dictionaryId);
      if (cached && cached.length > 0) {
        return cached;
      }
      
      // Пробуем из localStorage
      const progressKey = `dict_${dictionaryId}_progress`;
      const stored = localStorage.getItem(progressKey);
      if (stored) {
        return JSON.parse(stored);
      }
      
      return [];
    }
  } else {
    // Офлайн - используем локальный кеш
    const cached = await getCachedProgress(dictionaryId);
    if (cached && cached.length > 0) {
      return cached;
    }
    
    // Пробуем из localStorage
    const progressKey = `dict_${dictionaryId}_progress`;
    const stored = localStorage.getItem(progressKey);
    if (stored) {
      return JSON.parse(stored);
    }
    
    return [];
  }
};

