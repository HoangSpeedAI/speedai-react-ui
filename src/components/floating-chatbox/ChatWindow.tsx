import React, { useCallback, useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import styled, { DefaultTheme, keyframes } from "styled-components";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import {
  FaTimesCircle,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
  FaThumbsUp,
  FaThumbsDown,
  FaPlus,
} from "react-icons/fa";

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
  width: 400px;
  height: 500px;
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

  & > * {
    margin: 0;
  }
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

const FullscreenButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.text};
  cursor: pointer;
  font-size: 20px;
  margin-right: 10px;
`;

const LoadingDots = styled.div`
  display: inline-block;
  &::after {
    content: ".";
    animation: dots 1s steps(5, end) infinite;
  }

  @keyframes dots {
    0%,
    20% {
      content: ".";
    }
    40% {
      content: "..";
    }
    60% {
      content: "...";
    }
    80%,
    100% {
      content: "";
    }
  }
`;

const FollowUpQuestionButton = styled.button`
  background-color: transparent;
  color: ${(props) => props.theme.primary};
  border: 1px solid ${(props) => props.theme.primary};
  padding: 5px 5px;
  margin: 5px;
  border-radius: 5px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
  font-size: 0.9em;

  &:hover {
    background-color: ${(props) => props.theme.primary};
    color: ${(props) => props.theme.text};
  }
`;

const ResizeHandle = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 10px;
  height: 100%;
  cursor: ew-resize;
`;

const ResizeCorner = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
`;

const ContextMenu = styled.div`
  position: fixed;
  background-color: ${(props) => props.theme.background};
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 4px;
  padding: 5px 0;
  z-index: 1000;
`;

const ContextMenuItem = styled.div`
  padding: 5px 10px;
  cursor: pointer;
  &:hover {
    background-color: ${(props) => props.theme.primaryHover};
  }
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const AddButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${(props) => props.theme.primary};
  cursor: pointer;
  font-size: 20px;
  z-index: 1;
