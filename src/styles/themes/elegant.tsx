interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  border: string;
}

interface Theme {
  light: ThemeColors;
  dark: ThemeColors;
}

export const elegantTheme: Theme = {
  light: {
    primary: "#6c5ce7",
    background: "#f5f6fa",
    text: "#000000", // Changed to ensure contrast with background
    border: "#dcdde1",
  },
  dark: {
    primary: "#4834d4",
    background: "#2f3640",
    text: "#ffffff",
    border: "#353b48",
  },
};
