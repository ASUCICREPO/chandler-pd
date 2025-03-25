import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";

import { Box, Stack } from "@mui/material";
import LeftPanel from "./components/LeftPanel";
import MainPage from "./components/MainPage";
import React, { useEffect } from "react";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <Router>
        <Stack direction={"row"} sx={{ height: "100%" }}>
          <Box sx={{ width: "20rem" }}>
            <LeftPanel />
          </Box>
          <Box sx={{ width: "calc(100% - 20rem)", overflowY: "hidden" }}>
            <MainPage />
          </Box>
        </Stack>
        <ToastContainer />
      </Router>
    </>
  );
}

export default React.memo(App);
