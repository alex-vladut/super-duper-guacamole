## Description

A simple project to prototype implementing a Token Vending Machine for accessing AWS resources in a multi-tenant architecture. The mechanism is described in the AWS Whitepaper [SaaS Tenant Isolation Strategies](https://d1.awsstatic.com/whitepapers/saas-tenant-isolation-strategies.pdf) and [this article](https://aws.amazon.com/blogs/apn/isolating-saas-tenants-with-dynamically-generated-iam-policies/), for the implementation specific details. Another interesting read is [this article](https://aws.amazon.com/blogs/security/how-to-implement-saas-tenant-isolation-with-abac-and-aws-iam/) where ABAC is used for the access strategy instead of dynamically generating IAM policies.

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

## Other resources

- https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazons3.html
- https://stackoverflow.com/questions/37617844/restricting-file-types-on-amazon-s3-bucket-with-a-policy
- https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-UsingHTTPPOST.html

## Production bundle size

### Barebone app (no external dependencies)

File sizes after gzip:

```
  41.33 KB build/static/js/2.6d3420fc.chunk.js
  1.62 KB build/static/js/3.c68cbf14.chunk.js
  1.17 KB build/static/js/runtime-main.0e69a58b.js
  376 B build/static/js/main.ab092e2e.chunk.js
  278 B build/static/css/main.6dea0f05.chunk.css
```

### With AWS S3 client

File sizes after gzip:

```
  107.55 KB (+66.21 KB)  build/static/js/2.5d91f082.chunk.js
  1.65 KB (+1.29 KB)     build/static/js/main.e29714ae.chunk.js
  1.62 KB (+1 B)         build/static/js/3.ccf98651.chunk.js
  1.17 KB                build/static/js/runtime-main.2156dbdb.js
  531 B (+253 B)         build/static/css/main.8c8b27cf.chunk.css
```

### With AWS S3 client and sign method

File sizes after gzip:

```
  108.71 KB (+1.17 KB)  build/static/js/2.0d33c129.chunk.js
  1.82 KB (+174 B)      build/static/js/main.2c44fc0a.chunk.js
  1.62 KB (+1 B)        build/static/js/3.294c4897.chunk.js
  1.16 KB (-1 B)        build/static/js/runtime-main.fe5f8a5c.js
  531 B                 build/static/css/main.8c8b27cf.chunk.css
```
