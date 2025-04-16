#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();

// Pull context values
const githubToken = app.node.tryGetContext("githubToken");
const githubOwner = app.node.tryGetContext("githubOwner") || "ASUCICREPO";
const viteApiUrl = app.node.tryGetContext("viteApiUrl");
const viteEnableAuth = app.node.tryGetContext("viteEnableAuth") || "DISABLED";

if (!githubToken) {
  throw new Error("GitHub token must be provided. Use -c githubToken=<your-token> when deploying.");
}

if (!viteApiUrl) {
  throw new Error("viteApiUrl must be provided. Use -c viteApiUrl=<your-url> when deploying.");
}

new CdkStack(app, 'CdkStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  githubToken,
  githubOwner,
  viteApiUrl,
  viteEnableAuth,
});