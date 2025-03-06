import React, { useState } from "react";
import { Autocomplete, Button, Stack, TextField } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
const Filters = () => {
  const [value, setValue] = useState();
  return (
    <>
      <Stack direction="row" justifyContent={"space-between"} sx={{ width: "100%" }}>
        <Stack direction="row" justifyContent={"flex-start"} spacing={2}>
          <Autocomplete
            sx={{ width: "12rem" }}
            size="small"
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
            }}
            id="filters"
            options={filters}
            renderInput={(params) => <TextField {...params} label="Filter" />}
          />
          <Button variant="outlined" size="small">
            Reset
          </Button>
        </Stack>
        <Button variant="outlined" startIcon={<EmailIcon />} size="small">
          Send Email
        </Button>
      </Stack>
    </>
  );
};

export default Filters;

const filters = [];
