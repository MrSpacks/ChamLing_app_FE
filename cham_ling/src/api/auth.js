const API_URL = process.env.REACT_APP_API_URL;

// Регистрация пользователя
export async function registerUser(email, password) {
  const res = await fetch(`${API_URL}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  return data; // { access, refresh }
}

// Логин пользователя
export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Login failed");
  }

  const data = await response.json(); // { access, refresh }
  localStorage.setItem("accessToken", data.access);
  localStorage.setItem("refreshToken", data.refresh); // Если используется
  return data;
}
