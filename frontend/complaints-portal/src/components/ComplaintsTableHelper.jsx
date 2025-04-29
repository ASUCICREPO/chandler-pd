import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import { Button, Menu, MenuItem, Box, Stack } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { GridPagination } from "@mui/x-data-grid";
import useStore from "../store/store";
import Caution from "./Caution";

export const statusColors = {
  Open: "#318D00",
  Closed: "#D32F2F",
  "Follow-Up": "#1976D2",
  "Red-Star": "#EF6C00",
};
// Custom Footer with Pagination on Left & Buttons on Right
export const CustomFooter = () => {
  const { currentPage, setCurrentPage, setSelectedRows, totalStatusCounts, selectedRows } = useStore();
  const [open, setOpen] = React.useState(false);
  const [next, setNext] = React.useState(1);
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0rem 2rem 0rem",
        backgroundColor: "#f5f5f5",
        borderTop: "1px solid #ddd",
      }}
    >
      <CountCards />
      {/* Left-aligned pagination */}

      <GridPagination
        page={currentPage}
        onPageChange={(e, newPage) => {
          if (selectedRows.length > 0) {
            setOpen(true);
            setNext(newPage);
          } else {
            setCurrentPage(newPage);
          }
        }}
      />
      <Caution
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        onProceed={() => {
          setOpen(false);
          setCurrentPage(next);
          setSelectedRows([]);
        }}
      />
    </Box>
  );
};
const cardClass = {
  justifyContent: "flex-start",
  alignItems: "flex-start",
  borderRadius: "4px",
  border: "1px solid",
  padding: "4px 6px",
};
export const CountCards = () => {
  const { totalStatusCounts } = useStore();

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        <Stack direction="row" spacing={2} sx={{ ...cardClass, borderColor: statusColors["Open"], backgroundColor: `${statusColors["Open"]}1A` }}>
          Total Open Cases - {totalStatusCounts.TotalOpen}
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            ...cardClass,
            borderColor: statusColors["Closed"],
            backgroundColor: `${statusColors["Closed"]}1A`,
          }}
        >
          Total Closed Cases - {totalStatusCounts.TotalClosed}
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            ...cardClass,
            borderColor: statusColors["Follow-Up"],
            backgroundColor: `${statusColors["Follow-Up"]}1A`,
          }}
        >
          Total Follow-Up Cases - {totalStatusCounts["TotalFollow-Up"]}
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            ...cardClass,
            borderColor: statusColors["Red-Star"],
            backgroundColor: `${statusColors["Red-Star"]}1A`,
          }}
        >
          Total Red-Star Cases - {totalStatusCounts["TotalRed-Star"]}
        </Stack>
      </Stack>
    </>
  );
};
export const StatusComponent = ({ value, id, onChange }) => {
  const { isAdmin } = useStore();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    if (!isAdmin) return;
    event.stopPropagation();

    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusSelect = (status, e) => {
    onChange(status); // Call the status change function passed from parent
    handleClose();
  };

  return (
    <Box>
      <Button sx={{ width: "9rem", backgroundColor: statusColors[value] }} onClick={handleClick} variant="contained" color="primary" size="medium" endIcon={isAdmin ? <KeyboardArrowDownIcon /> : null}>
        {value}
      </Button>
      <StyledMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {Object.keys(statusColors).map((status) => (
          <MenuItem key={status} onClick={() => handleStatusSelect(status)}>
            {status}
          </MenuItem>
        ))}
      </StyledMenu>
    </Box>
  );
};

const StyledMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: "rgb(55, 65, 81)",
    boxShadow: "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      "&:active": {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
      },
    },
  },
}));
