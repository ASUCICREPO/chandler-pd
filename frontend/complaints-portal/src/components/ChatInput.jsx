import React, { useState, useEffect } from "react";
import { TextField, Grid, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

function ChatInput({ onSendMessage, processing, message, setMessage }) {
  const [helperText, setHelperText] = useState("");
  const handleTyping = (event) => {
    if (helperText) {
      setHelperText("");
    }
    setMessage(event.target.value);
  };

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      onSendMessage(message);
      setMessage("");
    } else {
      setHelperText("Test helper text");
    }
  };

  return (
    <Grid container item xs={12} alignItems="center" className="sendMessageContainer" sx={{ background: (theme) => theme.palette.background.chatLeftPanel }}>
      <Grid item xs>
        <TextField
          multiline
          maxRows={4}
          fullWidth
          placeholder={"Type your query"}
          id="USERCHATINPUT"
          value={message}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !processing) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          onChange={handleTyping}
          sx={{ "& fieldset": { border: "none" } }}
        />
      </Grid>
      <Grid item>
        <IconButton aria-label="send" disabled={processing} onClick={handleSendMessage} color={message.trim() !== "" ? "primary" : "default"}>
          <SendIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
}

export default ChatInput;
