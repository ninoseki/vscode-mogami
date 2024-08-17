import * as vscode from "vscode";
import * as winston from "winston";
import { LogOutputChannelTransport } from "winston-transport-vscode";

const createLogger = () => {
  try {
    const outputChannel = vscode.window.createOutputChannel("Mogami", {
      log: true,
    });

    return winston.createLogger({
      level: "trace",
      levels: LogOutputChannelTransport.config.levels,
      format: LogOutputChannelTransport.format(),
      transports: [
        new winston.transports.Console(),
        new LogOutputChannelTransport({ outputChannel }),
      ],
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    // for Jest
    return winston.createLogger({
      level: "trace",
      transports: [new winston.transports.Console()],
    });
  }
};

export const Logger = createLogger();
