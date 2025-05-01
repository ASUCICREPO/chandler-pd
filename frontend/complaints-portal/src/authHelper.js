import axios from "axios";
import { jwtDecode } from "jwt-decode";

const { VITE_AUTH_ENDPOINT: AUTH_ENDPOINT, VITE_CLIENT_ID: CLIENT_ID, VITE_TOKEN_LOGOUT: TOKEN_LOGOUT, VITE_CLIENT_SECRET: CLIENT_SECRET, VITE_REDIRECT_URI: REDIRECT_URI, VITE_TOKEN_ENDPOINT: TOKEN_ENDPOINT } = import.meta.env;

export const fetchToken = async (code) => {
  const response = await axios.post(TOKEN_ENDPOINT, {
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const { access_token, id_token } = response.data;

  return { access_token, id_token };
};

export const decodeIdToken = (idToken) => {
  return jwtDecode(idToken);
};

export const performLogout = async () => {
  try {
    const response = await axios.get(TOKEN_LOGOUT, { withCredentials: true });

    if (response.data.status === "SUCCESS") {
      const logoutUrl = `${TOKEN_LOGOUT}?post_logout_redirect_uri=${encodeURIComponent(REDIRECT_URI)}&prompt=login`;
      window.location.href = logoutUrl;
    } else {
      console.error("Logout failed", response.data);
    }
  } catch (err) {
    console.error("Logout error:", err);
  }
};
