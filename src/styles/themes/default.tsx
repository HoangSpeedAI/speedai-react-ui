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

export const defaultTheme: Theme = {
  light: {
    primary: "#007bff",
    background: "#ffffff",
    text: "#ffffff",
    border: "#e0e0e0",
  },
  dark: {
    primary: "#0056b3",
    background: "#333333",
    text: "#ffffff",
    border: "#555555",
  },
};
