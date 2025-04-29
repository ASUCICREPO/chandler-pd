// authHelper.js
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const { VITE_CLIENT_ID: CLIENT_ID, VITE_CLIENT_SECRET: CLIENT_SECRET, VITE_REDIRECT_URI: REDIRECT_URI, VITE_TOKEN_ENDPOINT: TOKEN_ENDPOINT } = import.meta.env;

export const fetchToken = async (code) => {
  const response = await axios.post(TOKEN_ENDPOINT, {
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  return response.data; // { access_token, id_token }
};

export const decodeIdToken = (idToken) => {
  return jwtDecode(idToken);
};
