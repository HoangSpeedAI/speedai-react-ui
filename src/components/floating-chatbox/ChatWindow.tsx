import React, { useState, useRef, useEffect } from "react";
import styled, { DefaultTheme, keyframes } from "styled-components";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import config from "./config";
import { logger } from "../utils/logger";

const slideIn = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const ChatWindowWrapper = styled.div<{ theme: DefaultTheme }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  height: 400px;
  background-color: ${(props) => props.theme.background};
  border-radius: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${slideIn} 0.3s ease-out;
`;

const ChatHeader = styled.div<{ theme: DefaultTheme }>`
  background-color: ${(props) => props.theme.primary};
  color: ${(props) => props.theme.text};
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
`;

const CloseButton = styled.button<{ theme: DefaultTheme }>`
  background: none;
  border: none;
  color: ${(props) => props.theme.text};
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const ChatBody = styled.div`
  flex-grow: 1;
  padding: 15px;
  overflow-y: auto;
  scroll-behavior: smooth;
`;

const ChatInput = styled.input<{ theme: DefaultTheme }>`
  width: 100%;
  padding: 15px;
  border: none;
  border-top: 1px solid ${(props) => props.theme.border};
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.primary};
  }
`;

const MessageContainer = styled.div<{ sender: "user" | "bot" }>`
  display: flex;
  flex-direction: column;
  align-items: ${(props) =>
    props.sender === "user" ? "flex-end" : "flex-start"};
  margin-bottom: 10px;
`;

const MessageBubble = styled.div<{ sender: "user" | "bot" }>`
  background-color: ${(props) =>
    props.sender === "user" ? props.theme.userBubble : props.theme.botBubble};
  color: ${(props) =>
    props.sender === "user" ? props.theme.userText : props.theme.botText};
  padding: 10px 15px;
  border-radius: 18px;
  max-width: 80%;
  margin-bottom: 10px;
  align-self: ${(props) =>
    props.sender === "user" ? "flex-end" : "flex-start"};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const FeedbackButtons = styled.div`
  display: flex;
  margin-top: 5px;
`;

const FeedbackButton = styled.button<{ active?: boolean }>`
  background: none;
  border: none;
  color: ${(props) => (props.active ? props.theme.primary : props.theme.text)};
  cursor: pointer;
  margin-right: 5px;
  opacity: ${(props) => (props.active ? 1 : 0.5)};
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  liked?: boolean;
  disliked?: boolean;
  timestamp: number;
}

interface ChatWindowProps {
  onClose: () => void;
  theme: DefaultTheme;
  userId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose, theme, userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(uuidv4());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      saveSession();
    };
  }, []);

  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      saveSession();
      onClose();
    }, 300);
  };

  const saveSession = async () => {
    try {
      const sessionData = { id: sessionId.current, messages };
      localStorage.setItem(
        `chat_session_${sessionId.current}`,
        JSON.stringify(sessionData),
      );

      if (navigator.onLine) {
        await uploadSession(sessionData);
      }
    } catch (error) {
      logger.error("Error saving session:", error);
    }
  };

  const uploadSession = async (sessionData: unknown) => {
    try {
      await axios.post(config.sessionUploadEndpoint, sessionData);
    } catch (error) {
      logger.error("Error uploading session:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: uuidv4(),
      content: input,
      sender: "user",
      timestamp: Date.now(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");

    let botResponse: Message;

    if (config.offlineMode) {
      botResponse = {
        id: uuidv4(),
        content: config.offlineMessage,
        sender: "bot",
        timestamp: Date.now(),
      };
    } else {
      try {
        const response = await axios.post(config.openAIEndpoint, {
          prompt: input,
          userId: userId,
          sessionId: sessionId.current,
          // Add other necessary parameters for the OpenAI API
        });
        botResponse = {
          id: uuidv4(),
          content: response.data.choices[0].text,
          sender: "bot",
          timestamp: Date.now(),
        };
      } catch (error) {
        logger.error("Error fetching response from OpenAI:", error);
        botResponse = {
          id: uuidv4(),
          content: "An error occurred. Please try again.",
          sender: "bot",
          timestamp: Date.now(),
        };
      }
    }

    setMessages((prevMessages) => [...prevMessages, botResponse]);
  };

  const handleLikeDislike = (messageId: string, action: "like" | "dislike") => {
    setMessages(
      messages.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            liked: action === "like" ? !msg.liked : false,
            disliked: action === "dislike" ? !msg.disliked : false,
          };
        }
        return msg;
      }),
    );
  };

  return (
    <ChatWindowWrapper
      ref={wrapperRef}
      theme={theme}
      style={{ transform: isClosing ? "translateY(100%)" : "translateY(0)" }}
    >
      <ChatHeader theme={theme}>
        <span>Chat</span>
        <CloseButton onClick={handleClose} theme={theme}>
          <i className="fas fa-times"></i>
        </CloseButton>
      </ChatHeader>
      <ChatBody ref={chatBodyRef}>
        {messages.map((msg) => (
          <MessageContainer key={msg.id} sender={msg.sender}>
            <MessageBubble sender={msg.sender}>{msg.content}</MessageBubble>
            {msg.sender === "bot" && (
              <FeedbackButtons>
                <FeedbackButton
                  onClick={() => handleLikeDislike(msg.id, "like")}
                  active={msg.liked}
                >
                  <i className="fas fa-thumbs-up"></i>
                </FeedbackButton>
                <FeedbackButton
                  onClick={() => handleLikeDislike(msg.id, "dislike")}
                  active={msg.disliked}
                >
                  <i className="fas fa-thumbs-down"></i>
                </FeedbackButton>
              </FeedbackButtons>
            )}
          </MessageContainer>
        ))}
      </ChatBody>
      <ChatInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        placeholder="Type a message..."
        theme={theme}
      />
    </ChatWindowWrapper>
  );
};

export default ChatWindow;
