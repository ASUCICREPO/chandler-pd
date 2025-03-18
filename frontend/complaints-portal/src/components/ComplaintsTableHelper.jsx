import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import { Button, Menu, MenuItem, Box } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { DataGrid, GridPagination } from "@mui/x-data-grid";

const statusColors = {
  Open: "#318D00",
  Closed: "#D32F2F",
  "Follow-Up": "#1976D2",
  "Red-Star": "#EF6C00",
};
// Custom Footer with Pagination on Left & Buttons on Right
export const CustomFooter = () => {
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
      {/* Left-aligned pagination */}
      <GridPagination />

      {/* Right-aligned buttons */}
      {/* <Box sx={{ display: "flex", gap: "10px" }}>
        <Button variant="contained" color="primary">
          Export
        </Button>
        <Button variant="outlined" color="secondary">
          Refresh
        </Button>
      </Box> */}
    </Box>
  );
};

export const ComplaintStatusCell = ({ value, id, onChange }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusSelect = (status) => {
    onChange(status); // Call the status change function passed from parent
  };

  return (
    <Box>
      <Button sx={{ width: "10rem", backgroundColor: statusColors[value] }} onClick={handleClick} variant="contained" color="primary" size="small" endIcon={<KeyboardArrowDownIcon />}>
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

export const rowsDump = [
  {
    complaintId: 1,
    firstName: "John",
    lastName: "Doe",
    daysOfWeek: ["Monday", "Wednesday"],
    beatNumber: "B1950",
    dateOfComplaint: "02/22/2025",
    startTime: "08:00 AM",
    endTime: "10:00 AM",
    location: "address",
    addressDirection: "N",
    addressStreet: "Main St",
    addressZipcode: "85225",
    intersection1Direction: "E",
    intersection1Street: "1st Ave",
    intersection2Direction: "W",
    intersection2Street: "2nd Ave",
    intersectionZipcode: "85225",
    problemCategory: "Traffic Signal Malfunction",
    description: "Traffic light at the major intersection.",
    complaintStatus: "Open",
    subscribeToAlerts: true,
    email: "johndoe@example.com",
    phone: "123-456-7890",
  },
  {
    complaintId: 2,
    firstName: "Jane",
    lastName: "Smith",
    daysOfWeek: ["Tuesday", "Thursday"],
    beatNumber: "B1950",
    dateOfComplaint: "02/22/2025",
    startTime: "02:00 PM",
    endTime: "04:00 PM",
    location: "address",
    addressDirection: "S",
    addressStreet: "Washington Blvd",
    addressZipcode: "85226",
    intersection1Direction: "N",
    intersection1Street: "3rd Ave",
    intersection2Direction: "S",
    intersection2Street: "4th Ave",
    intersectionZipcode: "85226",
    problemCategory: "Pothole",
    description: "There's a large pothole on Washington Blvd that has been causing traffic delays for the past few days. It's becoming a serious safety hazard.",
    complaintStatus: "Closed",
    subscribeToAlerts: false,
    email: "janesmith@example.com",
    phone: "987-654-3210",
  },
  {
    complaintId: 3,
    firstName: "Mike",
    lastName: "Johnson",
    daysOfWeek: ["Friday"],
    beatNumber: "B1220",
    dateOfComplaint: "02/22/2025",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    location: "address",
    addressDirection: "W",
    addressStreet: "Elm St",
    addressZipcode: "85227",
    intersection1Direction: "E",
    intersection1Street: "5th Ave",
    intersection2Direction: "W",
    intersection2Street: "6th Ave",
    intersectionZipcode: "85227",
    problemCategory: "Illegal Dumping",
    description: "There's a growing issue of illegal trash dumping near the public park. The area is getting cluttered and creating an unpleasant environment.",
    complaintStatus: "Follow-Up",
    subscribeToAlerts: true,
    email: "mikejohnson@example.com",
    phone: "555-123-4567",
  },
  {
    complaintId: 4,
    firstName: "Emily",
    lastName: "Davis",
    daysOfWeek: ["Saturday", "Sunday"],
    beatNumber: "B2220",
    dateOfComplaint: "02/22/2025",
    startTime: "03:00 PM",
    endTime: "06:00 PM",
    location: "intersection",
    addressDirection: "E",
    addressStreet: "Pine Ave",
    addressZipcode: "85228",
    intersection1Direction: "N",
    intersection1Street: "7th Ave",
    intersection2Direction: "S",
    intersection2Street: "8th Ave",
    intersectionZipcode: "85228",
    problemCategory: "Street Light Out",
    description: "Several streetlights are out near the entrance to the mall, making the area dark and unsafe for pedestrians during evening hours.",
    complaintStatus: "Red-Star",
    subscribeToAlerts: false,
    email: "emilydavis@example.com",
    phone: "444-789-1234",
  },
  {
    complaintId: 5,
    firstName: "Robert",
    lastName: "Wilson",
    daysOfWeek: ["Monday"],
    beatNumber: "B1980",
    dateOfComplaint: "02/22/2025",
    startTime: "07:00 AM",
    endTime: "09:00 AM",
    location: "School Zone",
    addressDirection: "S",
    addressStreet: "Maple St",
    addressZipcode: "85230",
    intersection1Direction: "E",
    intersection1Street: "10th Ave",
    intersection2Direction: "W",
    intersection2Street: "11th Ave",
    intersectionZipcode: "85230",
    problemCategory: "Speeding Vehicles",
    description: "Vehicles are frequently speeding near the school zone, putting children at risk as they cross the street in the morning and afternoon.",
    complaintStatus: "Open",
    subscribeToAlerts: true,
    email: "robertwilson@example.com",
    phone: "333-456-7890",
  },
  {
    complaintId: 6,
    firstName: "Sarah",
    lastName: "Brown",
    daysOfWeek: ["Tuesday"],
    beatNumber: "B1450",
    dateOfComplaint: "02/22/2025",
    startTime: "11:00 AM",
    endTime: "01:00 PM",
    location: "Residential Area",
    addressDirection: "N",
    addressStreet: "Cedar Rd",
    addressZipcode: "85231",
    intersection1Direction: "S",
    intersection1Street: "12th Ave",
    intersection2Direction: "N",
    intersection2Street: "13th Ave",
    intersectionZipcode: "85231",
    problemCategory: "Loud Noise Complaint",
    description: "Loud music has been playing late into the night, disturbing the peace in the neighborhood. The noise is especially disruptive to families with children.",
    complaintStatus: "Closed",
    subscribeToAlerts: false,
    email: "sarahbrown@example.com",
    phone: "222-789-1234",
  },
  {
    complaintId: 7,
    firstName: "James",
    lastName: "Anderson",
    daysOfWeek: ["Thursday"],
    beatNumber: "B1780",
    dateOfComplaint: "02/22/2025",
    startTime: "05:00 PM",
    endTime: "07:00 PM",
    location: "City Park",
    addressDirection: "E",
    addressStreet: "Oak St",
    addressZipcode: "85232",
    intersection1Direction: "W",
    intersection1Street: "14th Ave",
    intersection2Direction: "E",
    intersection2Street: "15th Ave",
    intersectionZipcode: "85232",
    problemCategory: "Vandalism",
    description: "There is graffiti on the park benches, and the vandalism is spreading to other areas of the park. It’s making the park look neglected.",
    complaintStatus: "Follow-Up",
    subscribeToAlerts: true,
    email: "jamesanderson@example.com",
    phone: "111-456-7890",
  },
  {
    complaintId: 8,
    firstName: "Jessica",
    lastName: "Martinez",
    daysOfWeek: ["Saturday"],
    beatNumber: "B1890",
    dateOfComplaint: "02/22/2025",
    startTime: "09:00 AM",
    endTime: "11:00 AM",
    location: "Shopping District",
    addressDirection: "S",
    addressStreet: "Birch Ave",
    addressZipcode: "85233",
    intersection1Direction: "N",
    intersection1Street: "16th Ave",
    intersection2Direction: "S",
    intersection2Street: "17th Ave",
    intersectionZipcode: "85233",
    problemCategory: "Loitering",
    description: "Groups of people are loitering in front of stores in the shopping district, causing a disruption for customers and business owners.",
    complaintStatus: "Red-Star",
    subscribeToAlerts: false,
    email: "jessicamartinez@example.com",
    phone: "666-123-4567",
  },
  {
    complaintId: 9,
    firstName: "Daniel",
    lastName: "Taylor",
    daysOfWeek: ["Sunday"],
    beatNumber: "B1650",
    dateOfComplaint: "02/22/2025",
    startTime: "06:00 PM",
    endTime: "08:00 PM",
    location: "Public Library",
    addressDirection: "W",
    addressStreet: "Spruce Rd",
    addressZipcode: "85234",
    intersection1Direction: "E",
    intersection1Street: "18th Ave",
    intersection2Direction: "W",
    intersection2Street: "19th Ave",
    intersectionZipcode: "85234",
    problemCategory: "Disturbance",
    description: "There is disruptive behavior in the library's reading area. Patrons are talking loudly and disturbing others who are trying to read or study.",
    complaintStatus: "Open",
    subscribeToAlerts: true,
    email: "danieltaylor@example.com",
    phone: "777-987-6543",
  },
];
export const dummyRows = [
  {
    complaintId: 5,
    firstName: "----",
    lastName: "---",
    daysOfWeek: ["---"],
    beatNumber: "----",
    dateOfComplaint: "02/22/2025",
    startTime: "07:00 AM",
    endTime: "09:00 AM",
    location: "-----",
    addressDirection: "-----",
    addressStreet: "----",
    addressZipcode: "----",
    intersection1Direction: "-----",
    intersection1Street: "----",
    intersection2Direction: "-----",
    intersection2Street: "-----",
    intersectionZipcode: "----",
    problemCategory: "-----",
    description: "This is dummy data, error in filter",
    complaintStatus: "Open",
    subscribeToAlerts: true,
    email: "robertwilson@example.com",
    phone: "333-456-7890",
  },
];
