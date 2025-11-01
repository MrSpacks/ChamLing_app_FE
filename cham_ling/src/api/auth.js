/**
 * API клиент для работы с backend ChamLing.
 * 
 * Этот модуль содержит все функции для взаимодействия с REST API:
 * - Аутентификация (регистрация, логин, обновление токенов)
 * - Управление словарями (CRUD операции)
 * - Управление словами
 * - Покупка словарей
 * 
 * Поддерживает офлайн режим через IndexedDB для просмотра словарей и изучения слов.
 * 
 * @module api/auth
 */

// Импорты для работы с офлайн кешем
import {
  saveDictionaries,
  getCachedDictionaries,
  getCachedDictionary,
  saveWords,
  getCachedWords,
} from '../utils/indexedDB';
import { isOnline } from '../utils/offlineStatus';

// Базовый URL API. Используется переменная окружения или localhost:8000 по умолчанию
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Регистрирует нового пользователя в системе.
 * 
 * Отправляет запрос на создание нового пользователя и возвращает JWT токены
 * (access и refresh) для автоматической авторизации после регистрации.
 * 
 * @param {string} username - Имя пользователя (уникальное, обязательно)
 * @param {string} email - Email пользователя (уникальный, обязательно)
 * @param {string} password - Пароль пользователя (обязательно)
 * @returns {Promise<Object>} Объект с access и refresh токенами: { access, refresh }
 * @throws {Error} Ошибка, если регистрация не удалась (email/username уже существует)
 * 
 * @example
 * const { access, refresh } = await registerUser('john', 'john@example.com', 'password123');
 * localStorage.setItem('accessToken', access);
 * localStorage.setItem('refreshToken', refresh);
 */
export async function registerUser(username, email, password) {
  const res = await fetch(`${API_URL}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  return data; // { access, refresh }
}

/**
 * Авторизует существующего пользователя в системе.
 * 
 * Проверяет учётные данные пользователя и возвращает JWT токены.
 * Токены автоматически сохраняются в localStorage для последующих запросов.
 * 
 * @param {string} email - Email пользователя (обязательно)
 * @param {string} password - Пароль пользователя (обязательно)
 * @returns {Promise<Object>} Объект с access и refresh токенами: { access, refresh }
 * @throws {Error} Ошибка, если учётные данные неверны
 * 
 * @example
 * const { access, refresh } = await loginUser('john@example.com', 'password123');
 * // Токены уже сохранены в localStorage автоматически
 */
export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    console.error("Login error:", err); // Полная ошибка
    throw new Error(err.detail || "Login failed");
  }

  const data = await response.json();
  localStorage.setItem("accessToken", data.access);
  localStorage.setItem("refreshToken", data.refresh);
  return data;
}

/**
 * Обновляет access токен используя refresh токен.
 * 
 * Внутренняя функция для автоматического обновления истёкших access токенов.
 * Используется в apiRequest() при получении 401 ответа.
 * 
 * @private
 * @returns {Promise<string>} Новый access токен
 * @throws {Error} Ошибка, если refresh токен невалиден или отсутствует
 * 
 * @example
 * const newAccessToken = await refreshAccessToken();
 * localStorage.setItem('accessToken', newAccessToken);
 */
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      // Если refresh токен невалиден, очищаем хранилище
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      throw new Error("Token refresh failed");
    }

    const data = await response.json();
    localStorage.setItem("accessToken", data.access);
    
    // Если пришел новый refresh токен, сохраняем его
    if (data.refresh) {
      localStorage.setItem("refreshToken", data.refresh);
    }

    return data.access;
  } catch (error) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    throw error;
  }
}

/**
 * Универсальная функция для выполнения авторизованных API запросов.
 * 
 * Автоматически добавляет JWT токен в заголовки запроса и обрабатывает
 * истёкшие токены, пытаясь обновить их через refresh токен.
 * 
 * При отсутствии токена или неудачном обновлении перенаправляет
 * пользователя на страницу регистрации.
 * 
 * @param {string} endpoint - API endpoint (например, '/api/dictionaries/')
 * @param {Object} [options={}] - Опции fetch запроса (method, headers, body и т.д.)
 * @param {string} [options.method='GET'] - HTTP метод запроса
 * @param {Object} [options.headers={}] - Дополнительные заголовки запроса
 * @param {string|Object} [options.body] - Тело запроса (будет преобразовано в JSON, если объект)
 * @returns {Promise<Response>} Response объект от fetch API
 * @throws {Error} Ошибка, если токен отсутствует или пользователь не авторизован
 * 
 * @example
 * // GET запрос
 * const response = await apiRequest('/api/dictionaries/');
 * const dictionaries = await response.json();
 * 
 * // POST запрос с телом
 * const response = await apiRequest('/api/dictionaries/create/', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'My Dictionary', ... })
 * });
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("accessToken");

  // Если токена нет, перенаправляем на логин
  if (!token) {
    console.warn("No access token found. Redirecting to login.");
    window.location.href = "/register";
    throw new Error("Unauthorized: No token");
  }

  const config = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  // Сохраняем оригинальные headers, если они были переданы
  if (options.headers) {
    Object.assign(config.headers, options.headers);
  }

  config.headers.Authorization = `Bearer ${token}`;

  let response = await fetch(`${API_URL}${endpoint}`, config);

  // Если получили 401, пытаемся обновить токен и повторить запрос
  if (response.status === 401) {
    try {
      const newAccessToken = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${newAccessToken}`;
      response = await fetch(`${API_URL}${endpoint}`, config);
      
      // Если после обновления все еще 401, значит пользователь должен залогиниться заново
      if (response.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/register";
        throw new Error("Unauthorized: Please login again");
      }
    } catch (error) {
      // Если обновление не удалось, очищаем токены и перенаправляем
      console.error("Token refresh failed:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/register";
      throw error;
    }
  }

  return response;
}

