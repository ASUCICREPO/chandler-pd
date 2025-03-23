import React from "react";
import { Box, IconButton, Typography, Button, TextField, Divider, Paper, Dialog, DialogTitle, Autocomplete } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const Caution = ({ onClose, open, onProceed }) => {
  //   if (!complaints) return;

  return (
    <Dialog
      maxWidth="md"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          //   height: "100vh", // Adjust the height of the dialog
          minWidth: "50vw",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: (theme) => theme.palette.primary.main,
          pl: 1,
          pr: 4,
          color: (theme) => theme.palette.getContrastText(theme.palette.primary.main),
          position: "sticky", // Make the header sticky
          top: 0,
          zIndex: 1, // Ensure it stays above the content
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton sx={{ mr: 1, color: (theme) => theme.palette.getContrastText(theme.palette.primary.main) }} onClick={onClose}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Warning{" "}
          </Typography>
        </Box>
      </DialogTitle>

      <Box sx={{ pl: 7, pr: 7, pt: 2, pb: 2, overflowY: "auto", maxHeight: "calc(100vh - 160px)" }}>
        <Typography variant="body1" sx={{ flexGrow: 1 }}>
          You have unsaved changes. Proceeding will discard your selections.
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "2rem",
          position: "sticky",
          bottom: 0,
          background: "white", // Optional, to prevent footer from overlapping content
          zIndex: 2,
        }}
      >
        <Button sx={{ mr: 2 }} variant="text" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onProceed}>
          Proceed
        </Button>
      </Box>
    </Dialog>
  );
};

export default Caution;
