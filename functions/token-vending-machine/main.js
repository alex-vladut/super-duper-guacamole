const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");

const client = new STSClient({ region: process.env.REGION });

const handler = async (event) => {
  const { organisationId, userId } = event.queryStringParameters;
  if (!organisationId || !userId) {
    return {
      statusCode: "400",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        error: "Missing organisationId and/or userId params",
      }),
    };
  }

  const params = {
    RoleArn: process.env.TENANT_USER_ROLE_ARN,
    RoleSessionName: userId,
    Policy: getUserRolePolicy({ organisationId, userId }),
  };
  const command = new AssumeRoleCommand(params);
  const data = await client.send(command);

  return {
    statusCode: "200",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({ credentials: data.Credentials }),
  };
};

function getUserRolePolicy({ organisationId, userId }) {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        // Action: ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
        Action: ["s3:*"], // <-- that doesn't work either, so it seems it's a problem with the condition not with the actions it needs
        Resource: ["*"], // [process.env.S3_BUCKET_ARN],
        // Condition: {
        //   StringLike: {
        //     "s3:prefix": [`${organisationId}/${userId}/*`],
        //   },
        // },
      },
    ],
  });
}

/**
 * Summary so that I won't forget:
 * - when the bucket ARN is specified in the IAM Tenant Role's policy it doesn't work, but it works with Resources: ['*']
 * - for the session IAM policy there is the same problem, but in addition to that the condition doesn't seem to work either (so it works with Resource: ["*"] and no Condition, but once the Condition is added I get an Unauthorized access error)
 */

module.exports = { handler };