/**
 * Создаёт новый словарь для текущего пользователя.
 * 
 * Поддерживает загрузку обложки как через файл (FormData),
 * так и через JSON данные.
 * 
 * @param {Object|FormData} data - Данные словаря (name, description, source_lang, и т.д.)
 * @param {boolean} [isFormData=false] - Если true, отправляет FormData для загрузки файла
 * @returns {Promise<Response>} Response объект от fetch API
 * 
 * @example
 * // Создание словаря с JSON данными
 * const response = await createDictionary({
 *   name: 'English-Russian',
 *   description: 'Basic words',
 *   source_lang: 'en',
 *   target_lang: 'ru'
 * });
 * 
 * @example
 * // Создание словаря с загрузкой файла
 * const formData = new FormData();
 * formData.append('name', 'My Dictionary');
 * formData.append('cover_image_file', file);
 * const response = await createDictionary(formData, true);
 */
export const createDictionary = (data, isFormData = false) => {
  const token = localStorage.getItem("accessToken");
  
  const config = {
    method: "POST",
    headers: {},
  };
  
  // Если FormData - не устанавливаем Content-Type, браузер установит автоматически с boundary
  if (isFormData && data instanceof FormData) {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.body = data;
  } else {
    // Для JSON данных
    config.headers["Content-Type"] = "application/json";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.body = JSON.stringify(data);
  }
  
  return fetch(`${API_URL}/api/dictionaries/create/`, config);
};

/**
 * Получает список всех словарей текущего пользователя.
 * 
 * Включает как созданные пользователем словари, так и купленные.
 * Поддерживает офлайн режим - использует кеш IndexedDB если нет интернета.
 * 
 * @returns {Promise<Array>} Массив объектов словарей
 * @throws {Error} Ошибка, если запрос не удался и нет данных в кеше
 * 
 * @example
 * const dictionaries = await getUserDictionaries();
 * dictionaries.forEach(dict => console.log(dict.name));
 */
export const getUserDictionaries = async () => {
  try {
    const response = await apiRequest("/api/dictionaries/", {
      method: "GET",
    });
    
    if (!response.ok) {
      // Если офлайн, пробуем получить из кеша
      if (!isOnline()) {
        const cached = await getCachedDictionaries();
        if (cached && cached.length > 0) {
          console.log('Using cached dictionaries (offline mode)');
          return cached;
        }
      }
      throw new Error("Ошибка при загрузке словарей");
    }
    
    const data = await response.json();
    
    // Сохраняем в кеш для офлайн использования
    if (isOnline() && data && data.length > 0) {
      try {
        await saveDictionaries(data);
      } catch (error) {
        console.error('Error saving dictionaries to cache:', error);
      }
    }
    
    return data;
  } catch (error) {
    // Если ошибка сети и есть кеш - используем его
    if (!isOnline()) {
      const cached = await getCachedDictionaries();
      if (cached && cached.length > 0) {
        console.log('Using cached dictionaries (offline mode)');
        return cached;
      }
    }
    throw error;
  }
};

