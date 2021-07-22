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

## With Uppy.io

File sizes after gzip:

```
  188.55 KB (+79.83 KB)  build/static/js/2.8a25f9c4.chunk.js
  10.12 KB               build/static/css/2.2fe82265.chunk.css
  2.42 KB (+615 B)       build/static/js/main.90115d6b.chunk.js
  1.62 KB                build/static/js/3.725a8cb9.chunk.js
  1.17 KB (+2 B)         build/static/js/runtime-main.786f0666.js
  278 B (-253 B)         build/static/css/main.6dea0f05.chunk.css
```

## Upload to S3 with Uppy.io

- I think there is no need to use the [Companion](https://uppy.io/docs/companion/) as this is only useful when uploading files directly from Google Drive, Dropbox etc. It will directly move files on the backend from the source to the destination in order to speed up the process so that it doesn't have to pass through the client and rely on the client's internet connection. Another functionality provided by the Companion is interacting with AWS S3 for uploading with multipart so that the client's won't have access to the AWS credentials (those will be stored server side and the server manages the interaction with S3 to initiate multipart upload, generate signed URLs, complete upload etc.) May be useful at a later stage, but not in the initial version.
- May be required to use this [Store](https://uppy.io/docs/stores/#Implementing-Stores) custom implementation to link Uppy's internal data to the data providers in ViewsTools.
- This plugin may be useful for compressing images before sending to S3 https://github.com/arturi/uppy-plugin-image-compressor/blob/master/src/index.js
- Evaluate if there is a need to configure [Transfer Acceleration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html) on the S3 bucket. Check also this speed checker http://s3-accelerate-speedtest.s3-accelerate.amazonaws.com/en/accelerate-speed-comparsion.html. This may be useful, as the clinics are located all over US, so some of them may be farther from the region we use.
- That looks useful - generate thumbnails https://uppy.io/docs/thumbnail-generator/
- restrict the types of files that can be uploaded with Uppy
- integrate the application with Minio for easier testing locally. I have to check if Minio supports multipart upload
- Consider using [Golden Retriever](https://uppy.io/docs/golden-retriever/) plugin to save the upload state on page refresh so that the user doesn't have to reupload the files in case the browser crashed.
- Here is a great article on how you can customise the Uppy Dashboard and allow meta fields to be edited or adding tags https://community.transloadit.com/t/uppy-aws-s3-pre-signed-url-nodejs-complete-example-including-metadata-and-tags/15137/5
- To restrict the permissions on S3 bucket, here are the permissions necessary for Multipart upload https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html#mpuAndPermissions

? not clear to me if they support resumable uploads when uploading directly to S3, or you would have to have an account on their platform?
? do we want to support Webcam source as well? will people use the app on mobile? - if it's not a huge effort I think it might be useful

## Install Uppy.io

```
yarn add @uppy/core @uppy/react @uppy/aws-s3-multipart
```
