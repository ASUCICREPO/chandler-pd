import React, { useEffect, useState } from "react";
import { Autocomplete, Button, Stack, TextField, MenuItem, Select, FormControl, InputLabel, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { DatePicker, DateTimePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import EmailIcon from "@mui/icons-material/Email";
import dayjs from "dayjs";

const Filters = ({ onFilterChange }) => {
  const [filtersState, setFiltersState] = useState({
    mainFilter: "",
    timeRange: [null, null], // Stores start and end times
    beatNumber: "",
    dateRange: [null, null], // Stores start and end dates
    problemCategory: "",
    complaintStatus: "",
  });
  const [beatOptions, setBeatOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState(["Open", "Closed", "Follow up", "Red star"]);
  const [problemCategoryOptions, setProblemCategoryOptions] = useState(["Speed", "Stop sign", "Red light", "School traffic complaint", "Racing", "Reckless Driving"]);
  useEffect(() => {
    setBeatOptions(["Beat 1", "Beat 2"]);
  }, []);
  const handleFilterChange = (key, newValue) => {
    const updatedState = { ...filtersState, [key]: newValue };
    setFiltersState(updatedState);
    if (onFilterChange) {
      onFilterChange(updatedState);
    }
  };

  const handleResetFilters = () => {
    const resetState = {
      mainFilter: "",
      timeRange: [null, null],
      beatNumber: "",
      dateRange: [null, null],
      problemCategory: "",
      complaintStatus: "",
    };
    setFiltersState(resetState);
    if (onFilterChange) {
      onFilterChange(resetState);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack direction="row" justifyContent={"space-between"} sx={{ width: "100%" }}>
        <Stack direction="row" justifyContent={"flex-start"} spacing={2}>
          {/* Main Filter Selector */}
          <Autocomplete sx={{ width: "15rem" }} size="small" value={filtersState.mainFilter} onChange={(event, newValue) => handleFilterChange("mainFilter", newValue)} options={["Time Range", "Beat Number", "Date Range", "Problem Category", "Complaint Status"]} renderInput={(params) => <TextField {...params} label="Filter" />} />

          {/* Conditional Fields Based on Main Filter */}
          {/* Time Range Pickers */}
          {filtersState.mainFilter === "Time Range" && (
            <Stack direction="row" spacing={2}>
              <TimePicker
                label="Start Time"
                sx={{
                  "& .MuiInputBase-root": { height: "40px" },
                  "& .MuiInputLabel-root": {
                    top: "-6px",
                  },
                }}
                value={filtersState.timeRange[0]}
                onChange={(newValue) => {
                  // Ensure End Time is not before Start Time
                  const updatedEndTime = filtersState.timeRange[1] && dayjs(newValue).isAfter(filtersState.timeRange[1]) ? null : filtersState.timeRange[1];
                  handleFilterChange("timeRange", [newValue, updatedEndTime]);
                }}
                renderInput={(params) => <TextField {...params} size="small" sx={{ height: "40px", "& .MuiInputBase-root-MuiOutlinedInput-root": { height: "40px" } }} />}
                slotProps={{
                  field: { clearable: true },
                }}
              />
              <TimePicker
                sx={{
                  "& .MuiInputBase-root": { height: "40px" },
                  "& .MuiInputLabel-root": {
                    top: "-6px",
                  },
                }}
                label="End Time"
                value={filtersState.timeRange[1]}
                minTime={filtersState.timeRange[0]} // Prevent selecting time before start time
                onChange={(newValue) => handleFilterChange("timeRange", [filtersState.timeRange[0], newValue])}
                renderInput={(params) => <TextField {...params} size="small" sx={{ height: "40px", "& .MuiInputBase-root": { height: "40px" } }} />}
                slotProps={{
                  field: { clearable: true },
                }}
              />
            </Stack>
          )}

          {filtersState.mainFilter === "Beat Number" && <Autocomplete sx={{ width: "15rem" }} size="small" value={filtersState.beatNumber} onChange={(event, newValue) => handleFilterChange("beatNumber", newValue)} options={beatOptions} renderInput={(params) => <TextField {...params} label="Beat Number" />} />}

          {/* Date Range Pickers with Validation */}
          {filtersState.mainFilter === "Date Range" && (
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start Date"
                sx={{
                  "& .MuiInputBase-root": { height: "40px" },
                  "& .MuiInputLabel-root": {
                    top: "-6px",
                  },
                }}
                value={filtersState.dateRange[0]}
                onChange={(newValue) => {
                  const updatedEndDate = filtersState.dateRange[1] && dayjs(newValue).isAfter(filtersState.dateRange[1]) ? null : filtersState.dateRange[1];
                  handleFilterChange("dateRange", [newValue, updatedEndDate]);
                }}
                shouldDisableDate={(date) => filtersState.dateRange[1] && dayjs(date).isAfter(filtersState.dateRange[1])}
                renderInput={(params) => <TextField {...params} size="small" sx={{ height: "40px", "& .MuiInputBase-root": { height: "40px" } }} />}
                slotProps={{
                  field: { clearable: true },
                }}
              />
              <DatePicker
                label="End Date"
                sx={{
                  "& .MuiInputBase-root": { height: "40px" },
                  "& .MuiInputLabel-root": {
                    top: "-6px",
                  },
                }}
                value={filtersState.dateRange[1]}
                minDate={filtersState.dateRange[0]} // Prevents selecting a date before Start Date
                onChange={(newValue) => handleFilterChange("dateRange", [filtersState.dateRange[0], newValue])}
                shouldDisableDate={(date) => filtersState.dateRange[0] && dayjs(date).isBefore(filtersState.dateRange[0])}
                renderInput={(params) => <TextField {...params} size="small" sx={{ height: "40px", "& .MuiInputBase-root": { height: "40px" } }} />}
                slotProps={{
                  field: { clearable: true },
                }}
              />
            </Stack>
          )}
          {filtersState.mainFilter === "Problem Category" && <Autocomplete sx={{ width: "15rem" }} size="small" value={filtersState.problemCategory} onChange={(event, newValue) => handleFilterChange("problemCategory", newValue)} options={problemCategoryOptions} renderInput={(params) => <TextField {...params} label="Problem Category" />} />}
          {filtersState.mainFilter === "Complaint Status" && <Autocomplete sx={{ width: "15rem" }} size="small" value={filtersState.complaintStatus} onChange={(event, newValue) => handleFilterChange("complaintStatus", newValue)} options={statusOptions} renderInput={(params) => <TextField {...params} label="Complaint Status" />} />}

          {/* <Button variant="outlined" size="small" onClick={handleResetFilters}>
            Reset
          </Button> */}
        </Stack>
        <Button variant="outlined" startIcon={<EmailIcon />} size="small">
          Send Email
        </Button>
      </Stack>
    </LocalizationProvider>
  );
};

export default Filters;
