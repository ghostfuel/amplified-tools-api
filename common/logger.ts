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
  let user = event?.requestContext.identity.user;

  if (!event.headers["Authorization"]) {
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
