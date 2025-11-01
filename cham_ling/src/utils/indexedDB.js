/**
 * Утилита для работы с IndexedDB для офлайн хранения данных.
 * 
 * Хранит словари и слова пользователя для работы без интернета.
 * 
 * @module utils/indexedDB
 */

const DB_NAME = 'chamling_db';
const DB_VERSION = 2;
const STORES = {
  DICTIONARIES: 'dictionaries',
  WORDS: 'words',
  PROGRESS: 'progress',
  SYNC_QUEUE: 'sync_queue',
};

let db = null;

/**
 * Открывает подключение к IndexedDB.
 * 
 * @returns {Promise<IDBDatabase>} Объект базы данных
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Создаём хранилище для словарей
      if (!database.objectStoreNames.contains(STORES.DICTIONARIES)) {
        const dictStore = database.createObjectStore(STORES.DICTIONARIES, { keyPath: 'id' });
        dictStore.createIndex('owner', 'owner', { unique: false });
        dictStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // Создаём хранилище для слов
      if (!database.objectStoreNames.contains(STORES.WORDS)) {
        const wordsStore = database.createObjectStore(STORES.WORDS, { keyPath: 'id' });
        wordsStore.createIndex('dictionary', 'dictionary', { unique: false });
        wordsStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // Создаём хранилище для прогресса изучения
      if (!database.objectStoreNames.contains(STORES.PROGRESS)) {
        const progressStore = database.createObjectStore(STORES.PROGRESS, { keyPath: ['user_id', 'dictionary_id'] });
        progressStore.createIndex('dictionary_id', 'dictionary_id', { unique: false });
        progressStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // Создаём хранилище для очереди синхронизации
      if (!database.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = database.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
};

/**
 * Сохраняет список словарей в IndexedDB.
 * 
 * @param {Array} dictionaries - Массив словарей для сохранения
 * @returns {Promise<void>}
 */
export const saveDictionaries = async (dictionaries) => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORES.DICTIONARIES], 'readwrite');
    const store = transaction.objectStore(STORES.DICTIONARIES);

    // Очищаем старые данные и добавляем новые
    await store.clear();
    
    const promises = dictionaries.map(dict => {
      const dictWithTimestamp = {
        ...dict,
        updated_at: new Date().toISOString(),
        cached: true
      };
      return store.put(dictWithTimestamp);
    });

    await Promise.all(promises);
    console.log('Dictionaries saved to IndexedDB:', dictionaries.length);
  } catch (error) {
    console.error('Error saving dictionaries to IndexedDB:', error);
    throw error;
  }
};

/**
 * Получает все словари из IndexedDB.
 * 
 * @returns {Promise<Array>} Массив словарей из кеша
 */
export const getCachedDictionaries = async () => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORES.DICTIONARIES], 'readonly');
    const store = transaction.objectStore(STORES.DICTIONARIES);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting cached dictionaries:', error);
    return [];
  }
};

/**
 * Получает словарь по ID из IndexedDB.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @returns {Promise<Object|null>} Словарь или null если не найден
 */
export const getCachedDictionary = async (dictionaryId) => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORES.DICTIONARIES], 'readonly');
    const store = transaction.objectStore(STORES.DICTIONARIES);
    const request = store.get(Number(dictionaryId));

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting cached dictionary:', error);
    return null;
  }
};

/**
 * Сохраняет слова словаря в IndexedDB.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @param {Array} words - Массив слов для сохранения
 * @returns {Promise<void>}
 */
export const saveWords = async (dictionaryId, words) => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORES.WORDS], 'readwrite');
    const store = transaction.objectStore(STORES.WORDS);

    // Удаляем старые слова этого словаря
    const index = store.index('dictionary');
    const request = index.getAll(Number(dictionaryId));
    
    await new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const oldWords = request.result;
        for (const word of oldWords) {
          await store.delete(word.id);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    // Сохраняем новые слова
    const promises = words.map(word => {
      const wordWithTimestamp = {
        ...word,
        dictionary: Number(dictionaryId),
        updated_at: new Date().toISOString(),
        cached: true
      };
      return store.put(wordWithTimestamp);
    });

    await Promise.all(promises);
    console.log(`Words for dictionary ${dictionaryId} saved to IndexedDB:`, words.length);
  } catch (error) {
    console.error('Error saving words to IndexedDB:', error);
    throw error;
  }
};

/**
 * Получает слова словаря из IndexedDB.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @returns {Promise<Array>} Массив слов из кеша
 */
