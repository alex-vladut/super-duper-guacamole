## Description

A simple project to prototype implementing a Token Vending Machine for accessing AWS resources in a multi-tenant architecture. The mechanism is described in the AWS Whitepaper [SaaS Tenant Isolation Strategies](https://d1.awsstatic.com/whitepapers/saas-tenant-isolation-strategies.pdf) and [this article](https://aws.amazon.com/blogs/apn/isolating-saas-tenants-with-dynamically-generated-iam-policies/).

## Prerequisites

Make sure you have [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) and [Node.js v14+](https://nodejs.org/en/download/) installed on your machine. Also, you should have an AWS account and a profile configured so that you can deploy the resources to the cloud.

## Install

Follow these steps to install and start the application:

1. (Optional) If it is the first time you are using `AWS CDK` then run the following command to initialise the deployment:

```
cd cdk-infra
cdk bootstrap --profile <profile-name>
```

2. Build the infrastructure resources and deploy to cloud:

```
cd cdk-infra
npm run build
cdk deploy --profile <profile-name> -O ../frontend/src/exports.json
```

3. All the resources should be available now, so you can start the frontend app:

```
cd frontend
yarn start
```

## Investigate

- Is it safe to expose AWS credentials on the client side? => most likely should be OK, as those are short-lived and will have a very limited set of permissions attached to it anyways
- How can we restrict the types of files a user is allowed to upload and the maximum size of a file?
- Should evaluate the deployment bundle size (they say AWS SDK v3 is tree shakable, but should check if it's still too big for the client)
