import { generateCronTabFromTimestamp, ScheduleBodyParameters } from "./create";
import { mockClient } from "aws-sdk-client-mock";
import { EventBridgeClient, PutRuleCommand, PutTargetsCommand } from "@aws-sdk/client-eventbridge";
import { AddPermissionCommand, Lambda } from "@aws-sdk/client-lambda";
import schedulerCreate from "./create";
import { generateApiGatewayEvent } from "@common/test-utils";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { lambdaResponse } from "@common/lambda";

describe("generateCronTabFromTimestamp", () => {
  test("should create a one time crontab from a timestamp (UTC)", async () => {
    const now = new Date("2021-11-22T03:24:00.000Z");
    const cron = generateCronTabFromTimestamp("once", now);
    const expectedCron = "cron(24 3 22 11 ? 2021)";
    expect(cron).toEqual(expectedCron);
  });

  test("should create a daily crontab from a timestamp (UTC)", async () => {
    const now = new Date("2021-11-22T03:24:00.000Z");
    const cron = generateCronTabFromTimestamp("daily", now);
    const expectedCron = "cron(24 3 * * ? 2021)";
    expect(cron).toEqual(expectedCron);
  });

  test("should create a weekly crontab from a timestamp (UTC)", async () => {
    const now = new Date("2022-06-17T03:24:00.000Z");
    const cron = generateCronTabFromTimestamp("weekly", now);
    const expectedCron = "cron(24 3 ? * 6 2022)";
    expect(cron).toEqual(expectedCron);
  });

  test("should create a monthly crontab from a timestamp (UTC)", async () => {
    const now = new Date("2022-06-17T03:24:00.000Z");
    const cron = generateCronTabFromTimestamp("monthly", now);
    const expectedCron = "cron(24 3 17 * ? 2022)";
    expect(cron).toEqual(expectedCron);
  });

  test("should create a yearky crontab from a timestamp (UTC)", async () => {
    const now = new Date("2022-06-17T03:24:00.000Z");
    const cron = generateCronTabFromTimestamp("yearly", now);
    const expectedCron = "cron(24 3 17 6 ? *)";
    expect(cron).toEqual(expectedCron);
  });
});

describe("Create Schedule handler", () => {
  const eventBridgeMock = mockClient(EventBridgeClient);
  const dynamoddbClientMock = mockClient(DynamoDBDocumentClient);
  const lambdaMock = mockClient(Lambda);

  beforeEach(() => {
    eventBridgeMock.reset();
    lambdaMock.reset();
  });

  test("should schedule a sort operation", async () => {
    // Arrange AWS SDK Mocks
    eventBridgeMock
      .on(PutRuleCommand)
      .resolves({ RuleArn: "arn:aws:events:<region>:<account_id>:rule:MyTestRule" });
    lambdaMock.on(AddPermissionCommand).resolves({ Statement: "Test" });
    eventBridgeMock.on(PutTargetsCommand).resolves({ FailedEntryCount: 0 });
    dynamoddbClientMock.on(PutCommand).resolves({ Attributes: { id: "Test" } });

    // Arrange: Test event with minimum required parameters
    const testBody: ScheduleBodyParameters = {
      name: "test sort once",
      cadence: "once",
      operation: "sort",
      operationParameters: {
        playlistId: "test",
        property: "track.artists",
        order: "asc",
      },
      spotify: { access_token: "test-token", refresh_token: "test-token" },
      timestamp: "2021-11-22T03:24:00",
    };
    const testSchedulerCreateEvent = generateApiGatewayEvent({
      body: JSON.stringify(testBody),
    });

    const response = await schedulerCreate(testSchedulerCreateEvent);

    expect(eventBridgeMock.calls().length).toEqual(2);
    expect(lambdaMock.calls().length).toEqual(1);
    expect(dynamoddbClientMock.calls().length).toEqual(1);
    expect(response).toEqual(lambdaResponse(200, JSON.stringify({ FailedEntryCount: 0 })));
  });

  test("should error for missing body", async () => {
    // Arrange: No body in Event
    const testSchedulerCreateEvent = generateApiGatewayEvent();

    const response = await schedulerCreate(testSchedulerCreateEvent);
    expect(response).toEqual(lambdaResponse(400, "Missing body parameters"));
  });

  test("should error for invalid schedule create parameters", async () => {
    // Arrange: Invalid body in Event
    const testBody = {
      cadence: "twice",
      operation: "sort",
      timestamp: "2021-11-22T03:24:00",
    };
    const testSchedulerCreateEvent = generateApiGatewayEvent({
      body: JSON.stringify(testBody),
    });

    const response = await schedulerCreate(testSchedulerCreateEvent);
    expect(response).toEqual(lambdaResponse(400, "Invalid body parameters"));
  });

  // TODO: Write test for scheduling a workflow operation
});
