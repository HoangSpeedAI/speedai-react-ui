import React, { useState } from "react";
import styled, { DefaultTheme, keyframes } from "styled-components";
import ChatWindow from "./ChatWindow";
import config from "./config";

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
  }
`;

const StyledFloatingButton = styled.button<{ theme: DefaultTheme }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: ${(props) => props.theme.primary};
  color: ${(props) => props.theme.text};
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: ${pulseAnimation} 2s infinite;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
`;

interface FloatingButtonProps {
  theme: DefaultTheme;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ theme }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const userId = "user1";

  const toggleChat = () => setIsOpen(!isOpen);

  const handleClose = () => {
    console.log("ChatWindow closes");
  };

  return (
    <>
      {!isOpen && (
        <StyledFloatingButton onClick={toggleChat} theme={theme}>
          <i className="fas fa-comment"></i>
        </StyledFloatingButton>
      )}
      {isOpen && (
        <ChatWindow
          onClose={handleClose}
          theme={theme}
          userId={userId}
          config={{
            providerName: config.providerName,
            showLikeDislike: config.showLikeDislike,
            showPhotoUpload: config.showPhotoUpload,
            followUpQuestions: config.followUpQuestions,
            conversationalStyle: config.conversationalStyle,
            outputFormat: config.outputFormat,
            welcomeMsg: config.welcomeMessage,
            networkFailureMsg: config.networkFailureMsg,
            sessionUploadEndpoint: config.sessionUploadEndpoint,
            chatEndpoint: config.chatEndpoint,
          }}
        />
      )}
    </>
  );
};

export default FloatingButton;