export const getCachedWords = async (dictionaryId) => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORES.WORDS], 'readonly');
    const store = transaction.objectStore(STORES.WORDS);
    const index = store.index('dictionary');
    const request = index.getAll(Number(dictionaryId));

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting cached words:', error);
    return [];
  }
};

/**
 * Проверяет наличие офлайн данных для словаря.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @returns {Promise<boolean>} True если данные есть в кеше
 */
export const hasCachedDictionary = async (dictionaryId) => {
  const dictionary = await getCachedDictionary(dictionaryId);
  return dictionary !== null;
};

/**
 * Сохраняет прогресс изучения словаря в IndexedDB.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @param {Array} learnedWords - Массив ID изученных слов
 * @returns {Promise<void>}
 */
export const saveProgress = async (dictionaryId, learnedWords) => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORES.PROGRESS], 'readwrite');
    const store = transaction.objectStore(STORES.PROGRESS);

    // Получаем user_id из токена (из localStorage)
    const token = localStorage.getItem('accessToken');
    // Для простоты используем ID пользователя из токена (можно декодировать JWT)
    // Пока используем словарь + слова
    const userId = token ? 'current_user' : 'anonymous';

    const progress = {
      user_id: userId,
      dictionary_id: Number(dictionaryId),
      learned_words: learnedWords,
      updated_at: new Date().toISOString(),
      cached: true
    };

    await store.put(progress);
    console.log(`Progress for dictionary ${dictionaryId} saved to IndexedDB`);
  } catch (error) {
    console.error('Error saving progress to IndexedDB:', error);
    throw error;
  }
};

/**
 * Получает прогресс изучения словаря из IndexedDB.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @returns {Promise<Array>} Массив ID изученных слов
 */
export const getCachedProgress = async (dictionaryId) => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORES.PROGRESS], 'readonly');
    const store = transaction.objectStore(STORES.PROGRESS);

    const userId = localStorage.getItem('accessToken') ? 'current_user' : 'anonymous';
    const key = [userId, Number(dictionaryId)];
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const progress = request.result;
        if (progress && progress.learned_words) {
          resolve(progress.learned_words);
        } else {
          resolve([]);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting cached progress:', error);
    return [];
  }
};

/**
 * Добавляет действие в очередь синхронизации.
 * 
 * @param {string} type - Тип действия ('progress', 'word', и т.д.)
 * @param {Object} data - Данные для синхронизации
 * @returns {Promise<number>} ID задачи в очереди
 */
export const addToSyncQueue = async (type, data) => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    const queueItem = {
      type,
      data,
      status: 'pending',
      created_at: new Date().toISOString(),
      attempts: 0
    };

    const request = store.add(queueItem);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
};

/**
 * Получает все задачи из очереди синхронизации.
 * 
 * @param {string} [status='pending'] - Статус задач для получения
 * @returns {Promise<Array>} Массив задач из очереди
 */
export const getSyncQueue = async (status = 'pending') => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');
    const request = index.getAll(status);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

/**
 * Удаляет задачу из очереди синхронизации.
 * 
 * @param {number} queueId - ID задачи для удаления
 * @returns {Promise<void>}
 */
export const removeFromSyncQueue = async (queueId) => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    await store.delete(queueId);
    console.log(`Removed sync queue item ${queueId}`);
  } catch (error) {
    console.error('Error removing from sync queue:', error);
    throw error;
  }
};

/**
 * Обновляет статус задачи в очереди синхронизации.
 * 
 * @param {number} queueId - ID задачи
 * @param {string} status - Новый статус ('pending', 'syncing', 'completed', 'failed')
 * @returns {Promise<void>}
 */
export const updateSyncQueueStatus = async (queueId, status) => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    const request = store.get(queueId);
    await new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const item = request.result;
        if (item) {
          item.status = status;
          item.attempts = item.attempts ? item.attempts + 1 : 1;
          if (status === 'completed') {
            item.completed_at = new Date().toISOString();
          }
          await store.put(item);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error updating sync queue status:', error);
    throw error;
  }
};

/**
 * Очищает все данные из IndexedDB.
 * 
 * @returns {Promise<void>}
 */
export const clearCache = async () => {
  try {
    const database = await openDB();
    const dictTransaction = database.transaction([STORES.DICTIONARIES], 'readwrite');
    await dictTransaction.objectStore(STORES.DICTIONARIES).clear();

    const wordsTransaction = database.transaction([STORES.WORDS], 'readwrite');
    await wordsTransaction.objectStore(STORES.WORDS).clear();

    const progressTransaction = database.transaction([STORES.PROGRESS], 'readwrite');
    await progressTransaction.objectStore(STORES.PROGRESS).clear();

    console.log('IndexedDB cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
};

