import fs from "fs";
import path from "path";

class ErrorLogger {
  constructor() {
    // Use /tmp for production (Vercel, AWS Lambda, etc.)
    const baseDir =
      process.env.NODE_ENV === "production"
        ? "/tmp/logs"
        : path.join(process.cwd(), "logs");

    this.logFilePath = path.join(baseDir, "logfile.txt");
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFilePath);
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } catch (error) {
      console.error("Failed to create log directory:", error);
    }
  }

  formatLogEntry(methodName, customException) {
    const timestamp = new Date().toISOString();
    const cleanException = customException
      ? String(customException).replace(/\n/g, " ").replace(/\r/g, "")
      : "N/A";

    return `exception-time:       [${timestamp}]  
custom-exception:  [${methodName}] | 
system-exception:  [${cleanException}]\n\n\n`;
  }

  log(methodName, customMessage) {
    try {
      const logEntry = this.formatLogEntry(methodName, customMessage);
      fs.appendFileSync(this.logFilePath, logEntry, "utf8");
    } catch (writeError) {
      console.error("Failed to write to log file:", writeError);
    }
  }
}

export default new ErrorLogger();
