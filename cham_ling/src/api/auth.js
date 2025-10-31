const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Регистрация пользователя
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

// Логин пользователя
export async function loginUser(email, password) {
  console.log("Sending login request with:", { email, password }); // Отладка
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

// Обновление токена
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

// Универсальная функция с токеном и автоматическим обновлением
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

// Создание словаря
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

// Получение списка словарей пользователя
export const getUserDictionaries = async () => {
  const response = await apiRequest("/api/dictionaries/", {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Ошибка при загрузке словарей");
  }
  return response.json();
};

// Получение словарей на продажу (marketplace)
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

// Получение деталей словаря
export const getDictionaryDetails = async (dictionaryId) => {
  const response = await apiRequest(`/api/dictionaries/${dictionaryId}/`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Ошибка при загрузке словаря");
  }
  return response.json();
};

// Обновление словаря
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

// Удаление словаря
export const deleteDictionary = async (dictionaryId) => {
  const response = await apiRequest(`/api/dictionaries/${dictionaryId}/`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Ошибка при удалении словаря");
  }
  return response;
};

// Получение слов словаря
export const getDictionaryWords = async (dictionaryId) => {
  const response = await apiRequest(`/api/dictionaries/${dictionaryId}/words/`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Ошибка при загрузке слов");
  }
  return response.json();
};

// Добавление слова в словарь
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

// Покупка словаря
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
