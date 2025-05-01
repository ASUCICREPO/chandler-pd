// App.jsx
import "./index.css";
import "./App.css";

import React, { useEffect, useState } from "react";
import { Box, Button, Stack, CircularProgress, Typography } from "@mui/material";
import { ToastContainer } from "react-toastify";
import useStore from "./store/store";
import LeftPanel from "./components/LeftPanel";
import MainPage from "./components/MainPage";
import loadinggif from "./assets/loading.gif";
import { fetchToken, decodeIdToken, performLogout } from "./authHelper";

const { VITE_AUTH_ENDPOINT: AUTH_ENDPOINT, VITE_CLIENT_ID: CLIENT_ID, VITE_REDIRECT_URI: REDIRECT_URI, VITE_TOKEN_LOGOUT: TOKEN_LOGOUT } = import.meta.env;

function AuthenticatedApp({ signOut }) {
  return (
    <>
      <Stack direction={"row"} sx={{ height: "100%" }}>
        <Box sx={{ width: "20rem" }}>
          <LeftPanel signOut={signOut} />
        </Box>
        <Box sx={{ width: "calc(100% - 20rem)", overflowY: "hiden" }}>
          <MainPage />
        </Box>
      </Stack>
      <ToastContainer />
    </>
  );
}

export default function App() {
  const { setAuthentication, setIsAdmin } = useStore();
  const [username, setUsername] = useState("");
  const [idToken, setIdToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (idToken) {
          const decoded = decodeIdToken(idToken);
          setUsername(decoded.username);
          setAuthentication(true);

          const isAdminUser = decoded.userinfo.roles[0] === "administrator";
          setIsAdmin(isAdminUser);
        } else if (code) {
          const { id_token } = await fetchToken(code);
          const decoded = decodeIdToken(id_token);

          setIdToken(id_token);
          setUsername(decoded.username);
          setAuthentication(true);
          const isAdminUser = decoded.userinfo.roles[0] === "administrator";
          setIsAdmin(isAdminUser);

          window.history.replaceState({}, document.title, "/");
        } else {
          window.location.href = `${AUTH_ENDPOINT}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=openid%20email%20profile`;
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setAuthentication(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [idToken]);

  const handleLogout = async () => {
    performLogout();
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: "100vh" }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <div className="App">
      <main>
        <header className="App-header">
          {username ? (
            <AuthenticatedApp signOut={handleLogout} />
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ height: "100vh" }}>
              <>
                <img src={loadinggif} alt="Loading" style={{ width: "120px", height: "120px" }} />
                <Typography>Loading your session...</Typography>
              </>
            </Stack>
          )}
        </header>
      </main>
      <ToastContainer />
    </div>
  );
}
