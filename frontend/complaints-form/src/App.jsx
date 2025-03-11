import { useState } from "react";
import "./App.css";
import Stack from "@mui/material/Stack";
import logo from "./assets/logo.png";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { Autocomplete, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, FormHelperText, Radio, RadioGroup, TextField, Typography } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import success from "./assets/success.gif";
// Enable UTC plugin
dayjs.extend(utc);

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const problemCategoryOptions = ["Speed", "Stop sign", "Red light", "School traffic complaint", "Racing", "Reckless Driving"];
const API_URL = import.meta.env.VITE_API_URL;
function App() {
  const {
    control,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
    formState: { errors },
    trigger,
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
      email: "",
      phone: "",
      officersNote: "",
      beatNumber: "",
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "daysOfWeek", // Name of the field array
  });
  const subscribeToAlerts = watch("subscribeToAlerts"); // Watch checkbox state
  const location = watch("location"); // Watch checkbox state
  const [open, setOpen] = useState(false); // State to control popup

  const onSubmit = async (data) => {
    try {
      const startTimeUTC = data.startTime ? dayjs(data.startTime).utc().toISOString() : null;
      const endTimeUTC = data.endTime ? dayjs(data.endTime).utc().toISOString() : null;

      let formattedData = {
        ...data,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
      };

      if (data.location === "address") {
        formattedData = {
          ...formattedData,
          intersection1Direction: "",
          intersection1Street: "",
          intersection2Direction: "",
          intersection2Street: "",
          intersectionZipcode: "",
        };
      } else {
        formattedData = {
          ...formattedData,
          addressDirection: "",
          addressStreet: "",
          addressZipcode: "",
        };
      }

      // console.log("Submitting Data:", formattedData);

      const response = await fetch(`${API_URL}/Development`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      reset();
      setOpen(true);
      alert("Submission Successful!");
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Submission Failed. Please try again.");
    }
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
                    rules={{
                      required: "First Name is required", // Make it mandatory
                      maxLength: {
                        value: 50,
                        message: "First Name cannot be longer than 50 characters", // Max length validation
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        inputProps={{ maxLength: 50 }}
                        label={
                          <>
                            <Typography>
                              First Name
                              <Typography component="span" className="mandatory">
                                {" "}
                                *
                              </Typography>
                            </Typography>
                          </>
                        }
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
                    rules={{
                      required: "Last Name is required", // Make it mandatory
                      maxLength: {
                        value: 50,
                        message: "Last Name cannot be longer than 50 characters", // Max length validation
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        inputProps={{ maxLength: 50 }}
                        label={
                          <>
                            <Typography>
                              Last Name
                              <Typography component="span" className="mandatory">
                                {" "}
                                *
                              </Typography>
                            </Typography>
                          </>
                        }
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

                {/* Error Message for daysOfWeek */}
                <Controller
                  name="daysOfWeek"
                  control={control}
                  rules={{
                    required: {
                      value: true,
                      message: "At least one day must be selected",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <Stack>
                        <Typography className="sectionQuestions">
                          Days of the week
                          <Typography component="span" className="mandatory">
                            {" "}
                            *
                          </Typography>
                        </Typography>

                        {(errors.daysOfWeek || fieldState?.error) && <FormHelperText error>{errors?.daysOfWeek?.root?.message || fieldState?.error?.message}</FormHelperText>}
                      </Stack>

                      {/* Days of the Week */}
                      <Stack flexDirection={"row"} justifyContent={"flex-start"} flexWrap="wrap">
                        {/* Button to select every day */}
                        <Button
                          variant="contained"
                          onClick={() => {
                            // Select all days when "Everyday" is clicked
                            setValue("daysOfWeek", daysOfWeek);
                          }}
                          sx={{ mr: 5, width: "12rem" }}
                          className="containedButton"
                        >
                          Everyday
                        </Button>

                        {/* Days of the Week */}
                        {daysOfWeek.map((day) => {
                          const isSelected = field.value?.includes(day); // Check if the day is already in the array

                          return (
                            <FormControlLabel
                              key={day}
                              control={
                                <Checkbox
                                  checked={isSelected} // Check if the day is selected
                                  onChange={(e) => {
                                    const isChecked = e.target.checked; // Get the checked state
                                    if (isChecked) {
                                      field.onChange([...field.value, day]); // Append the selected day
                                    } else {
                                      field.onChange(field.value.filter((d) => d !== day)); // Remove the day from the array
                                    }
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
                          );
                        })}
                      </Stack>
                    </>
                  )}
                />

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
                    <Stack>
                      <Typography className="sectionQuestions">
                        Start Time
                        <Typography component="span" className="mandatory">
                          {" "}
                          *
                        </Typography>
                      </Typography>
                      {errors.startTime && <FormHelperText error>{errors.startTime.message}</FormHelperText>}{" "}
                    </Stack>

                    <Controller
                      name="startTime"
                      control={control}
                      rules={{ required: "Start time is required" }}
                      render={({ field }) => (
                        <TimePicker
                          label={
                            <>
                              <Typography>
                                Start Time
                                <Typography component="span" className="mandatory">
                                  {" "}
                                  *
                                </Typography>
                              </Typography>
                            </>
                          }
                          value={field.value || null}
                          onChange={(newValue) => field.onChange(newValue)}
                          renderInput={(params) => <TextField {...params} fullWidth error={!!errors.startTime} helperText={errors.startTime?.message} />}
                          ampm
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: errors.startTime ? "#d32f2f !important" : undefined, // Red border when error
                            },
                            "& .MuiFormLabel-root": {
                              color: errors.startTime ? "#d32f2f !important" : undefined, // Red label when error
                            },
                            "& .MuiFormLabel-root.Mui-focused": {
                              color: errors.startTime ? "#d32f2f !important" : undefined, // Red label when focused
                            },
                          }}
                        />
                      )}
                    />
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
                    <Stack>
                      <Typography className="sectionQuestions">
                        End Time
                        <Typography component="span" className="mandatory">
                          {" "}
                          *
                        </Typography>
                      </Typography>
                      {errors.endTime && <FormHelperText error>{errors.endTime.message}</FormHelperText>}{" "}
                    </Stack>
                    <Controller
                      name="endTime"
                      control={control}
                      rules={{ required: "End time is required" }}
                      render={({ field }) => (
                        <TimePicker
                          label={
                            <>
                              <Typography>
                                End Time
                                <Typography component="span" className="mandatory">
                                  {" "}
                                  *
                                </Typography>
                              </Typography>
                            </>
                          }
                          value={field.value || null}
                          onChange={(newValue) => field.onChange(newValue)}
                          renderInput={(params) => <TextField {...params} fullWidth error={!!errors.endTime} helperText={errors.endTime?.message} />}
                          ampm
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: errors.endTime ? "#d32f2f !important" : undefined, // Red border when error
                            },
                            "& .MuiFormLabel-root": {
                              color: errors.endTime ? "#d32f2f !important" : undefined, // Red label when error
                            },
                            "& .MuiFormLabel-root.Mui-focused": {
                              color: errors.endTime ? "#d32f2f !important" : undefined, // Red label when focused
                            },
                          }}
                        />
                      )}
                    />
                  </Stack>
                </Stack>
                <Divider />
                <Stack>
                  <Typography className="sectionQuestions">
                    Location of Problem
                    <Typography component="span" className="mandatory">
                      {" "}
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
                              label={
                                <>
                                  <Typography>
                                    Direction
                                    <Typography component="span" className="mandatory">
                                      {" "}
                                      *
                                    </Typography>
                                  </Typography>
                                </>
                              }
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
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={
                            <>
                              <Typography>
                                Address
                                <Typography component="span" className="mandatory">
                                  {" "}
                                  *
                                </Typography>
                              </Typography>
                            </>
                          }
                          variant="outlined"
                          sx={{ width: "30rem", mr: "1rem !important" }}
                          error={!!errors.addressStreet}
                          helperText={errors.addressStreet ? errors.addressStreet.message : ""}
                        />
                      )}
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
                          label={
                            <>
                              <Typography>
                                Zipcode
                                <Typography component="span" className="mandatory">
                                  {" "}
                                  *
                                </Typography>
                              </Typography>
                            </>
                          }
                          variant="outlined"
                          sx={{ width: "10rem", mr: 2 }}
                          error={!!errors.addressStreet}
                          helperText={errors.addressStreet ? errors.addressZipcode.message : ""}
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
                          <Autocomplete
                            {...field}
                            options={["North", "South", "East", "West"]}
                            onChange={(_, value) => setValue("intersection1Direction", value)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label={
                                  <>
                                    <Typography>
                                      Direction
                                      <Typography component="span" className="mandatory">
                                        {" "}
                                        *
                                      </Typography>
                                    </Typography>
                                  </>
                                }
                                variant="outlined"
                                sx={{ width: { xs: "50%", md: "10rem" }, mr: "1rem !important" }}
                                error={!!errors.intersection1Direction}
                                helperText={errors.intersection1Direction?.message}
                              />
                            )}
                          />
                        )}
                      />
                      <Controller
                        name="intersection1Street"
                        control={control}
                        rules={{ required: "First Street is required" }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label={
                              <>
                                <Typography>
                                  First Street
                                  <Typography component="span" className="mandatory">
                                    {" "}
                                    *
                                  </Typography>
                                </Typography>
                              </>
                            }
                            variant="outlined"
                            sx={{ width: { xs: "100%", md: "30rem" } }}
                            error={!!errors.intersection1Street}
                            helperText={errors.intersection1Street?.message}
                          />
                        )}
                      />
                    </Stack>
                    <Divider sx={{ display: { xs: "block", md: "none", margin: "2rem 0rem 1rem 0rem !important" } }} />

                    {/* Second Intersection Row */}
                    <Stack flexDirection={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap" alignItems={{ md: "flex-end" }}>
                      <Controller
                        name="intersection2Direction"
                        control={control}
                        rules={{ required: "Direction is required" }}
                        render={({ field }) => (
                          <Autocomplete
                            {...field}
                            options={["North", "South", "East", "West"]}
                            onChange={(_, value) => setValue("intersection2Direction", value)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label={
                                  <>
                                    <Typography>
                                      Direction
                                      <Typography component="span" className="mandatory">
                                        {" "}
                                        *
                                      </Typography>
                                    </Typography>
                                  </>
                                }
                                variant="outlined"
                                sx={{ width: { xs: "50%", md: "10rem" }, mr: "1rem !important" }}
                                error={!!errors.intersection2Direction}
                                helperText={errors.intersection2Direction?.message}
                              />
                            )}
                          />
                        )}
                      />
                      <Controller
                        name="intersection2Street"
                        control={control}
                        rules={{ required: "Second Street is required" }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label={
                              <>
                                <Typography>
                                  Second Street
                                  <Typography component="span" className="mandatory">
                                    {" "}
                                    *
                                  </Typography>
                                </Typography>
                              </>
                            }
                            variant="outlined"
                            sx={{ width: { xs: "100%", md: "30rem" }, mr: "1rem !important" }}
                            error={!!errors.intersection2Street}
                            helperText={errors.intersection2Street?.message}
                          />
                        )}
                      />
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
                            label={
                              <>
                                <Typography>
                                  Zipcode
                                  <Typography component="span" className="mandatory">
                                    {" "}
                                    *
                                  </Typography>
                                </Typography>
                              </>
                            }
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
                          label={
                            <>
                              <Typography>
                                Problem Category
                                <Typography component="span" className="mandatory">
                                  {" "}
                                  *
                                </Typography>
                              </Typography>
                            </>
                          }
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
                      label={
                        <>
                          <Typography>
                            Problem Description
                            <Typography component="span" className="mandatory">
                              {" "}
                              *
                            </Typography>
                          </Typography>
                        </>
                      }
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
                      {" "}
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
                {subscribeToAlerts && (
                  <Stack flexDirection={"row"} justifyContent={"flex-start"} alignItems="baseline">
                    {/* Phone Number */}
                    <Controller
                      name="phone"
                      control={control}
                      rules={{
                        required: subscribeToAlerts && !getValues("email") ? "Phone number or email is required" : false,
                        pattern: {
                          value: /^\(\d{3}\) \d{3}-\d{4}$/,
                          message: "Phone number must be in the format (xxx) xxx-xxxx",
                        },
                        minLength: {
                          value: 14,
                          message: "Phone number must be exactly 10 digits",
                        },
                        maxLength: {
                          value: 14,
                          message: "Phone number must be exactly 10 digits",
                        },
                      }}
                      render={({ field, fieldState }) => {
                        const handleChange = (e) => {
                          let value = e.target.value.replace(/\D/g, ""); // Remove all non-digits
                          if (value.length <= 10) {
                            value = value.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
                          }
                          field.onChange(value);

                          if (value.length > 0) {
                            setValue("email", getValues("email"), { shouldValidate: false });
                            trigger("email");
                          }
                        };

                        return (
                          <TextField
                            {...field}
                            value={field.value || ""}
                            label={
                              <>
                                <Typography>
                                  Phone Number
                                  {subscribeToAlerts && (
                                    <Typography component="span" className="mandatory">
                                      {" "}
                                      *
                                    </Typography>
                                  )}
                                </Typography>
                              </>
                            }
                            variant="outlined"
                            sx={{
                              width: "30%",
                              "@media (max-width: 768px)": {
                                width: "50%",
                                mr: 2,
                              },
                            }}
                            onChange={handleChange}
                            error={!!fieldState?.error}
                            helperText={fieldState?.error?.message}
                          />
                        );
                      }}
                    />

                    <Typography variant="body1" sx={{ width: "auto", textAlign: "center", mx: 2 }}>
                      or
                    </Typography>

                    {/* Email */}
                    <Controller
                      name="email"
                      control={control}
                      rules={{
                        required: subscribeToAlerts && !getValues("phone") ? "Phone number or email is required" : false,
                        pattern: {
                          value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: "Please enter a valid email address",
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          label={
                            <>
                              <Typography>
                                Email
                                {subscribeToAlerts && (
                                  <Typography component="span" className="mandatory">
                                    {" "}
                                    *
                                  </Typography>
                                )}
                              </Typography>
                            </>
                          }
                          variant="outlined"
                          sx={{
                            width: "30%",
                            "@media (max-width: 768px)": {
                              width: "50%",
                            },
                          }}
                          onChange={(e) => {
                            field.onChange(e.target.value);

                            // Remove required validation from phone if email is filled
                            if (e.target.value.length > 0) {
                              setValue("phone", getValues("phone"), { shouldValidate: false });
                              trigger("phone"); // Revalidate phone field
                            }
                          }}
                          error={!!fieldState?.error}
                          helperText={fieldState?.error ? fieldState?.error?.message : ""}
                        />
                      )}
                    />
                  </Stack>
                )}
                <Button variant="contained" sx={{ width: "50%", mb: 5 }} className="containedButton" type="submit">
                  Submit Complaint
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </LocalizationProvider>
      </form>
      <Dialog open={open} onClose={() => setOpen(false)}>
        {/* <DialogTitle>Complaint Submitted</DialogTitle> */}
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <>
            <img src={success} alt="Success" style={{ width: "120px", height: "120px" }} />
            <Typography>Your complaint has been successfully registered.</Typography>
          </>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const Container = ({ title }) => (
  <Stack>
    <Typography className="sectionTitle">{title}</Typography>
  </Stack>
);

export default App;
