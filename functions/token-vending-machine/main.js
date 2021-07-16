const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");

const client = new STSClient({ region: process.env.REGION });

const handler = async (event) => {
  const { organisationId, userId } = event.queryStringParameters;
  if (!organisationId || !userId) {
    return {
      statusCode: "400",
      body: JSON.stringify({ error: "Missing params" }),
    };
  }

  const params = {
    RoleArn: process.env.TENANT_USER_ROLE_ARN,
    RoleSessionName: `${organisationId}-${userId}`,
    Policy: getUserRolePolicy({ organisationId, userId }),
  };
  const command = new AssumeRoleCommand(params);
  const data = await client.send(command);

  return {
    statusCode: "200",
    body: JSON.stringify({ credentials: data.Credentials }),
  };
};

function getUserRolePolicy({ organisationId, userId }) {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
        Resource: [process.env.S3_BUCKET_ARN],
        Condition: {
          StringLike: {
            "s3:prefix": [`${organisationId}/${userId}/*`],
          },
        },
      },
    ],
  });
}

module.exports = { handler };