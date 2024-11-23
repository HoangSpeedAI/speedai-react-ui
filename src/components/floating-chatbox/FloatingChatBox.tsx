import React from "react";
import FloatingButton from "./FloatingButton";
import { defaultTheme } from "../../styles/themes/default";
import { elegantTheme } from "../../styles/themes/elegant";

interface Theme {
  primary: string;
  background: string;
  text: string;
  border: string;
}

interface Themes {
  light: Theme;
  dark: Theme;
}

interface FloatingChatBoxProps {
  theme?: "default" | "elegant";
  mode?: "light" | "dark";
}

const FloatingChatBox: React.FC<FloatingChatBoxProps> = ({
  theme = "default",
  mode = "light",
}) => {
  const themes: Record<string, Themes> = {
    default: defaultTheme,
    elegant: elegantTheme,
  };

  const selectedTheme = themes[theme][mode];

  return <FloatingButton theme={selectedTheme} />;
};

export default FloatingChatBox;
