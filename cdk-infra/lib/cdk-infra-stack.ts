import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from "@aws-cdk/aws-apigateway";

export class CdkInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "super-duper-guacamole-bucket");

    const lambdaRole = new iam.Role(
      this,
      "super-duper-guacamole-tvm-lambda-role",
      {
        roleName: "super-duper-guacamole-tvm-lambda-role",
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      }
    );
    // tenant role
    const tenantUserRole = new iam.Role(
      this,
      "super-duper-guacamole-user-role",
      {
        assumedBy: new iam.ArnPrincipal(lambdaRole.roleArn),
      }
    );
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [tenantUserRole.roleArn],
        actions: ["sts:AssumeRole"],
      })
    );
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["arn:aws:logs:*:*:*"],
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
      })
    );
    const tokenVendorMachineLambda = new lambda.Function(
      this,
      "super-duper-guacamole-tvm-lambda",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "main.handler",
        code: lambda.Code.fromAsset("../functions/token-vending-machine"),
        memorySize: 1024,
        role: lambdaRole,
      }
    );
    const region = cdk.Stack.of(this).region;
    tokenVendorMachineLambda.addEnvironment("REGION", region);
    tokenVendorMachineLambda.addEnvironment(
      "TENANT_USER_ROLE_ARN",
      tenantUserRole.roleArn
    );
    tokenVendorMachineLambda.addEnvironment("S3_BUCKET_ARN", bucket.bucketArn);

    const api = new apigateway.LambdaRestApi(this, "ApiGatewayAwsCredentials", {
      handler: tokenVendorMachineLambda,
    });

    new cdk.CfnOutput(this, "BucketName", { value: bucket.bucketName });
    new cdk.CfnOutput(this, "BucketArn", { value: bucket.bucketArn });
    new cdk.CfnOutput(this, "UserRoleArn", {
      value: tenantUserRole.roleArn,
    });
    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
  }
}
