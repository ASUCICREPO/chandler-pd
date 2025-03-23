import * as React from "react";
import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { StatusComponent, CustomFooter, rowsDump } from "./ComplaintsTableHelper";
import useStore from "../store/store";
import nodata from "../assets/nodata.gif";
import { Dialog, DialogActions, DialogContent, Button, Skeleton, Typography } from "@mui/material";
import dayjs from "dayjs";
import ViewComplaint, { handleFieldChange } from "./ViewComplaint";

const statusColors = {
  Open: "#318D00",
  Closed: "#D32F2F",
  "Follow-Up": "#1976D2",
  "Red-Star": "#EF6C00",
};

const ComplaintsTable = () => {
  const { complaints, loading, updateComplaint, selectedRows, setSelectedRows, totalComplaints } = useStore();

  const [anchorEl, setAnchorEl] = useState(null);
  const [status, setStatus] = useState("");
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false); // State to control popup
  const [selectedComplaint, setSelectedComplaint] = useState(null); // State to control popup

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const showComplaintsDetails = (params) => {
    setOpenDetailsDialog(true);
    setSelectedComplaint(params.row);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setAnchorEl(null); // Close menu after selection
  };

  const columnsDump = [
    {
      field: "dateOfComplaint",
      headerName: "Date",
      minWidth: 125,
      flex: 1,
      valueGetter: (params) => (params ? dayjs(params).format("MM/DD/YYYY") : ""),
    },
    { field: "beatNumber", headerName: "Beat", minWidth: 100, flex: 1 },
    {
      field: "problemCategory",
      headerName: "Category",
      minWidth: 150,
      flex: 2,
      renderCell: (params) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            wordBreak: "break-word",
            lineHeight: "1.5",
          }}
        >
          {params.row.problemCategory}
        </div>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      minWidth: 400,
      flex: 4,
      renderCell: (params) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            wordBreak: "break-word",
            lineHeight: "1.5",
          }}
        >
          {params.row.description}
        </div>
      ),
    },
    {
      field: "complaintStatus",
      headerName: "Status",
      minWidth: 200,
      flex: 1,
      renderCell: (params) => <StatusComponent value={params.row.complaintStatus} id={params.row.complaintId} onChange={(status) => handleFieldChange(params.row.complaintId, "complaintStatus", status, updateComplaint)} />,
    },
    {
      field: "location",
      headerName: "Location",
      minWidth: 200,
      flex: 2,
      renderCell: (params) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            wordBreak: "break-word",
            lineHeight: "1.5",
          }}
        >
          {params.row.location === "address" ? `${params.row.addressDirection} ${params.row.addressStreet}, ${params.row.addressZipcode}` : params.row.location === "intersection" ? `${params.row.intersection1Direction} ${params.row.intersection1Street} & ${params.row.intersection2Direction} ${params.row.intersection2Street}, ${params.row.intersectionZipcode}` : "N/A"}
        </div>
      ),
    },
    {
      field: "reporter",
      headerName: "Reported By",
      minWidth: 200,
      flex: 2,
      valueGetter: (val, params) => {
        const { firstName, lastName, email, phone } = params;
        return `${firstName} ${lastName}${email ? ` (${email})` : phone ? ` (${phone})` : ""}`;
      },
    },
    {
      field: "daysOfWeek",
      headerName: "Days",
      width: 160,
      renderCell: (params) => params.row.daysOfWeek?.join(", ") || "N/A",
    },
    {
      field: "timeRange",
      headerName: "Time",
      width: 160,
      valueGetter: (val, params) => (params.startTime && params.endTime ? `${params.startTime} - ${params.endTime}` : "N/A"),
    },
  ];

  // Columns to be hidden initially
  const hiddenColumns = ["location", "reporter", "daysOfWeek", "timeRange"];
  const [columnVisibilityModel, setColumnVisibilityModel] = useState(hiddenColumns.reduce((acc, col) => ({ ...acc, [col]: false }), {}));

  const [columns, setColumns] = useState(columnsDump);

  return (
    <div style={{ width: "100%", height: "100%", overflowX: "auto" }}>
      <DataGrid
        rows={complaints?.length > 0 ? complaints : []}
        columns={isMobile ? columns.filter((col) => !hiddenColumns.includes(col.field)) : columns}
        getRowId={(row) => row?.complaintId}
        pageSizeOptions={[10]}
        rowHeight={72}
        checkboxSelection
        disableColumnFilter
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
        loading={loading} // Controls the skeleton loader
        pagination
        paginationMode="server" // Enables server-side pagination
        rowCount={totalComplaints} // Total complaints count from API
        // Key changes to separate row click from selection
        onRowClick={showComplaintsDetails}
        isRowSelectable={(params) => true}
        onRowSelectionModelChange={(newSelectionModel) => {
          setSelectedRows(newSelectionModel);
        }}
        rowSelectionModel={selectedRows}
        keepNonExistentRowsSelected
        // Disable the default row selection on click
        disableRowSelectionOnClick
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
        slots={{
          footer: CustomFooter,
          noRowsOverlay: () => (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <img src={nodata} alt="No Data" style={{ height: "50vh" }} />
              <p style={{ marginTop: "10px", fontSize: "1rem", color: "#666" }}>No data found for the selected filters.</p>
            </div>
          ),
        }}
        slotProps={{
          loadingOverlay: {
            variant: "skeleton", // Show skeleton loader when data is loading
          },
          noRowsVariant: "skeleton", // Skeleton display for "No Rows"
        }}
        sx={{
          minHeight: "400px",
          width: "100%",
          "& .MuiDataGrid-cell--textLeft": {
            alignContent: "center",
          },
          "& .MuiDataGrid-virtualScrollerRenderZone": {
            height: "calc(70vh)",
            overflow: "auto",
          },
          "& .MuiDataGrid-virtualScroller": {
            height: "calc(100vh - 14rem)",
          },
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: "#333A45",
            color: "#FFFFFF",
          },
          "& .MuiDataGrid-columnHeaderTitleContainer .MuiCheckbox-root, & .MuiDataGrid-columnHeaderTitleContainer .MuiIconButton-root, & .MuiDataGrid-menuIconButton": {
            color: "#FFFFFF !important",
          },
          "@media (max-width: 768px)": {
            "& .MuiDataGrid-cell": {
              fontSize: "0.75rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              justifyContent: "center",
            },
            "& .MuiDataGrid-columnHeader": {
              fontSize: "0.8rem",
            },
            "& .MuiDataGrid-columnHeaders": {
              display: "none",
            },
            "& .MuiDataGrid-row": {
              flexDirection: "column",
              padding: "8px",
              borderBottom: "1px solid #ddd",
            },
          },
        }}
      />
      <ViewComplaint openDetailsDialog={openDetailsDialog} setOpenDetailsDialog={setOpenDetailsDialog} complaint={selectedComplaint} setSelectedComplaint={setSelectedComplaint} />
    </div>
  );
};

export default ComplaintsTable;
