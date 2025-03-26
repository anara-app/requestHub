export const LS_TOKEN_KEY = "token";

function getToken() {
  return localStorage.getItem(LS_TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(LS_TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(LS_TOKEN_KEY);
}   

export const TokenManager = { getToken, setToken, removeToken };
