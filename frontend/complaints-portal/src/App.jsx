/* The code has been intentionally commented for the deployment phase 1 which excludes Authentication Module
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import awsExports from "./aws-exports";
Amplify.configure(awsExports);
import { fetchAuthSession } from "aws-amplify/auth"; */

import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import { Box, Stack } from "@mui/material";
import LeftPanel from "./components/LeftPanel";
import MainPage from "./components/MainPage";
import { ToastContainer } from "react-toastify";
import useStore from "./store/store";

const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH || "DISABLED";

function AuthenticatedApp({ signOut }) {
  return (
    <Router>
      <Stack direction={"row"} sx={{ height: "100%" }}>
        <Box sx={{ width: "20rem" }}>
          <LeftPanel signOut={signOut} />
        </Box>
        <Box sx={{ width: "calc(100% - 20rem)", overflowY: "hidden" }}>
          <MainPage />
        </Box>
      </Stack>
      <ToastContainer />
    </Router>
  );
}

function App() {
  const { setAuthentication, setIsAdmin } = useStore();

  /* The code has been intentionally commented for the deployment phase 1 which excludes Authentication Module
    useEffect(() => {
    if (!ENABLE_AUTH) {
      setAuthentication(true); // Auth disabled = always authenticated
      setIsAdmin(true); // Optional: enable admin features in no-auth mode
      return;
    }

   const checkAuthSession = async () => {
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();

        if (idToken) {
          const payload = JSON.parse(atob(idToken.split(".")[1]));
          const isAdminUser = payload["custom:isAdmin"] === "true" || (payload["cognito:groups"] && payload["cognito:groups"].includes("Admins"));

          setAuthentication(true);
          setIsAdmin(isAdminUser);
        }
      } catch (error) {
        console.log("No authenticated session:", error);
        setAuthentication(false);
      }
    };

    checkAuthSession();
  }, []); */

  return (
    <div className="App">
      {/* The code has been intentionally commented for the deployment phase 1 which excludes Authentication Module */}
      {/* {ENABLE_AUTH ? (
        <Authenticator>
          {({ signOut }) => (
            <main>
              <header className="App-header">
                <AuthenticatedApp signOut={signOut} />
              </header>
            </main>
          )}
        </Authenticator>
      ) : ( */}
      <main>
        <header className="App-header">
          <AuthenticatedApp />
        </header>
      </main>
      {/* )} */}
    </div>
  );
}

export default App;
