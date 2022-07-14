import { APIGatewayProxyEvent } from "aws-lambda";
import winston, { Logger, format } from "winston";
import jwt_decode from "jwt-decode";
import { AWSCognitoIdTokenPayload } from "@custom/types/aws";

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
  if (!process.env.LAMBDA_TASK_ROOT || process.env.IS_OFFLINE) {
    consoleFormat = format.combine(
      format.timestamp(),
      format.colorize(),
      format.printf((log) => {
        const meta = {
          ...log,
          // Remove context objects for easier readablity in console
          context: undefined,
          timestamp: undefined,
          label: undefined,
          level: undefined,
          message: undefined,
        };

        let message = `${log.timestamp} ${log.level}: [${log.label}] ${log.message}`;

        // Do not add object properties to log message if the object is empty
        const metaString = JSON.stringify(meta);
        if (metaString !== "{}") message += `, ${metaString}`;

        return message;
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
  let user = event?.requestContext.identity.user;

  if (!event.headers || !event.headers["Authorization"]) {
    logger.info("No Authorization header", event.requestContext);
  } else {
    // Decode token for user id
    const decodedToken = jwt_decode<AWSCognitoIdTokenPayload>(event.headers["Authorization"]);
    user = decodedToken.sub;
  }

  logger.defaultMeta = {
    label: label || event.resource,
    context: {
      requestId: event.requestContext?.requestId,
      method: event.httpMethod,
      user,
    },
  };

  return logger.defaultMeta;
}

export default createLogger();