/**
 * Получает список словарей, выставленных на продажу (marketplace).
 * 
 * Публичный endpoint, работает без авторизации, но если пользователь
 * авторизован, в ответе указывается is_owner для каждого словаря.
 * 
 * @returns {Promise<Array>} Массив объектов словарей на продажу
 * @throws {Error} Ошибка, если запрос не удался
 * 
 * @example
 * const marketplaceDicts = await getMarketplaceDictionaries();
 * marketplaceDicts.forEach(dict => {
 *   console.log(`${dict.name} - ${dict.price}$`);
 * });
 */
export const getMarketplaceDictionaries = async () => {
  const token = localStorage.getItem("accessToken");
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  // Если есть токен, добавляем его для определения is_owner
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}/api/marketplace/`, {
    method: "GET",
    headers: headers,
  });
  if (!response.ok) {
    throw new Error("Ошибка при загрузке магазина");
  }
  return response.json();
};

/**
 * Получает детальную информацию о словаре по ID.
 * 
 * Пользователь может получить детали только своих словарей
 * или купленных словарей.
 * Поддерживает офлайн режим - использует кеш IndexedDB если нет интернета.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @returns {Promise<Object>} Объект словаря с полной информацией
 * @throws {Error} Ошибка, если словарь не найден или нет доступа и нет в кеше
 * 
 * @example
 * const dictionary = await getDictionaryDetails(1);
 * console.log(`${dictionary.name}: ${dictionary.word_count} words`);
 */
export const getDictionaryDetails = async (dictionaryId) => {
  try {
    const response = await apiRequest(`/api/dictionaries/${dictionaryId}/`, {
      method: "GET",
    });
    
    if (!response.ok) {
      // Если офлайн, пробуем получить из кеша
      if (!isOnline()) {
        const cached = await getCachedDictionary(dictionaryId);
        if (cached) {
          console.log('Using cached dictionary (offline mode)');
          return cached;
        }
      }
      throw new Error("Ошибка при загрузке словаря");
    }
    
    const data = await response.json();
    
    // Обновляем кеш (добавляем или обновляем словарь)
    if (isOnline() && data) {
      try {
        const allDictionaries = await getCachedDictionaries();
        const updated = allDictionaries.map(d => 
          d.id === data.id ? { ...data, updated_at: new Date().toISOString() } : d
        );
        if (!updated.find(d => d.id === data.id)) {
          updated.push({ ...data, updated_at: new Date().toISOString() });
        }
        await saveDictionaries(updated);
      } catch (error) {
        console.error('Error updating dictionary cache:', error);
      }
    }
    
    return data;
  } catch (error) {
    // Если ошибка сети и есть кеш - используем его
    if (!isOnline()) {
      const cached = await getCachedDictionary(dictionaryId);
      if (cached) {
        console.log('Using cached dictionary (offline mode)');
        return cached;
      }
    }
    throw error;
  }
};

/**
 * Обновляет существующий словарь.
 * 
 * Только владелец словаря может обновлять его данные.
 * Поддерживает загрузку новой обложки через FormData.
 * 
 * @param {number|string} dictionaryId - ID словаря для обновления
 * @param {Object|FormData} data - Данные для обновления
 * @param {boolean} [isFormData=false] - Если true, отправляет FormData
 * @returns {Promise<Response>} Response объект от fetch API
 * @throws {Error} Ошибка, если пользователь не владелец словаря
 * 
 * @example
 * await updateDictionary(1, {
 *   name: 'Updated Name',
 *   description: 'Updated description'
 * });
 */
export const updateDictionary = async (dictionaryId, data, isFormData = false) => {
  const token = localStorage.getItem("accessToken");
  
  const config = {
    method: "PUT",
    headers: {},
  };
  
  if (isFormData && data instanceof FormData) {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.body = data;
  } else {
    config.headers["Content-Type"] = "application/json";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.body = JSON.stringify(data);
  }
  
  return fetch(`${API_URL}/api/dictionaries/${dictionaryId}/`, config);
};

/**
 * Удаляет словарь по ID.
 * 
 * Только владелец словаря может удалить его.
 * 
 * @param {number|string} dictionaryId - ID словаря для удаления
 * @returns {Promise<Response>} Response объект от fetch API (204 No Content при успехе)
 * @throws {Error} Ошибка, если словарь не найден или пользователь не владелец
 * 
 * @example
 * await deleteDictionary(1);
 * console.log('Dictionary deleted successfully');
 */
export const deleteDictionary = async (dictionaryId) => {
  const response = await apiRequest(`/api/dictionaries/${dictionaryId}/`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Ошибка при удалении словаря");
  }
  return response;
};

/**
 * Получает список всех слов в словаре.
 * 
 * Пользователь может получить слова только своих словарей
 * или купленных словарей.
 * Поддерживает офлайн режим - использует кеш IndexedDB если нет интернета.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @returns {Promise<Array>} Массив объектов слов
 * @throws {Error} Ошибка, если нет доступа к словарю и нет данных в кеше
 * 
 * @example
 * const words = await getDictionaryWords(1);
 * words.forEach(word => console.log(`${word.word} -> ${word.translation}`));
 */
export const getDictionaryWords = async (dictionaryId) => {
  try {
    const response = await apiRequest(`/api/dictionaries/${dictionaryId}/words/`, {
      method: "GET",
    });
    
    if (!response.ok) {
      // Если офлайн, пробуем получить из кеша
      if (!isOnline()) {
        const cached = await getCachedWords(dictionaryId);
        if (cached && cached.length > 0) {
          console.log('Using cached words (offline mode)');
          return cached;
        }
      }
      throw new Error("Ошибка при загрузке слов");
    }
    
    const data = await response.json();
    
    // Сохраняем в кеш для офлайн использования
    if (isOnline() && data && data.length > 0) {
      try {
        await saveWords(dictionaryId, data);
      } catch (error) {
        console.error('Error saving words to cache:', error);
      }
    }
    
    return data;
  } catch (error) {
    // Если ошибка сети и есть кеш - используем его
    if (!isOnline()) {
      try {
        const cached = await getCachedWords(dictionaryId);
        if (cached && cached.length > 0) {
          console.log('Using cached words (offline mode)');
          return cached;
        }
      } catch (cacheError) {
        console.error('Error getting cached words:', cacheError);
      }
    }
    throw error;
  }
};

/**
 * Добавляет новое слово в словарь.
 * 
 * Только владелец словаря может добавлять слова.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @param {Object} wordData - Данные слова (word, translation, image_url, example)
 * @returns {Promise<Response>} Response объект от fetch API
 * @throws {Error} Ошибка, если пользователь не владелец словаря
 * 
 * @example
 * await addWordToDictionary(1, {
 *   word: 'hello',
 *   translation: 'привет',
 *   image_url: 'https://example.com/image.jpg'
 * });
 */
export const addWordToDictionary = async (dictionaryId, wordData) => {
  const token = localStorage.getItem("accessToken");
  
  const config = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const data = {
    ...wordData,
    dictionary_id: dictionaryId,
  };
  
  config.body = JSON.stringify(data);
  
  return fetch(`${API_URL}/api/words/create/`, config);
};

/**
 * Покупает словарь для текущего пользователя.
 * 
 * Симуляция платежа через код 1013 (для демонстрации).
 * После покупки пользователь получает доступ к словарю.
 * 
 * @param {number|string} dictionaryId - ID словаря для покупки
 * @param {string} paymentCode - Код оплаты (должен быть "1013")
 * @param {string} [accessType='permanent'] - Тип доступа: 'permanent' или 'temporary'
 * @returns {Promise<Object>} Объект с информацией о покупке
 * @throws {Error} Ошибка, если код неверен, словарь уже куплен или не на продажу
 * 
 * @example
 * const purchase = await purchaseDictionary(1, '1013', 'permanent');
 * console.log(`Purchased: ${purchase.dictionary_name}`);
 */
export const purchaseDictionary = async (dictionaryId, paymentCode, accessType = 'permanent') => {
  const token = localStorage.getItem("accessToken");
  
  if (!token) {
    throw new Error("Требуется авторизация");
  }
  
  const response = await fetch(`${API_URL}/api/dictionaries/${dictionaryId}/purchase/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      payment_code: paymentCode,
      access_type: accessType,
    }),
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Ошибка при покупке словаря");
  }
  
  return response.json();
};

