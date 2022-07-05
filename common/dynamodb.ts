import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Token } from "@custom/types/spotify";

export const dynamodb = new DynamoDBClient({ region: "eu-west-2" });
export const dynamoddbClient = DynamoDBDocumentClient.from(dynamodb);

export type ScheduleItem = {
  id: string;
  user: string;
  schedule: string;
  createdAt: string;
  cadence: string;
  scheduledTimestamp: string;
  runCount: number;
  errorCount: number;
  operation: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operationParameters: Record<string, any>;
  rule: string;
  spotify?: Partial<Token>;
};

export default dynamoddbClient;
