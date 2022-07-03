import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const dynamodb = new DynamoDBClient({ region: "eu-west-2" });
export const dynamoddbClient = DynamoDBDocumentClient.from(dynamodb);

export default dynamoddbClient;