/**
 * Получает профиль текущего пользователя.
 * 
 * Возвращает информацию о пользователе и настройки уведомлений.
 * 
 * @returns {Promise<Object>} Объект профиля пользователя с настройками
 * @throws {Error} Ошибка, если запрос не удался
 * 
 * @example
 * const profile = await getUserProfile();
 * console.log(`Username: ${profile.username}`);
 * console.log(`Notifications enabled: ${profile.notifications_enabled}`);
 */
export const getUserProfile = async () => {
  const response = await apiRequest("/api/user/profile/", {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Ошибка при загрузке профиля");
  }
  return response.json();
};

/**
 * Обновляет настройки профиля пользователя.
 * 
 * Позволяет обновить настройки уведомлений (включить/выключить, установить время).
 * 
 * @param {Object} profileData - Данные для обновления профиля
 * @param {boolean} [profileData.notifications_enabled] - Включить/выключить уведомления
 * @param {number} [profileData.notification_hour] - Час для уведомления (0-23)
 * @param {number} [profileData.notification_minute] - Минута для уведомления (0-59)
 * @returns {Promise<Object>} Обновлённый профиль пользователя
 * @throws {Error} Ошибка, если валидация не прошла
 * 
 * @example
 * await updateUserProfile({
 *   notifications_enabled: true,
 *   notification_hour: 9,
 *   notification_minute: 0
 * });
 */
export const updateUserProfile = async (profileData) => {
  const response = await apiRequest("/api/user/profile/", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.notification_hour?.[0] || "Ошибка при обновлении профиля");
  }
  return response.json();
};

