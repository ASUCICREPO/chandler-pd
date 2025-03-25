import { Stack, Typography } from "@mui/material";
import Filters from "./Filters";
import ComplaintsTable from "./ComplaintsTable";
import React, { useState } from "react";

const Complaints = () => {
  return (
    <>
      <Stack alignItems={"flex-start"} sx={{ overflowY: "hidden" }}>
        <Stack spacing={3} alignItems={"flex-start"} className="complaintsPageHeaderContainer" justifyContent={"center"}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            All Complaints
          </Typography>
          <Filters />
        </Stack>
        <Stack sx={{ width: "100%" }}>
          <ComplaintsTable />
        </Stack>
      </Stack>
    </>
  );
};

export default React.memo(Complaints);
