import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#333A45",
      // 50: primary_50,
    },
    secondary: {
      main: "#F7EDE1",
    },
    background: {
      default: "#FBFBF8",
      chatBody: "#FBFBF8",
      chatLeftPanel: "#FBFBF8",
      header: "#FBFBF8",
      botMessage: "#F7EDE1",
      userMessage: "#333A45",
    },
  },
});