`;

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  liked?: boolean;
  disliked?: boolean;
  timestamp: number;
  followUpQuestions?: string[];
}

interface ChatWindowProps {
  onClose: () => void;
  theme: DefaultTheme;
  userId: string;
  config: {
    providerName: string;
    followUpQuestions: number;
    conversationalStyle: string;
    outputFormat: string;
    showLikeDislike: boolean;
    showPhotoUpload: boolean;
    networkFailureMsg: string;
    welcomeMsg: string;
    sessionUploadEndpoint: string;
    chatEndpoint: string;
  };
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  onClose,
  theme,
  userId,
  config: componentConfig,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    messageId: string;
  } | null>(null);
  const [input, setInput] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 400, height: 500 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(uuidv4());
  const showFollowUpQuestions = componentConfig.followUpQuestions > 0;

  useEffect(() => {
    setMessages([
      {
        id: uuidv4(),
        content: componentConfig.welcomeMsg,
        sender: "bot",
        timestamp: Date.now(),
      },
    ]);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu && !wrapperRef.current?.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      await axios.post(componentConfig.sessionUploadEndpoint, sessionData);
    } catch (error) {
      logger.error("Error uploading session:", error);
    }
  };

  const readStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder,
    botMessageId: string,
  ) => {
    let fullResponse = "";
    let followUpQuestions: string[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              // Response is complete
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === botMessageId
                    ? {
                        ...msg,
                        content: fullResponse,
                        followUpQuestions:
                          followUpQuestions.length > 0
                            ? followUpQuestions
                            : undefined,
                      }
                    : msg,
                ),
              );
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.followUpQuestions) {
                followUpQuestions = parsed.followUpQuestions;
              } else {
                fullResponse += parsed.text || "";
                setMessages((prevMessages) =>
                  prevMessages.map((msg) =>
                    msg.id === botMessageId
                      ? { ...msg, content: fullResponse }
                      : msg,
                  ),
                );
              }
            } catch (error) {
              console.error("Error parsing JSON:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error reading stream:", error);
    }
  };

  const handleSendMessage = useCallback(
    async (message: string = input) => {
      if (!message.trim()) return;

      const userMessage: Message = {
        id: uuidv4(),
        content: message,
        sender: "user",
        timestamp: Date.now(),
      };

      const botMessage: Message = {
        id: uuidv4(),
        content: "",
        sender: "bot",
        timestamp: Date.now(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage, botMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch(componentConfig.chatEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            userId,
            sessionId: sessionId.current,
            providerName: componentConfig.providerName,
            followUpQuestions: componentConfig.followUpQuestions,
            conversationalStyle: componentConfig.conversationalStyle,
            outputFormat: componentConfig.outputFormat,
          }),
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        await readStream(reader, decoder, botMessage.id);
      } catch (error) {
        logger.error("Error fetching response from chat endpoint:", error);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === botMessage.id
              ? { ...msg, content: componentConfig.networkFailureMsg }
              : msg,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, userId, componentConfig, sessionId],
  );

  const handleLikeDislike = useCallback(
    (messageId: string, action: "like" | "dislike") => {
      setMessages((messages) =>
        messages.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                liked: action === "like" ? !msg.liked : false,
                disliked: action === "dislike" ? !msg.disliked : false,
              }
            : msg,
        ),
      );
    },
    [],
  );

  const toggleFullscreen = useCallback(
    () => setIsFullscreen((prev) => !prev),
    [],
  );

  const handleResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = windowSize.width;
      const startHeight = windowSize.height;

      const doDrag = (e: MouseEvent) => {
        setWindowSize({
          width: startWidth - (e.clientX - startX),
          height: startHeight - (e.clientY - startY),
        });
      };

      const stopDrag = () => {
        document.removeEventListener("mousemove", doDrag);
        document.removeEventListener("mouseup", stopDrag);
      };

      document.addEventListener("mousemove", doDrag);
      document.addEventListener("mouseup", stopDrag);
    },
    [windowSize],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, messageId: string) => {
      e.preventDefault();
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) {
        setContextMenu({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          messageId,
        });
      }
    },
    [],
  );

  const handleContextMenuAction = useCallback(
    (action: string) => {
      if (!contextMenu) return;

      const message = messages.find((m) => m.id === contextMenu.messageId);
      if (!message) return;

      switch (action) {
        case "copy":
          navigator.clipboard
            .writeText(message.content)
            .then(() => console.log("Text copied to clipboard"))
            .catch((err) => console.error("Failed to copy text: ", err));
          break;
        case "share":
          console.log("Sharing message:", message.content);
          break;
      }

      setContextMenu(null);
    },
    [contextMenu, messages],
  );

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("photo", file);

      try {
        const response = await axios.post("/api/vision-chat", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const botMessage: Message = {
          id: uuidv4(),
          content: response.data.response,
          sender: "bot",
          timestamp: Date.now(),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error) {
        logger.error("Error uploading photo:", error);
      }
    },
    [],
  );

  return (
    <ChatWindowWrapper
      ref={wrapperRef}
      theme={theme}
      style={{
        transform: isClosing ? "translateY(100%)" : "translateY(0)",
        opacity: isClosing ? 0 : 1,
        transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
        width: isFullscreen ? "100%" : `${windowSize.width}px`,
        height: isFullscreen ? "100%" : `${windowSize.height}px`,
      }}
    >
      <ResizeHandle onMouseDown={handleResize} />
      <ResizeCorner onMouseDown={handleResize} />
      <ChatHeader theme={theme}>
        <span>Chat</span>
        <div>
          <FullscreenButton onClick={toggleFullscreen} theme={theme}>
            {isFullscreen ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />}
          </FullscreenButton>
          <CloseButton onClick={handleClose} theme={theme}>
            <FaTimesCircle />
          </CloseButton>
        </div>
      </ChatHeader>
      <ChatBody ref={chatBodyRef}>
        {messages.map((msg, index) => (
          <MessageContainer key={msg.id} sender={msg.sender}>
            <MessageBubble
              sender={msg.sender}
              onContextMenu={(e) => handleContextMenu(e, msg.id)}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              {contextMenu && contextMenu.messageId === msg.id && (
                <ContextMenu
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                  theme={theme}
                >
                  <ContextMenuItem
                    onClick={() => handleContextMenuAction("copy")}
                  >
                    Copy
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleContextMenuAction("share")}
                  >
                    Share
                  </ContextMenuItem>
                </ContextMenu>
              )}
            </MessageBubble>
            {componentConfig.showLikeDislike && msg.sender === "bot" && (
              <FeedbackButtons>
                <FeedbackButton
                  onClick={() => handleLikeDislike(msg.id, "like")}
                  active={msg.liked}
                >
                  <FaThumbsUp />
                </FeedbackButton>
                <FeedbackButton
                  onClick={() => handleLikeDislike(msg.id, "dislike")}
                  active={msg.disliked}
                >
                  <FaThumbsDown />
                </FeedbackButton>
              </FeedbackButtons>
            )}
            {showFollowUpQuestions &&
              msg.sender === "bot" &&
              index === messages.length - 1 &&
              msg.followUpQuestions &&
              msg.followUpQuestions.length > 0 && (
                <div>
                  {msg.followUpQuestions.map((question, index) => (
                    <FollowUpQuestionButton
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      theme={theme}
                    >
                      {question}
                    </FollowUpQuestionButton>
                  ))}
                </div>
              )}
          </MessageContainer>
        ))}
        {isLoading && (
          <MessageContainer sender="bot">
            <MessageBubble sender="bot">
              <LoadingDots />
            </MessageBubble>
          </MessageContainer>
        )}
      </ChatBody>
      <InputWrapper>
        <ChatInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage(input)}
          placeholder="Type a message..."
          theme={theme}
        />
        {componentConfig.showPhotoUpload && (
          <AddButton as="label" htmlFor="photo-upload" theme={theme}>
            <FaPlus />
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoUpload}
            />
          </AddButton>
        )}
      </InputWrapper>
      {contextMenu && (
        <ContextMenu
          style={{ top: contextMenu.y, left: contextMenu.x }}
          theme={theme}
        >
          <ContextMenuItem onClick={() => handleContextMenuAction("copy")}>
            Copy
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleContextMenuAction("share")}>
            Share
          </ContextMenuItem>
        </ContextMenu>
      )}
    </ChatWindowWrapper>
  );
};

export default ChatWindow;
