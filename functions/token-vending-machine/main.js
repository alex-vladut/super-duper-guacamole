const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");

const client = new STSClient({ region: process.env.REGION });

const handler = async (event) => {
  const { organisationId, userId, type } = event.queryStringParameters;
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

  const command =
    type === "abac"
      ? // access control restricted through session tags
        new AssumeRoleCommand({
          RoleArn: process.env.TENANT_USER_ROLE_WITH_TAGS_ARN,
          RoleSessionName: `${userId}tag`,
          Tags: [
            {
              Key: "organisationId",
              Value: organisationId,
            },
            {
              Key: "userId",
              Value: userId,
            },
          ],
        })
      : // access control restricted through dynamic session policy
        new AssumeRoleCommand({
          RoleArn: process.env.TENANT_USER_ROLE_ARN,
          RoleSessionName: userId,
          Policy: getUserRolePolicy({ organisationId, userId }),
        });
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
        Action: [
          "s3:GetObject*",
          "s3:GetBucket*",
          "s3:List*",
          "s3:DeleteObject*",
          "s3:PutObject",
          "s3:Abort*",
        ],
        Resource: [
          process.env.S3_BUCKET_ARN,
          `${process.env.S3_BUCKET_ARN}/${organisationId}/${userId}/*`,
        ],
        // Setting the condition didn't seem to work
        // Condition: {
        //   StringLike: {
        //     "s3:prefix": [`${organisationId}/${userId}/*`],
        //   },
        // },
        // https://docs.aws.amazon.com/AmazonS3/latest/userguide/amazon-s3-policy-keys.html
        // The condition restricts the user to listing object keys with the projects prefix. The added explicit deny denies the user request for listing keys with any other prefix no matter what other permissions the user might have. For example, it is possible that the user gets permission to list object keys without any restriction, either by updates to the preceding user policy or via a bucket policy. Because explicit deny always supersedes, the user request to list keys other than the projects prefix is denied.
        // {
        //   "Sid":"statement2",
        //   "Effect":"Deny",
        //   "Action": "s3:ListBucket",
        //   "Resource": "arn:aws:s3:::awsexamplebucket1",
        //   "Condition" : {
        //       "StringNotEquals" : {
        //           "s3:prefix": "projects"
        //       }
        //    }
        // }
      },
    ],
  });
}

module.exports = { handler };
