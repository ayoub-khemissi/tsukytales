import winston from "winston";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

const level =
  process.env.NODE_ENV === "production" ? "info" : "debug";

export const logger = winston.createLogger({
  level,
  levels,
  format: consoleFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "logs/errors.log",
      level: "error",
      maxsize: 2 * 1024 * 1024,
      maxFiles: 3,
      format: fileFormat,
    }),
  ],
});
