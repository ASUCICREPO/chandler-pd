import React, { useState, useEffect } from "react";
import { Box, Grid, Typography } from "@mui/material";

const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

const FAQExamples = ({ onPromptClick }) => {
  const [faqs, setFaqs] = useState(shuffleArray(["What all are the new complaints that was received today?", "Which beat number has the highest number of open cases?", "Which beat number has received more number of complaints?", "How many complaints were closed yesterday ? List them"]).slice(0, 4));
  return (
    <Box display="flex" justifyContent="center" flexDirection={"column"} alignItems="center" gap={10}>
      <Typography variant="h5">What can I help with?</Typography>
      <Grid container spacing={2} sx={{ pl: 20, pr: 20 }}>
        {faqs.map((prompt, index) => (
          <Grid item key={index} xs={6} onClick={() => onPromptClick(prompt)}>
            <Grid
              alignItems={"center"}
              sx={{
                background: (theme) => theme.palette.background.botMessage,
                width: "100%",
                color: (theme) => theme.palette.getContrastText(theme.palette.background.botMessage),
                minHeight: "7rem",
                textAlign: "left",
                alignContent: "center",
                textTransform: "none", // Prevent text from being uppercase
                padding: 2,
                fontSize: 16,
                borderRadius: 2,
                fontWeight: 500,
              }}
            >
              {prompt}
            </Grid>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FAQExamples;
