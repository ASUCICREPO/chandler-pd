import React, { useState, useEffect, useRef } from "react";
import { Box, IconButton, Typography, Button, TextField, Divider, Dialog, DialogTitle, Grid, Alert, Stack, Accordion, AccordionSummary, AccordionDetails, Chip, Paper, ClickAwayListener, Popper, List, ListItem, ListItemText } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import useStore from "../store/store";
import { statusColors } from "./ComplaintsTableHelper";

const SendEmail = ({ setOpenEmailDialog, openEmailDialog }) => {
  const { complaints, selectedRows } = useStore();
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState([]);
  const [emailError, setEmailError] = useState("");
  const [selectedComplaints, setSelectedComplaints] = useState(complaints.filter((complaint) => selectedRows.includes(complaint.complaintId)));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  const inputRef = useRef(null);
  const popperRef = useRef(null);

  const emailDomains = ["@chandleraz.gov", "@chandlerazpd.gov"];

  useEffect(() => {
    // Filter complaints based on selected rows
    if (complaints && selectedRows) {
      const filteredComplaints = complaints.filter((complaint) => selectedRows.includes(complaint.complaintId));
      setSelectedComplaints(filteredComplaints);
    }
  }, [openEmailDialog]);

  useEffect(() => {
    // Show suggestions when @ is typed
    if (emailInput.includes("@") && !emailInput.includes(".")) {
      const atIndex = emailInput.lastIndexOf("@");
      const textAfterAt = emailInput.substring(atIndex);

      const filteredDomains = emailDomains.filter((domain) => domain.startsWith(textAfterAt));

      if (filteredDomains.length > 0) {
        setSuggestions(filteredDomains);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [emailInput]);

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@(chandleraz\.gov|chandlerazpd\.gov)$/;

    if (!value) {
      return "";
    } else if (!emailRegex.test(value)) {
      return "Email must end with @chandleraz.gov or @chandlerazpd.gov";
    }
    return "";
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmailInput(value);
    setCursorPosition(e.target.selectionStart);
    setEmailError(validateEmail(value));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && emailInput) {
      e.preventDefault();
      addEmail();
    } else if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault();
      const firstSuggestion = document.querySelector('[data-suggestion-index="0"]');
      if (firstSuggestion) {
        firstSuggestion.focus();
      }
    }
  };

  const handleSuggestionKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      selectSuggestion(suggestions[index]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = index + 1 < suggestions.length ? index + 1 : 0;
      const nextSuggestion = document.querySelector(`[data-suggestion-index="${nextIndex}"]`);
      if (nextSuggestion) {
        nextSuggestion.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = index - 1 >= 0 ? index - 1 : suggestions.length - 1;
      const prevSuggestion = document.querySelector(`[data-suggestion-index="${prevIndex}"]`);
      if (prevSuggestion) {
        prevSuggestion.focus();
      }
    }
  };

  const selectSuggestion = (domain) => {
    const parts = emailInput.split("@");
    // Keep the username part and replace domain
    const newInput = parts[0] + domain;
    setEmailInput(newInput);
    setShowSuggestions(false);

    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const addEmail = () => {
    const error = validateEmail(emailInput);
    if (error) {
      setEmailError(error);
      return;
    }

    if (emailInput && !emails.includes(emailInput)) {
      setEmails([...emails, emailInput]);
      setEmailInput("");
      setEmailError("");
    }
  };

  const handleDeleteEmail = (emailToDelete) => {
    setEmails(emails.filter((email) => email !== emailToDelete));
  };

  const handleSend = () => {
    if (emails.length === 0) {
      setEmailError("At least one email is required");
      return;
    }

    // Handle email sending logic here
    console.log("Sending email to:", emails);
    console.log("Selected complaints:", selectedComplaints);
    setOpenEmailDialog(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Dialog
      maxWidth="md"
      open={openEmailDialog}
      onClose={() => setOpenEmailDialog(false)}
      sx={{
        "& .MuiDialog-paper": {
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
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            sx={{
              mr: 1,
              color: (theme) => theme.palette.getContrastText(theme.palette.primary.main),
            }}
            onClick={() => setOpenEmailDialog(false)}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Send Email
          </Typography>
        </Box>
      </DialogTitle>

      <Box sx={{ p: 3, overflowY: "auto", maxHeight: "calc(100vh - 160px)" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Selected Number of Complaints: {selectedRows?.length || 0}
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Enter Email Addresses
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {emails.map((email, index) => (
                <Chip key={index} label={email} onDelete={() => handleDeleteEmail(email)} deleteIcon={<CloseIcon />} sx={{ mb: 1 }} />
              ))}
            </Box>

            <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
              <Box sx={{ position: "relative" }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={emailInput}
                  onChange={handleEmailChange}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    // Delay to allow clicking on suggestions
                    setTimeout(() => {
                      if (!popperRef.current?.contains(document.activeElement)) {
                        setShowSuggestions(false);
                        if (emailInput && !emailError) {
                          addEmail();
                        }
                      }
                    }, 100);
                  }}
                  error={!!emailError}
                  helperText={emailError || "Press Enter to add multiple emails. Type @ to see domain suggestions."}
                  placeholder="user@chandleraz.gov or user@chandlerazpd.gov"
                  inputRef={inputRef}
                />

                {showSuggestions && (
                  <Paper
                    ref={popperRef}
                    elevation={3}
                    sx={{
                      position: "absolute",
                      width: "100%",
                      maxHeight: "150px",
                      overflowY: "auto",
                      zIndex: 1300,
                      mt: 0.5,
                    }}
                  >
                    <List sx={{ p: 0 }}>
                      {suggestions.map((suggestion, index) => (
                        <ListItem
                          button
                          key={index}
                          onClick={() => selectSuggestion(suggestion)}
                          onKeyDown={(e) => handleSuggestionKeyDown(e, index)}
                          tabIndex={0}
                          data-suggestion-index={index}
                          sx={{
                            py: 1,
                            "&:hover": {
                              backgroundColor: (theme) => theme.palette.action.hover,
                            },
                          }}
                        >
                          <ListItemText primary={suggestion} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
            </ClickAwayListener>
          </Box>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Complaint Details:
        </Typography>

        {selectedComplaints.length > 0 ? (
          selectedComplaints.map((complaint, index) => (
            <Accordion key={complaint.complaintId || index} sx={{ mb: 2, border: "1px solid #c2daff", boxShadow: "none" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`complaint-${index}-content`} id={`complaint-${index}-header`}>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="textSecondary">
                        Beat Number:
                      </Typography>
                      <Typography variant="body1">{complaint.beatNumber || "N/A"}</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="textSecondary">
                        Status:
                      </Typography>
                      <Typography variant="body1" sx={{ color: statusColors[complaint.complaintStatus] }}>
                        {complaint.complaintStatus || "N/A"}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="textSecondary">
                        Category:
                      </Typography>
                      <Typography variant="body1">{complaint.problemCategory || "N/A"}</Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
                        Description
                      </Typography>
                      <Typography variant="body1">{complaint.description}</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
                        Location of Problem
                      </Typography>

                      {/* Check if location is "address" or "intersection" */}
                      {complaint.location === "address" ? (
                        <Box>
                          <Typography variant="body1">Address: {`${complaint.addressStreet} ${complaint.addressZipcode}`}</Typography>
                          <Typography variant="body1">Direction: {`${complaint.addressDirection}`}</Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body1">Intersection 1: {`${complaint.intersection1Direction} ${complaint.intersection1Street}`}</Typography>
                          <Typography variant="body1">Intersection 2: {`${complaint.intersection2Direction} ${complaint.intersection2Street}`}</Typography>
                          <Typography variant="body1">Intersection Zipcode: {complaint.intersectionZipcode}</Typography>
                          <Typography variant="body1">Direction: {`${complaint.addressDirection}`}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Alert severity="info">No complaints selected</Alert>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "1rem 2rem",
          position: "sticky",
          bottom: 0,
          background: "white",
          zIndex: 2,
          borderTop: "1px solid #eee",
        }}
      >
        <Button sx={{ mr: 2 }} variant="text" onClick={() => setOpenEmailDialog(false)}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSend} disabled={emails.length === 0}>
          Send
        </Button>
      </Box>
    </Dialog>
  );
};

export default SendEmail;
