export default {
  chatEndpoint: "http://localhost:3001/chat",
  sessionUploadEndpoint: "http://localhost:3001/upload",
  providerName: "claude", // "openai" | "claude" | "ollama"
  conversationalStyle: "friendly", // "friendly" | "professional" | "casual" | "formal" | "technical" | "humorous" | "empathetic" | "concise" | "elaborate" | "socratic"
  outputFormat: "markdown", // "json" | "markdown" | "text"
  showLikeDislike: true,
  showPhotoUpload: true,
  followUpQuestions: 3,
  networkFailureMsg: "An error occurred. Please try again.",
  welcomeMessage: "Hello. How may I assist you today?",
};
