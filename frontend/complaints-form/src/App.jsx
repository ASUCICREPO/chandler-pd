import { useState } from "react";
import "./App.css";
import Stack from "@mui/material/Stack";
import logo from "./assets/logo.png";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Autocomplete, Button, Checkbox, Divider, FormControlLabel, FormHelperText, Radio, RadioGroup, TextField, Typography } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

// Enable UTC plugin
dayjs.extend(utc);

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const problemCategoryOptions = ["Speed", "Stop sign", "Red light", "School traffic complaint", "Racing", "Reckless Driving"];

function App() {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      isUrgentChecked: false,
      firstName: "",
      lastName: "",
      daysOfWeek: [],
      startTime: "",
      endTime: "",
      location: "",
      addressDirection: "",
      addressStreet: "",
      addressZipcode: "",

      intersection1Direction: "",
      intersection1Street: "",
      intersection2Direction: "",
      intersection2Street: "",
      intersectionZipcode: "",

      problemCategory: "",
      description: "",
      subscribeToAlerts: null,
    },
  });
  const location = useWatch({ control, name: "location" });

  const onSubmit = (data) => {
    const startTimeUTC = data.startTime ? dayjs(data.startTime).utc().toISOString() : null;
    const endTimeUTC = data.endTime ? dayjs(data.endTime).utc().toISOString() : null;
    if (data.location === "address") {
      data = { ...data, intersection1Direction: "", intersection1Street: "", intersection2Direction: "", intersection2Street: "", intersectionZipcode: "", startTime: startTimeUTC, endTime: endTimeUTC };
    } else {
      data = { ...data, addressDirection: "", addressStreet: "", addressZipcode: "", startTime: startTimeUTC, endTime: endTimeUTC };
    }
    console.log({ ...data, startTime: startTimeUTC, endTime: endTimeUTC });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack sx={{ width: "100%" }}>
            <Stack
              flexDirection={"row"}
              alignItems="center"
              spacing={8}
              sx={{
                height: "7rem",
                background: "#333A45",
                pl: "15%",
                pr: "15%",
                mt: 0,
                "@media (max-width: 768px)": {
                  pl: "2rem",
                  pr: "2rem",
                },
              }}
            >
              <img src={logo} width={72} height={86} alt="Logo" />
              <Typography sx={{ fontWeight: "bold", color: "#FFFFFF", marginTop: "0px !important", paddingLeft: "1rem" }} variant="h5">
                Chandler Police Department
              </Typography>
            </Stack>

            <Stack
              sx={{
                textAlign: "start",
                pl: "15%",
                pr: "15%",
                pb: 5,
                "@media (max-width: 768px)": {
                  pl: "2rem",
                  pr: "2rem",
                },
              }}
              spacing={4}
            >
              <Stack spacing={3}>
                <Typography className="pageHeaderTitle">Traffic Complaint Form</Typography>
                <Container title="Complaint" />

                <Typography variant="body1">Check box if NOT an active event</Typography>
                <Stack flexDirection={"row"} sx={{ border: "1px solid grey", p: "1rem" }}>
                  <Controller name="isUrgentChecked" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} sx={{ color: "#333A45 !important" }} />} />
                  <Typography variant="body1">If you have an issue, such as active street racing, illegally parked vehicles, or other active traffic events, please call dispatch at 480-782-4130 to make your report. Issues entered in Traffic Complaint Form can take up to 7 days to respond.</Typography>
                </Stack>
              </Stack>

              <Stack spacing={3}>
                <Container title="Complaint Details" />
                <Stack flexDirection={"row"} justifyContent={"flex-start"}>
                  <Controller
                    name="firstName"
                    control={control}
                    rules={{ required: "First Name is required" }}
                    render={({ field }) => (
                      <TextField
                        label="First Name"
                        variant="outlined"
                        sx={{
                          width: "30%",
                          mr: 10,
                          "@media (max-width: 768px)": {
                            width: "50%",
                            mr: 2,
                          },
                        }}
                        {...field}
                        error={!!errors.firstName}
                        helperText={errors.firstName ? errors.firstName.message : ""}
                      />
                    )}
                  />
                  <Controller
                    name="lastName"
                    control={control}
                    rules={{ required: "Last Name is required" }}
                    render={({ field }) => (
                      <TextField
                        label="Last Name"
                        variant="outlined"
                        sx={{
                          width: "30%",
                          mr: 10,
                          "@media (max-width: 768px)": {
                            width: "50%",
                            // mr: 10,
                          },
                        }}
                        {...field}
                        error={!!errors.lastName}
                        helperText={errors.lastName ? errors.lastName.message : ""}
                      />
                    )}
                  />
                </Stack>
                <Divider />
                <Typography className="sectionQuestions">
                  Day of Week
                  <Typography component="span" className="mandatory">
                    *
                  </Typography>
                </Typography>

                {/* {errors && <FormHelperText error>{JSON.stringify(errors)}</FormHelperText>} */}

                <Stack flexDirection={"row"} justifyContent={"flex-start"} flexWrap="wrap">
                  {/* Everyday Button */}
                  <Button variant="contained" onClick={() => setValue("daysOfWeek", daysOfWeek)} sx={{ mr: 5, width: "12rem" }} className="containedButton">
                    Everyday
                  </Button>

                  {/* Days of the Week */}
                  {daysOfWeek.map((day, index) => (
                    <Controller
                      key={day}
                      name="daysOfWeek"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value.includes(day)}
                              onChange={() => {
                                setValue("daysOfWeek", field.value.includes(day) ? field.value.filter((d) => d !== day) : [...field.value, day]);
                              }}
                            />
                          }
                          label={day}
                          sx={{
                            width: "50%", // Default to 50% for mobile
                            "@media (min-width: 768px)": {
                              width: "auto", // Reset to auto for larger screens
                            },
                          }}
                        />
                      )}
                    />
                  ))}
                </Stack>
                <Divider />
                <Stack direction="row">
                  {/* Start Time */}
                  <Stack
                    spacing={2}
                    sx={{
                      width: "30%",
                      mr: 10,
                      "@media (max-width: 768px)": {
                        width: "50%",
                        mr: 2,
                      },
                    }}
                  >
                    <Typography className="sectionQuestions">
                      Start Time
                      <Typography component="span" className="mandatory">
                        *
                      </Typography>
                    </Typography>
                    <Controller name="startTime" control={control} rules={{ required: "Start time is required" }} render={({ field }) => <TimePicker label="Start Time" value={field.value || null} onChange={(newValue) => field.onChange(newValue)} renderInput={(params) => <TextField {...params} fullWidth error={!!errors.startTime} helperText={errors.startTime?.message} />} ampm />} />
                  </Stack>

                  {/* End Time */}
                  <Stack
                    spacing={2}
                    sx={{
                      width: "30%",
                      mr: 10,
                      "@media (max-width: 768px)": {
                        width: "50%",
                        mr: 2,
                      },
                    }}
                  >
                    <Typography className="sectionQuestions">
                      End Time
                      <Typography component="span" className="mandatory">
                        *
                      </Typography>
                    </Typography>
                    <Controller name="endTime" control={control} rules={{ required: "End time is required" }} render={({ field }) => <TimePicker label="End Time" value={field.value || null} onChange={(newValue) => field.onChange(newValue)} renderInput={(params) => <TextField {...params} fullWidth error={!!errors.endTime} helperText={errors.endTime?.message} />} ampm />} />
                  </Stack>
                </Stack>
                <Divider />
                <Stack>
                  <Typography className="sectionQuestions">
                    Location of Problem
                    <Typography component="span" className="mandatory">
                      *
                    </Typography>
                  </Typography>
                  {errors.location && <FormHelperText error>{errors.location.message}</FormHelperText>}{" "}
                </Stack>
                <Stack flexDirection={"row"} justifyContent={"flex-start"}>
                  <Controller
                    name="location"
                    control={control}
                    rules={{ required: "Location is required" }}
                    render={({ field }) => (
                      <RadioGroup row {...field}>
                        <FormControlLabel value="intersection" control={<Radio />} label="Intersection" />
                        <FormControlLabel value="address" control={<Radio />} label="Address" />
                      </RadioGroup>
                    )}
                  />
                </Stack>
                {/* Show Address Input Fields when "Address" is selected */}
                {location === "address" && (
                  <Stack flexDirection={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 0 }} justifyContent={"flex-start"} flexWrap="wrap">
                    <Controller
                      name="addressDirection"
                      control={control}
                      rules={{ required: "Direction is required" }} // Make direction mandatory if location is address
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          options={["North", "South", "East", "West"]}
                          onChange={(_, value) => setValue("addressDirection", value)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Direction"
                              variant="outlined"
                              sx={{ width: "10rem", mr: 2 }} // Add margin right for spacing
                              error={!!errors.addressDirection}
                              helperText={errors.addressDirection ? errors.addressDirection.message : ""}
                            />
                          )}
                        />
                      )}
                    />
                    <Controller
                      name="addressStreet"
                      control={control}
                      rules={{ required: "Address is required" }} // Make address mandatory if location is address
                      render={({ field }) => <TextField {...field} label="Address" variant="outlined" sx={{ width: "30rem", mr: "1rem !important" }} error={!!errors.addressStreet} helperText={errors.addressStreet ? errors.addressStreet.message : ""} />}
                    />
                    <Controller
                      name="addressZipcode"
                      control={control}
                      rules={{
                        pattern: {
                          value: /^[0-9]{5}$/, // Ensure only 5 digits
                          message: "Zipcode must be 5 digits",
                        },
                        required: "Zipcode is required",
                      }}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          label="Zip Code"
                          variant="outlined"
                          sx={{ width: "10rem", mr: 2 }}
                          error={!!fieldState.error}
                          helperText={fieldState.error ? fieldState.error.address_message : ""}
                          inputProps={{
                            maxLength: 5,
                            onInput: (e) => {
                              // Only allow numeric input (block alphabets)
                              e.target.value = e.target.value.replace(/[^0-9]/g, "");
                            },
                          }}
                        />
                      )}
                    />
                  </Stack>
                )}
                {/* intersection1Direction: "", intersection1Street: "", intersection2Direction: "", intersection2Street: "", intersectionZipcode: "", */}
                {/* Show Intersection Input Fields when "Intersection" is selected */}
                {location === "intersection" && (
                  <Stack direction="column" spacing={2}>
                    {/* First Intersection Row */}
                    <Stack flexDirection={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap" alignItems={{ md: "flex-end" }}>
                      <Controller
                        name="intersection1Direction"
                        control={control}
                        rules={{ required: "Direction is required" }}
                        render={({ field }) => (
                          <Autocomplete {...field} options={["North", "South", "East", "West"]} onChange={(_, value) => setValue("intersection1Direction", value)} renderInput={(params) => <TextField {...params} label="Direction" variant="outlined" sx={{ width: { xs: "100%", md: "10rem" } }} error={!!errors.intersection1Direction} helperText={errors.intersection1Direction?.message} />} />
                        )}
                      />
                      <Controller name="intersection1Street" control={control} rules={{ required: "First Street is required" }} render={({ field }) => <TextField {...field} label="First Street" variant="outlined" sx={{ width: { xs: "100%", md: "30rem" } }} error={!!errors.intersection1Street} helperText={errors.intersection1Street?.message} />} />
                    </Stack>
                    <Divider sx={{ display: { xs: "block", md: "none", margin: "2rem 0rem 1rem 0rem !important" } }} />

                    {/* Second Intersection Row */}
                    <Stack flexDirection={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap" alignItems={{ md: "flex-end" }}>
                      <Controller
                        name="intersection2Direction"
                        control={control}
                        rules={{ required: "Direction is required" }}
                        render={({ field }) => (
                          <Autocomplete {...field} options={["North", "South", "East", "West"]} onChange={(_, value) => setValue("intersection2Direction", value)} renderInput={(params) => <TextField {...params} label="Direction" variant="outlined" sx={{ width: { xs: "100%", md: "10rem" } }} error={!!errors.intersection2Direction} helperText={errors.intersection2Direction?.message} />} />
                        )}
                      />
                      <Controller name="intersection2Street" control={control} rules={{ required: "Second Street is required" }} render={({ field }) => <TextField {...field} label="Second Street" variant="outlined" sx={{ width: { xs: "100%", md: "30rem" } }} error={!!errors.intersection2Street} helperText={errors.intersection2Street?.message} />} />
                      <Controller
                        name="intersectionZipcode"
                        control={control}
                        rules={{
                          pattern: { value: /^[0-9]{5}$/, message: "Zipcode must be 5 digits" },
                          required: "Zipcode is required",
                        }}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Zip Code"
                            variant="outlined"
                            sx={{ width: { xs: "100%", md: "10rem" } }}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            inputProps={{
                              maxLength: 5,
                              onInput: (e) => {
                                e.target.value = e.target.value.replace(/[^0-9]/g, "");
                              },
                            }}
                          />
                        )}
                      />
                    </Stack>
                  </Stack>
                )}
                <Divider />
                <Controller
                  name="problemCategory"
                  control={control}
                  rules={{ required: "Problem Category is required" }}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={problemCategoryOptions}
                      value={field.value || null} // Ensure the value is handled correctly
                      onChange={(_, newValue) => field.onChange(newValue)} // Update form state when selection changes
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Problem Category"
                          placeholder="Select Problem Type"
                          variant="outlined"
                          error={!!errors.problemCategory} // Show error if validation fails
                          helperText={errors.problemCategory ? errors.problemCategory.message : ""} // Display error message
                        />
                      )}
                      sx={{
                        width: "30%",

                        "@media (max-width: 768px)": {
                          width: "50%",
                        },
                      }}
                    />
                  )}
                />
                <Controller
                  name="description"
                  control={control}
                  rules={{
                    required: "Description is required", // Ensure the field is not empty
                    maxLength: {
                      value: 160,
                      message: "Description cannot exceed 160 characters", // Max character length validation
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Problem Description"
                      variant="outlined"
                      maxRows={2}
                      helperText={errors.description ? errors.description.message : "Maximum 160 Characters"}
                      sx={{ width: "100%", mr: 10 }}
                      error={!!errors.description} // Show error if there's any validation issue
                      inputProps={{ maxLength: 160 }} // Ensure no more than 160 characters can be typed
                    />
                  )}
                />
                <Divider />
                <Stack>
                  <Typography className="sectionQuestions">
                    Do you want to be contacted about this issue?
                    <Typography component="span" className="mandatory">
                      *
                    </Typography>
                  </Typography>
                  {errors.subscribeToAlerts && <FormHelperText error>{errors.subscribeToAlerts.message}</FormHelperText>}
                </Stack>
                <Stack flexDirection={"row"} justifyContent={"flex-start"}>
                  <Controller
                    name="subscribeToAlerts"
                    control={control}
                    rules={{ required: "This field is required" }}
                    render={({ field }) => (
                      <RadioGroup row {...field}>
                        <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                        <FormControlLabel value="no" control={<Radio />} label="No" />
                      </RadioGroup>
                    )}
                  />
                </Stack>
                <Button variant="contained" sx={{ width: "50%", mb: 5 }} className="containedButton" type="submit">
                  Submit Complaint
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </LocalizationProvider>
      </form>
    </>
  );
}

const Container = ({ title }) => (
  <Stack>
    <Typography className="sectionTitle">{title}</Typography>
  </Stack>
);

export default App;
