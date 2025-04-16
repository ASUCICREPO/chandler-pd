import { List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import logo from "../assets/logo.png";
const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH;

const LeftPanel = ({ signOut }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Map paths to keys
  const pathToKey = {
    "/": "complaints",
    "/heatmap": "heatmap",
    "/chatbot": "chatbot",
  };

  // Get current selected key from path or default to "complaints"
  const [selectedIndex, setSelectedIndex] = useState(pathToKey[location.pathname] || "complaints");

  useEffect(() => {
    // Sync selectedIndex with the URL path
    setSelectedIndex(pathToKey[location.pathname] || "complaints");
  }, [location.pathname]);

  const handleListItemClick = (selected, path) => {
    setSelectedIndex(selected);
    navigate(path);
  };

  const handleLogout = () => {
    signOut();
  };

  return (
    <Stack className="leftPanelContainer">
      {/* Header Section */}
      <Stack className="leftPanelHeader" alignItems={"center"} spacing={1.5} justifyContent={"center"}>
        <img src={logo} width={72} height={86} alt="Logo" />
        <Typography className="leftPanelHeaderTitle">Chandler Police Department</Typography>
      </Stack>

      {/* Navigation List */}
      <Stack sx={{ height: "100%", padding: "1.5rem" }} justifyContent={"space-between"}>
        <List component="nav" aria-label="navigation_list">
          <ListItemButton
            selected={selectedIndex === "complaints"}
            onClick={() => handleListItemClick("complaints", "/")}
            className="listItemButton"
            sx={{ mb: 2 }} // Adds margin-bottom for spacing
          >
            <ListItemText primary="Complaints" />
          </ListItemButton>
          <ListItemButton className="listItemButton" selected={selectedIndex === "heatmap"} onClick={() => handleListItemClick("heatmap", "/heatmap")} sx={{ mb: 2 }}>
            <ListItemText primary="Heatmap" />
          </ListItemButton>
          <ListItemButton className="listItemButton" selected={selectedIndex === "chatbot"} onClick={() => handleListItemClick("chatbot", "/chatbot")} sx={{ mb: 2 }}>
            <ListItemText primary="AI Chatbot" />
          </ListItemButton>
        </List>

        {ENABLE_AUTH === "ENABLED" ? (
          <List component="nav" aria-label="logout">
            <ListItemButton className="logoutButton" onClick={handleLogout} sx={{ mt: 2 }}>
              {/* Adds top margin to separate from above */}
              <ListItemText primary="Logout" />
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
            </ListItemButton>
          </List>
        ) : (
          <></>
        )}
      </Stack>
    </Stack>
  );
};

export default LeftPanel;
