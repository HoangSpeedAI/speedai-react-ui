export const logger = {
  error: async (message: string, error?: unknown) => {
    console.error(message, error);

    // Prepare log data
    // const logData = {
    //   message,
    //   error: error ? error.toString() : undefined,
    //   timestamp: new Date().toISOString(),
    // };

    // // Send log data to the server
    // try {
    //   await fetch("https://your-server-endpoint.com/logs", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(logData),
    //   });
    // } catch (sendError) {
    //   console.error("Failed to send log to server:", sendError);
    // }
  },

  // Add other log levels as needed (info, warn, etc.)
  info: (message: string) => {
    console.log(message);
    // Optionally send info logs to the server
  },

  warn: (message: string, warning?: unknown) => {
    console.warn(message, warning);
    // Optionally send warning logs to the server
  },
};
