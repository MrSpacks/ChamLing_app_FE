const API_URL = process.env.REACT_APP_API_URL;

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
