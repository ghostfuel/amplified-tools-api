import { APIGatewayProxyEvent } from "aws-lambda";
import winston, { Logger, format } from "winston";

export type LoggerContext = {
  requestId?: string;
  scheduleId?: string;
  rule?: string;
  method?: string;
  resource?: string;
  user: string | null;
};

export function createLogger(label?: string, context?: LoggerContext) {
  let consoleFormat = format.combine(format.timestamp(), format.json());

  // Custom console log format when not in Lambda
  if (!process.env.LAMBDA_TASK_ROOT) {
    consoleFormat = format.combine(
      format.timestamp(),
      format.colorize(),
      format.printf((log) => {
        const meta = {
          ...log,
          timestamp: undefined,
          label: undefined,
          level: undefined,
          message: undefined,
        };
        return `${log.timestamp} ${log.level}: [${log.label}] ${log.message}, ${JSON.stringify(
          meta,
        )}`;
      }),
    );
  }

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.json(),
    defaultMeta: { label, context },
    transports: [new winston.transports.Console({ format: consoleFormat })],
  });

  return logger;
}

export function addLoggerContext(logger: Logger, event: APIGatewayProxyEvent, label?: string) {
  logger.defaultMeta = {
    label: label || event.resource,
    context: {
      requestId: event.requestContext?.requestId,
      method: event.httpMethod,
      user: event.requestContext?.identity?.user,
    },
  };
}

export default createLogger();
