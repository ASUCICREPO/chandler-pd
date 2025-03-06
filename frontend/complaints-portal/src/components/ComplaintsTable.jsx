import * as React from "react";
import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { ComplaintStatusCell, CustomFooter, rowsDump } from "./ComplaintsTableHelper";

const statusColors = {
  Open: "#318D00",
  Closed: "#D32F2F",
  "Follow-Up": "#1976D2",
  "Red-Star": "#EF6C00",
};

const ComplaintsTable = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [status, setStatus] = React.useState("");

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setAnchorEl(null); // Close menu after selection
  };
  const columnsDump = [
    { field: "dateOfComplaint", headerName: "Date", width: 150 },
    { field: "beatNumber", headerName: "Beat Number", width: 150 },

    { field: "problemCategory", headerName: "Category", width: 200 },
    {
      field: "description",
      headerName: "Description",
      width: 600,
      renderCell: (params) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            wordBreak: "break-word",
            lineHeight: "1.5", // Add line height for better readability
          }}
        >
          {params.row.description}
        </div>
      ),
    },
    { field: "complaintStatus", headerName: "Complaint Status", width: 200, renderCell: (params) => <ComplaintStatusCell value={params.row.complaintStatus} id={params.row.id} onChange={handleStatusChange} /> },
    { field: "location", headerName: "Location", width: 150 },
  ];
  const [rows, setRows] = useState(rowsDump);
  const [columns, setColumns] = useState(columnsDump);
  useEffect(() => {
    setRows(rowsDump);
    setColumns(columnsDump);
  }, []);

  const paginationModel = { page: 0, pageSize: 10 };

  return (
    <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={10}
        disableSelectionOnClick
        rowHeight={72}
        checkboxSelection
        slots={{
          footer: CustomFooter,
        }}
        sx={{
          height: "auto", // Adjust height based on content
          minHeight: "72px", // Ensures a minimum height for the grid
          "& .MuiDataGrid-cell--textLeft": {
            alignContent: "center",
          },
          "& .MuiDataGrid-virtualScrollerRenderZone": {
            height: "calc(100%)",
            overflow: "auto",
          },
          "& .MuiDataGrid-virtualScroller": {
            height: "calc(100vh - 14rem)",
          },
          "& .MuiDataGrid-columnHeader.MuiDataGrid-columnHeader--sortable, .MuiDataGrid-columnHeader.MuiDataGrid-columnHeader--alignCenter.MuiDataGrid-withBorderColor.MuiDataGrid-columnHeaderCheckbox": {
            backgroundColor: "#333A45",
            color: "#FFFFFF",
          },
          "& .MuiDataGrid-columnHeaderTitleContainer .MuiCheckbox-root, & .MuiDataGrid-columnHeaderTitleContainer .MuiIconButton-root, & .MuiDataGrid-menuIconButton": {
            color: "#FFFFFF !important",
          },
          "@media (max-width:600px)": {
            "& .MuiDataGrid-cell": {
              fontSize: "0.75rem", // Reduce font size for small screens
            },
          },
          "@media (max-width:900px)": {
            "& .MuiDataGrid-cell": {
              fontSize: "0.8rem", // Slightly smaller for medium screens
            },
          },
          "@media (max-width:1200px)": {
            "& .MuiDataGrid-cell": {
              fontSize: "1rem", // Slightly larger for larger screens
            },
          },
        }}
      />
    </div>
  );
};

export default ComplaintsTable;
