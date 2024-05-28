import * as vscode from "vscode";
import * as winston from "winston";
import { LogOutputChannelTransport } from "winston-transport-vscode";

const outputChannel = vscode.window.createOutputChannel("Mogami", {
  log: true,
});

export const Logger = winston.createLogger({
  level: "trace",
  levels: LogOutputChannelTransport.config.levels,
  format: LogOutputChannelTransport.format(),
  transports: [new LogOutputChannelTransport({ outputChannel })],
});
