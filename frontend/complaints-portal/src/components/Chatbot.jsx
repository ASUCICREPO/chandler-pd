import React, { useState, useRef, useEffect } from "react";
import { Avatar, Typography, Box, Stack } from "@mui/material";
import Grid from "@mui/material/Grid";
import styled from "@emotion/styled";

// import ChatInput from "./ChatInput";
import UserAvatar from "../assets/UserAvatar.svg";
import BotAvatar from "../assets/BotAvatar.svg";
import createMessageBlock from "../utilities/createMessageBlock";

import { v4 as uuidv4 } from "uuid";
import FAQExamples from "./FAQExamples";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ChatInput from "./ChatInput";
// import FileResponse from "./FileResponse";
const API_URL = import.meta.env.VITE_API_URL;
const ALLOW_FAQ = true;
const sessionId = uuidv4();
function ChatBody() {
  const [messageList, setMessageList] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [questionAsked, setQuestionAsked] = useState(false);
  const messagesEndRef = useRef(null);
  const ws = useRef(null);
  const messageBuffer = useRef("");

  useEffect(() => {
    scrollToBottom();
    console.log(messageList);
  }, [messageList]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSendMessage = async (message) => {
    setProcessing(true);
    setQuestionAsked(true);
    // Add user message to the list
    const userMessageBlock = createMessageBlock(message, "USER", "TEXT", "SENT");

    // Create a placeholder for bot response
    const botMessageBlock = createMessageBlock("", "BOT", "TEXT", "INITIAL_PROCESSING");

    setMessageList((prevList) => [...prevList, userMessageBlock, botMessageBlock]);

    try {
      const response = await fetch(`${API_URL}chatBot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      setProcessing(false);
      const responseData = await response.json();
      const responseMessage = responseData.body.messages[0].content;

      setMessageList((prevList) => {
        const lastIndex = prevList.length - 1;
        const updatedList = [...prevList];
        if (lastIndex >= 0 && updatedList[lastIndex].sentBy === "BOT") {
          updatedList[lastIndex] = {
            ...updatedList[lastIndex],
            message: updatedList[lastIndex].message + responseMessage,
            state: "RECEIVED",
          };
        }
        return updatedList;
      });
    } catch (error) {}
  };

  const handlePromptClick = (prompt) => {
    handleSendMessage(prompt);
  };

  return (
    <>
      <Box display="flex" flexDirection="column" justifyContent="space-between" className="appHeight100 appWidth100">
        <Box className="appHeight100" sx={{ p: 2, pb: 0 }}>
          <Box className="chatScrollContainer">
            {!questionAsked && (
              <Box className="appHeight100" alignContent={"center"}>
                <FAQExamples onPromptClick={handlePromptClick} />
              </Box>
            )}

            {messageList.map((msg, index) => (
              <Box key={index} mb={2}>
                {msg.sentBy === "USER" ? <UserReply message={msg.message} type={msg.type} /> : <BotReply message={msg} processing={processing} />}
              </Box>
            ))}

            <div ref={messagesEndRef} />
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="flex-end" sx={{ flexShrink: 0, p: 2 }}>
          <Box sx={{ width: "100%" }} className="chatInputContainer">
            <ChatInput onSendMessage={handleSendMessage} processing={processing} message={message} setMessage={setMessage} />
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default ChatBody; // User reply component
function UserReply({ message, type, fileName }) {
  return (
    <Grid container direction="row" justifyContent="flex-end" alignItems="flex-end" spacing={2}>
      <Grid item className="userMessage" sx={{ backgroundColor: (theme) => theme.palette.background.userMessage, color: (theme) => theme.palette.getContrastText(theme.palette.background.userMessage) }}>
        <Typography variant="body2">{message}</Typography>
      </Grid>
      <Grid item>
        <Avatar alt={"User Profile Pic"} src={UserAvatar} />
      </Grid>
    </Grid>
  );
}

const BotReply = ({ message, processing }) => {
  return (
    <Grid container direction="row" justifyContent="flex-start" alignItems="flex-end" spacing={2}>
      <Grid item>
        <Avatar alt="Bot Avatar" src={BotAvatar} />
      </Grid>
      <Grid item container direction="column" sx={{ flex: 1 }} spacing={2}>
        {message.state === "INITIAL_PROCESSING" ? (
          <Stack direction={"row"}>
            <BlinkingDot sx={{ ml: 2, mb: 1 }} />
            <BlinkingDot sx={{ ml: 1, mb: 1 }} />
            <BlinkingDot sx={{ ml: 1, mb: 1 }} />
          </Stack>
        ) : (
          <Grid item container alignItems="center">
            <Grid item className="botMessage" sx={{ backgroundColor: (theme) => theme.palette.background.botMessage, color: (theme) => theme.palette.getContrastText(theme.palette.background.botMessage) }}>
              <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {message.message}
              </ReactMarkdown>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};
const getRandomDelay = () => `${Math.random() * 2}s`; // Random delay between 0s to 2s

const BlinkingDot = styled(Box)(({ theme }) => ({
  width: "10px",
  height: "10px",
  backgroundColor: "grey",
  borderRadius: "50%",
  animation: `blink 1s infinite`,
  animationDelay: getRandomDelay(), // Each dot gets a different start delay

  "@keyframes blink": {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.2 },
  },
}));
