import React from "react";
import { Paper, Typography, Button, IconButton, Box, Divider, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";
import { useNavigate } from "react-router-dom";
const CustomBeatPopup = ({ beat, position, onClose }) => {
  // If no beat data is provided, don't render anything
  if (!beat) return null;
  const navigate = useNavigate();

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%)",
        borderRadius: 1,
        borderRadius: "8px",
        zIndex: 1000,
        minWidth: "220px",
        pointerEvents: "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: "8px 8px 0px 0px",
          p: "0.5rem 1rem 0.5rem 1rem",
          color: (theme) => theme.palette.getContrastText(theme.palette.primary.main),
          background: (theme) => theme.palette.primary.main,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Beat {beat.attributes.POLICE_BEAT}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton sx={{ color: (theme) => theme.palette.getContrastText(theme.palette.primary.main) }} size="small" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ p: "0.75rem 1.5rem 0.5rem 1rem" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ my: 0.5 }}>
          <Typography variant="body2" fontWeight="medium">
            Open Complaints:
          </Typography>
          <Typography variant="body2">{beat.attributes.COMPLAINT_COUNT}</Typography>
        </Stack>
      </Box>

      {beat.attributes.COMPLAINT_COUNT > 0 && (
        <Box sx={{ p: "0.5rem 1rem 1rem 1rem", textAlign: "center" }}>
          <Button
            variant="outlined"
            fullWidth
            color="primary"
            size="small"
            startIcon={<LaunchIcon />}
            onClick={() => {
              navigate(`/?filter=complaintStatus&beatNumber=${beat.attributes.POLICE_BEAT}&complaintStatus=Open`);
            }}
            sx={{ mr: 1 }}
          >
            View All
          </Button>
        </Box>
      )}

      {/* Pointer triangle at bottom of popup */}
      <Box
        sx={{
          position: "absolute",
          bottom: "-10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "10px solid #fff",
          zIndex: 0,
        }}
      />
    </Paper>
  );
};

// Helper function to get color based on complaint level
function getColorForLevel(level) {
  switch (level) {
    case "None":
      return "rgb(0, 155, 0)";
    case "Very Low":
      return "rgb(144, 238, 0)";
    case "Low":
      return "rgb(200, 200, 0)";
    case "Medium":
      return "rgb(255, 165, 0)";
    case "High":
      return "rgb(255, 69, 0)";
    case "Very High":
      return "rgb(255, 0, 0)";
    default:
      return "black";
  }
}

export default CustomBeatPopup;
