import React, { useEffect, useState } from "react";
import { Box, IconButton, Typography, Button, TextField, Divider, Paper, Dialog, DialogTitle, Autocomplete } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { StatusComponent } from "./ComplaintsTableHelper";
import { beatsList } from "../beatsData/beats";
import useStore from "../store/store";
const API_URL = import.meta.env.VITE_API_URL;
import { toast } from "react-toastify";

export const handleFieldChange = async (complaintId, field, value, updateComplaint, onSuccess) => {
  const payload = {
    complaintId: complaintId,
    attribute: field,
    value: value, // Dynamically set the field key and its value
    isUpdate: true,
  };

  try {
    const response = await fetch(`${API_URL}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json", // Make sure to send JSON
      },
      body: JSON.stringify(payload), // Convert payload object to JSON
    });

    if (response.ok) {
      const responseData = await response.json(); // Parse the JSON response if needed
      updateComplaint(complaintId, field, value);
      if (onSuccess) {
        onSuccess();
      }
      toast("Field updated successfully", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        type: "success",
        theme: "dark",
      });
    } else {
      console.error("Error:", response.statusText);
      toast("Failed to update field", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        type: "success",
        theme: "dark",
      });
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
};

const ViewComplaint = ({ complaint, setSelectedComplaint, setOpenDetailsDialog, openDetailsDialog }) => {
  if (!complaint) return;

  const { updateComplaint, isAdmin } = useStore();
  const [notes, setNotes] = useState(complaint.officersNotes || "");

  // Update local state when complaint changes or dialog opens
  useEffect(() => {
    if (complaint && openDetailsDialog) {
      setNotes(complaint.officersNotes || "");
    }
  }, [complaint, openDetailsDialog]);

  return (
    <Dialog
      maxWidth="md"
      open={openDetailsDialog}
      onClose={() => {
        setOpenDetailsDialog(false);
      }}
      sx={{
        "& .MuiDialog-paper": {
          height: "fit-content", // Adjust the height of the dialog
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
          <IconButton sx={{ mr: 1, color: (theme) => theme.palette.getContrastText(theme.palette.primary.main) }} onClick={() => setOpenDetailsDialog(false)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Complaint Details
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mr: 3 }}>
            {isAdmin ? (
              <Autocomplete
                value={complaint.beatNumber}
                onChange={(e, val) => {
                  if (!isAdmin) return;
                  handleFieldChange(complaint.complaintId, "beatNumber", val, updateComplaint, function () {
                    setSelectedComplaint((prevState) => ({
                      ...prevState,
                      beatNumber: val, // Ensure the updated field is set
                    }));
                  }); // pass the field and the selected value
                }}
                options={beatsList}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Beat Number"
                    variant="outlined"
                    sx={{
                      "& .MuiInputLabel-root": {
                        color: (theme) => theme.palette.getContrastText(theme.palette.primary.main), // Label text color
                      },
                      "& .MuiOutlinedInput-root": {
                        height: "36.5px",
                        "& fieldset": {
                          borderColor: (theme) => theme.palette.getContrastText(theme.palette.primary.main), // Border color
                        },
                        "&:hover fieldset": {
                          borderColor: (theme) => theme.palette.getContrastText(theme.palette.primary.main), // Border color on hover
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: (theme) => theme.palette.getContrastText(theme.palette.primary.main), // Focused border color
                        },
                      },
                      "& .MuiAutocomplete-input": {
                        color: (theme) => theme.palette.getContrastText(theme.palette.primary.main), // Focused border color
                      },
                      "& .MuiSvgIcon-root": {
                        fill: (theme) => theme.palette.getContrastText(theme.palette.primary.main), // Icon color
                      },
                    }}
                  />
                )}
              />
            ) : (
              <Typography sx={{ fontWeight: "bold" }}>Beat: {complaint.beatNumber}</Typography>
            )}
          </Box>
          <StatusComponent
            value={complaint.complaintStatus}
            id={complaint.complaintId}
            onChange={(status) => {
              if (!isAdmin) return;
              handleFieldChange(complaint.complaintId, "complaintStatus", status, updateComplaint, function () {
                setSelectedComplaint((prevState) => ({
                  ...prevState,
                  complaintStatus: status, // Ensure the updated field is set
                }));
              }); // pass the field and the selected value); // pass the field and the selected value
            }}
          />
        </Box>
      </DialogTitle>

      <Box sx={{ pl: 7, pr: 7, pt: 2, pb: 2, overflowY: "auto", maxHeight: "calc(100vh - 160px)" }}>
        {/* Content */}
        <Box sx={{ mb: 3, display: "flex", flexDirection: "row", alignItems: "center" }}>
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", mr: 3, minWidth: "7rem" }}>
            <Typography variant="body2" sx={{ color: "#aaa" }}>
              First Name
            </Typography>
            <Typography variant="body1">{complaint.firstName}</Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", minWidth: "7rem" }}>
            <Typography variant="body2" sx={{ color: "#aaa" }}>
              Last Name
            </Typography>
            <Typography variant="body1">{complaint.lastName}</Typography>
          </Box>
          <Divider sx={{ ml: 2, bgcolor: "rgba(255,255,255,0.1)" }} />
        </Box>

        {/* Problem Category */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
            Problem Category
          </Typography>
          <Typography variant="body1">{complaint.problemCategory}</Typography>
          <Divider sx={{ mt: 2, bgcolor: "rgba(255,255,255,0.1)" }} />
        </Box>

        {/* Day of Week */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
            Day of Week
          </Typography>
          <Typography variant="body1">{complaint.daysOfWeek.join(", ")}</Typography>
          <Divider sx={{ mt: 2, bgcolor: "rgba(255,255,255,0.1)" }} />
        </Box>

        {/* Start Time / End Time */}
        <Box sx={{ mb: 3, display: "flex", flexDirection: "row", alignItems: "center" }}>
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", mr: 3, minWidth: "7rem" }}>
            <Typography variant="body2" sx={{ color: "#aaa" }}>
              Start Time
            </Typography>
            <Typography variant="body1">{complaint.startTime}</Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", minWidth: "7rem" }}>
            <Typography variant="body2" sx={{ color: "#aaa" }}>
              End Time
            </Typography>
            <Typography variant="body1">{complaint.endTime}</Typography>
          </Box>
          <Divider sx={{ ml: 2, bgcolor: "rgba(255,255,255,0.1)" }} />
        </Box>

        {/* Contact Information */}
        {(complaint.phone || complaint.email) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
              Contact Information
            </Typography>
            {complaint.phone && <Typography variant="body1">Phone: {complaint.phone}</Typography>}
            {complaint.email && <Typography variant="body1">Email: {complaint.email}</Typography>}
            <Divider sx={{ mt: 2, bgcolor: "rgba(255,255,255,0.1)" }} />
          </Box>
        )}

        {/* Problem Description */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
            Problem Description
          </Typography>
          <Typography variant="body1">{complaint.description}</Typography>
          <Divider sx={{ mt: 2, bgcolor: "rgba(255,255,255,0.1)" }} />
        </Box>

        {/* Location of Problem */}
        <Box sx={{ mb: 3 }}>
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
              <Typography variant="body1">Zipcode: {complaint.intersectionZipcode}</Typography>
              <Typography variant="body1">Direction: {`${complaint.intersection1Direction}`}</Typography>
            </Box>
          )}

          <Divider sx={{ mt: 2, bgcolor: "rgba(255,255,255,0.1)" }} />
        </Box>

        {/* Notes */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
            Notes
          </Typography>
          {isAdmin ? (
            <TextField placeholder="Enter your notes here..." fullWidth multiline rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          ) : (
            <>
              <Typography variant="body2" color={notes ? "text.primary" : "text.secondary"} fontStyle={notes ? "normal" : "italic"}>
                {notes || "No notes added."}
              </Typography>{" "}
            </>
          )}
        </Box>
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
        <Button sx={{ mr: 2 }} variant={isAdmin ? "text" : "contained"} onClick={() => setOpenDetailsDialog(false)}>
          Close
        </Button>
        {isAdmin && (
          <Button
            disabled={complaint.officersNotes === notes}
            variant="contained"
            onClick={(e) => {
              if (!isAdmin) return;
              if (complaint.officersNotes !== notes) {
                handleFieldChange(complaint.complaintId, "officersNotes", notes, updateComplaint, function () {
                  setSelectedComplaint((prevState) => ({
                    ...prevState,
                    officersNotes: notes,
                  }));
                  setOpenDetailsDialog(false);
                });
              }
            }}
          >
            Save
          </Button>
        )}
      </Box>
    </Dialog>
  );
};

export default ViewComplaint;
