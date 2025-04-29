import React, { useEffect, useMemo, useState } from "react";
import { Autocomplete, Button, Stack, TextField, MenuItem, Select, FormControl, InputLabel, RadioGroup, FormControlLabel, Radio, Chip } from "@mui/material";
import { DatePicker, DateTimePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import EmailIcon from "@mui/icons-material/Email";
import dayjs from "dayjs";
import useStore from "../store/store";
import { useLocation, useNavigate } from "react-router-dom";
import { beatsList } from "../beatsData/beats";
import SendEmail from "./SendEmail";
const API_URL = import.meta.env.VITE_API_URL;

const Filters = () => {
  const { setComplaints, isAdmin, setTotalStatusCounts, selectedRows, refresh, currentPage, setLoading, setPagination } = useStore();

  const resetState = {
    mainFilter: "",
    timeRange: [null, null], // Stores start and end times
    beatNumber: [], // Changed to array for multi-select
    dateRange: [null, null], // Stores start and end dates
    problemCategory: [], // Changed to array for multi-select
    complaintStatus: "",
    page: 1,
  };
  const [filtersState, setFiltersState] = useState(resetState);

  const [statusOptions, setStatusOptions] = useState(["Open", "Closed", "Follow-Up", "Red-Star"]);
  const [problemCategoryOptions, setProblemCategoryOptions] = useState(["Speed", "Stop sign", "Red light", "School traffic complaint", "Racing", "Reckless Driving"]);
  const mainFilterOptions = [
    {
      key: "timeRange",
      value: "Time Range",
    },
    {
      key: "beatNumber",
      value: "Beat Number",
    },
    {
      key: "dateRange",
      value: "Date Range",
    },
    {
      key: "complaintStatus",
      value: "Complaint Status",
    },
    {
      key: "problemCategory",
      value: "Problem Category",
    },
  ];
  const navigate = useNavigate();
  const location = useLocation();

  const getFiltersByParams = () => {
    const queryParams = new URLSearchParams(location.search);

    // Get beatNumber as array from URL parameters
    const beatNumberParam = queryParams.getAll("beatNumber");
    const beatNumbers = beatNumberParam.length > 0 ? beatNumberParam : [];

    // Get problemCategory as array from URL parameters
    const problemCategoryParam = queryParams.getAll("problemCategory");
    const problemCategories = problemCategoryParam.length > 0 ? problemCategoryParam : [];

    return {
      mainFilter: queryParams.get("filter") || "",
      beatNumber: beatNumbers,
      problemCategory: problemCategories,
      complaintStatus: queryParams.get("complaintStatus") || "",
      timeRange: [queryParams.get("startTime") ? dayjs(queryParams.get("startTime")) : null, queryParams.get("endTime") ? dayjs(queryParams.get("endTime")) : null],
      dateRange: [queryParams.get("startDate") ? dayjs(queryParams.get("startDate")) : null, queryParams.get("endDate") ? dayjs(queryParams.get("endDate")) : null],
    };
  };

  const applyFilters = (newFilter) => {
    const filters = getFiltersByParams();
    setFiltersState(newFilter || filters);
    getData(newFilter || filters);
  };
  const formatDate = (date) => (date ? new Date(date).toISOString().split("T")[0] : "");
  const formatTime = (time) => (time ? new Date(time).toTimeString().split(" ")[0] : "");

  const getData = async (filters) => {
    // Prepare API payload based on updated filters
    const apiPayload = {
      tableName: "Complaints_table",
      beatNumber: filters.beatNumber || [], // Now sending array of beat numbers
      complaintId: filters.complaintId ? [filters.complaintId] : [],
      problemCategory: filters.problemCategory || [], // Now sending array of problem categories
      startDate: filters.dateRange[0] ? formatDate(filters.dateRange[0]) : "",
      endDate: filters.dateRange[1] ? formatDate(filters.dateRange[1]) : "",
      startTime: filters.timeRange?.[0] ? filters.timeRange[0] : "",
      endTime: filters.timeRange?.[1] ? filters.timeRange[1] : "",
      complaintStatus: filters.complaintStatus ? filters.complaintStatus : [],
      page: currentPage + 1 || 1, // Default to page 1 if not set
    };
    setLoading(true);
    try {
      const response = await fetch(API_URL + "db-filter-query-api", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      if (responseData.page === -1) {
        setComplaints([]);
        setTotalStatusCounts({
          TotalClosed: 0,
          "TotalFollow-Up": 0,
          TotalOpen: 0,
          "TotalRed-Star": 0,
        });
        setPagination(0, 0, 1);
      } else {
        setComplaints(responseData.complaintsData || []);
        setPagination(responseData.page - 1, responseData.totalComplaint, responseData.totalPages);
        setTotalStatusCounts(responseData.totalStatusCounts);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading("error");
    }
  };

  useEffect(() => {
    applyFilters();
  }, [currentPage, refresh]);

  const handleFilterChange = (key, newValue) => {
    let updatedState = resetState;

    if (key === "mainFilter" && !newValue) {
      // Case 1: If 'mainFilter' is cleared (empty value), reset filters and fetch new data
      updateURLWithFilters(updatedState);
      setFiltersState(updatedState);
      getData(updatedState);
    }

    // Case 2: If any filter (except 'mainFilter') is cleared or contains an array with null values, update state accordingly
    else if (key !== "mainFilter" && (!newValue || (Array.isArray(newValue) && newValue.length === 0))) {
      updatedState = { ...filtersState, [key]: newValue };
      updateURLWithFilters(updatedState);
      setFiltersState(updatedState);
      getData(updatedState);
    }

    // Case 3: If 'mainFilter' is updated but is NOT 'timeRange' or 'dateRange', reset state with the new main filter
    else if (key === "mainFilter" && newValue !== "timeRange" && newValue !== "dateRange") {
      updatedState = { ...resetState, [key]: newValue };
      updateURLWithFilters(updatedState);
      setFiltersState(updatedState);
    }

    // Case 4: If 'mainFilter' is set to 'timeRange' or 'dateRange', reset state and check for valid array values
    else if (key === "timeRange" || key === "dateRange") {
      updatedState = { ...filtersState, [key]: newValue };
      setFiltersState(updatedState);
      // If all values present
      if (Array.isArray(newValue) && newValue.every((val) => val !== null)) {
        getData(updatedState);
        updateURLWithFilters(updatedState);
      }
      // If no values present
      if (Array.isArray(newValue) && newValue.every((val) => val === null)) {
        getData(updatedState);
        updateURLWithFilters(updatedState);
      }
    }

    // Case 5: Default case - update filter state and fetch data
    // Most common case - like when beat number is updated etc
    else {
      updatedState = { ...filtersState, [key]: newValue };
      updateURLWithFilters(updatedState);
      setFiltersState(updatedState);
      getData(updatedState);
    }
  };

  const updateURLWithFilters = (filters) => {
    const queryParams = new URLSearchParams();

    if (filters.mainFilter) queryParams.set("filter", filters.mainFilter);

    if (filters.timeRange[0]) queryParams.set("startTime", filters.timeRange[0].toISOString());
    if (filters.timeRange[1]) queryParams.set("endTime", filters.timeRange[1].toISOString());

    // Handle beatNumber array in URL
    if (filters.beatNumber && filters.beatNumber.length > 0) {
      filters.beatNumber.forEach((beat) => {
        queryParams.append("beatNumber", beat);
      });
    }

    // Handle problemCategory array in URL
    if (filters.problemCategory && filters.problemCategory.length > 0) {
      filters.problemCategory.forEach((category) => {
        queryParams.append("problemCategory", category);
      });
    }

    if (filters.complaintStatus) queryParams.set("complaintStatus", filters.complaintStatus);

    if (filters.dateRange[0]) queryParams.set("startDate", filters.dateRange[0].toISOString());
    if (filters.dateRange[1]) queryParams.set("endDate", filters.dateRange[1].toISOString());

    // If `mainFilter` is empty, remove all filters from URL
    if (!filters.mainFilter) {
      navigate({ search: "" });
    } else {
      navigate({ search: queryParams.toString() });
    }
  };

  const [openEmailDialog, setOpenEmailDialog] = useState(false);

  const showEmailDialog = (params) => {
    setOpenEmailDialog(true);
  };
  const handleChipClick = (key) => {
    if (filtersState.mainFilter === key) {
      setFiltersState((prev) => {
        return { ...prev, mainFilter: "" };
      });
    } else {
      setFiltersState((prev) => {
        return { ...prev, mainFilter: key };
      });
    }
  };
  const getChipLabel = (option) => {
    const formatDisplayDate = (dateString) => {
      return dateString ? dayjs(dateString).format("MM/DD/YYYY") : "";
    };

    const formatDisplayTime = (timeString) => {
      return timeString ? dayjs(timeString, "HH:mm").format("hh:mm A") : "";
    };
    if (!filtersState[option.key] || (Array.isArray(filtersState[option.key]) && filtersState[option.key].length === 0)) {
      return option.value;
    } else if (option.key === "timeRange") {
      if (Array.isArray(filtersState[option.key]) && filtersState[option.key].every((val) => val !== null)) {
        return option.value + "-" + formatDisplayTime(filtersState[option.key][0]) + "-" + formatDisplayTime(filtersState[option.key][1]);
      } else if (Array.isArray(filtersState[option.key]) && filtersState[option.key][0]) {
        return option.value + "- From " + formatDisplayTime(filtersState[option.key][0]);
      } else if (Array.isArray(filtersState[option.key]) && filtersState[option.key][1]) {
        return option.value + "- Till " + formatDisplayTime(filtersState[option.key][1]);
      } else return option.value;
    } else if (option.key === "dateRange") {
      if (Array.isArray(filtersState[option.key]) && filtersState[option.key].every((val) => val !== null)) {
        return option.value + "-" + formatDisplayDate(filtersState[option.key][0]) + "-" + formatDisplayDate(filtersState[option.key][1]);
      } else if (Array.isArray(filtersState[option.key]) && filtersState[option.key][0]) {
        return option.value + "- From " + formatDisplayDate(filtersState[option.key][0]);
      } else if (Array.isArray(filtersState[option.key]) && filtersState[option.key][1]) {
        return option.value + "- Till " + formatDisplayDate(filtersState[option.key][1]);
      } else {
        return option.value;
      }
    }
    return `${option.value} - ${filtersState[option.key]}`;
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ width: "100%" }}>
        {/* Left-aligned filter chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {mainFilterOptions.map((option) => {
            const isOutlined = !filtersState[option.key] || (Array.isArray(filtersState[option.key]) && (filtersState[option.key].length === 0 || filtersState[option.key].every((val) => val === null)));

            return <Chip variant={isOutlined ? "outlined" : "filled"} color="primary" label={getChipLabel(option)} key={option.key} onClick={() => handleChipClick(option.key)} {...(!isOutlined && { onDelete: () => handleFilterChange(option.key, "") })} />;
          })}
          <Chip label={"Reset"} onClick={() => handleFilterChange("mainFilter", "")} />
        </Stack>
        {isAdmin && (
          <>
            <Button variant="outlined" startIcon={<EmailIcon />} size="small" onClick={showEmailDialog} disabled={selectedRows.length <= 0}>
              Send Email
            </Button>

            <SendEmail openEmailDialog={openEmailDialog} setOpenEmailDialog={setOpenEmailDialog} />
          </>
        )}
      </Stack>
      {filtersState.mainFilter && (
        <Stack direction="row" justifyContent={"space-between"} sx={{ width: "100%" }}>
          <Stack direction="row" justifyContent={"flex-start"} spacing={2}>
            {/* Main Filter Selector */}
            <Autocomplete
              sx={{ width: "15rem" }}
              size="small"
              disabled
              value={mainFilterOptions.find((option) => option.key === filtersState.mainFilter) || null}
              onChange={(event, newValue) => handleFilterChange("mainFilter", newValue ? newValue.key : null)}
              options={mainFilterOptions}
              getOptionLabel={(option) => option.value} // Display the 'value' while storing the 'key'
              renderInput={(params) => <TextField {...params} label="Filter" />}
            />

            {/* Conditional Fields Based on Main Filter */}
            {/* Time Range Pickers */}
            {filtersState.mainFilter === "timeRange" && (
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

            {/* Beat Number - Now with multiple selection */}
            {filtersState.mainFilter === "beatNumber" && <Autocomplete sx={{ width: "100%" }} size="small" multiple value={filtersState.beatNumber} limitTags={7} onChange={(event, newValue) => handleFilterChange("beatNumber", newValue)} options={beatsList} renderInput={(params) => <TextField {...params} label="Beat Number" />} />}

            {/* Date Range Pickers with Validation */}
            {filtersState.mainFilter === "dateRange" && (
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

            {/* Problem Category - Now with multiple selection */}
            {filtersState.mainFilter === "problemCategory" && <Autocomplete sx={{ width: "100%" }} size="small" multiple value={filtersState.problemCategory} onChange={(event, newValue) => handleFilterChange("problemCategory", newValue)} limitTags={4} options={problemCategoryOptions} renderInput={(params) => <TextField {...params} label="Problem Category" />} />}

            {filtersState.mainFilter === "complaintStatus" && <Autocomplete sx={{ width: "15rem" }} size="small" value={filtersState.complaintStatus} onChange={(event, newValue) => handleFilterChange("complaintStatus", newValue)} options={statusOptions} renderInput={(params) => <TextField {...params} label="Complaint Status" />} />}
          </Stack>
        </Stack>
      )}
    </LocalizationProvider>
  );
};

export default Filters;
