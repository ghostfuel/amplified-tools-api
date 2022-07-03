export const schedulesTable = {
  Type: "AWS::DynamoDB::Table",
  Properties: {
    TableName: "${self:service}-${self:provider.stage}-schedules-table",
    BillingMode: "PAY_PER_REQUEST",
    KeySchema: [
      {
        AttributeName: "id",
        KeyType: "HASH",
      },
      {
        AttributeName: "user",
        KeyType: "RANGE",
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: "id",
        AttributeType: "S",
      },
      {
        AttributeName: "user",
        AttributeType: "S",
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "user-index",
        KeySchema: [
          {
            AttributeName: "user",
            KeyType: "HASH",
          },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      },
    ],
  },
};

export default {
  Resources: { schedulesTable },
  Outputs: {
    schedulesTableName: { Value: { Ref: "schedulesTable" } },
  },
};