/**
 * Получает прогресс изучения словаря для текущего пользователя.
 * 
 * Поддерживает офлайн режим - использует кеш IndexedDB если нет интернета.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @returns {Promise<Object>} Объект прогресса (learned_words, learned_words_count, progress_percentage)
 * @throws {Error} Ошибка, если нет доступа к словарю
 * 
 * @example
 * const progress = await getLearningProgress(1);
 * console.log(`Изучено слов: ${progress.learned_words_count}`);
 */
export const getLearningProgress = async (dictionaryId) => {
  try {
    const response = await apiRequest(`/api/dictionaries/${dictionaryId}/progress/`, {
      method: "GET",
    });
    
    if (!response.ok) {
      // Если офлайн, пробуем получить из кеша
      if (!isOnline()) {
        const { getCachedProgress } = await import('../utils/indexedDB');
        const learnedWords = await getCachedProgress(dictionaryId);
        return {
          learned_words: learnedWords,
          learned_words_count: learnedWords.length,
          progress_percentage: 0,
        };
      }
      throw new Error("Ошибка при загрузке прогресса");
    }
    
    return response.json();
  } catch (error) {
    // Если ошибка сети и есть кеш - используем его
    if (!isOnline()) {
      const { getCachedProgress } = await import('../utils/indexedDB');
      const learnedWords = await getCachedProgress(dictionaryId);
      return {
        learned_words: learnedWords,
        learned_words_count: learnedWords.length,
        progress_percentage: 0,
      };
    }
    throw error;
  }
};

/**
 * Сохраняет прогресс изучения словаря на сервер.
 * 
 * Сохраняет массив ID изученных слов для синхронизации между устройствами.
 * 
 * @param {number|string} dictionaryId - ID словаря
 * @param {Array<number>} learnedWords - Массив ID изученных слов
 * @returns {Promise<Object>} Обновлённый объект прогресса
 * @throws {Error} Ошибка, если сохранение не удалось
 * 
 * @example
 * await saveLearningProgress(1, [1, 5, 12, 23]);
 */
export const saveLearningProgress = async (dictionaryId, learnedWords) => {
  const response = await apiRequest(`/api/dictionaries/${dictionaryId}/progress/`, {
    method: "POST",
    body: JSON.stringify({
      learned_words: learnedWords
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Ошибка при сохранении прогресса");
  }
  
  return response.json();
};
