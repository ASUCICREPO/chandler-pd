#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkStack } from "../lib/cdk-stack";

const app = new cdk.App();

// Pull context values
const githubToken = app.node.tryGetContext("githubToken");
const githubOwner = app.node.tryGetContext("githubOwner") || "ASUCICREPO";
// const viteEnableAuth = app.node.tryGetContext("viteEnableAuth") || "DISABLED";

const clientId = app.node.tryGetContext("clientId");
const clientSecret = app.node.tryGetContext("clientSecret");
// const redirectUri = app.node.tryGetContext("redirectUri");
const authEndPoint = app.node.tryGetContext("authEndPoint");
const tokenEndPoint = app.node.tryGetContext("tokenEndPoint");
const tokenLogout = app.node.tryGetContext("tokenLogout");

// Validation
if (!githubToken) {
  throw new Error("GitHub token must be provided. Use -c githubToken=<your-token> when deploying.");
}
if (!clientId || !clientSecret || !authEndPoint || !tokenEndPoint || !tokenLogout) {
  throw new Error("One or more required auth environment variables are missing. Pass them using -c.");
}

// Now pass everything to the stack
new CdkStack(app, "CdkStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  githubToken,
  githubOwner,
  // viteEnableAuth,
  clientId,
  clientSecret,
  // redirectUri,
  authEndPoint,
  tokenEndPoint,
  tokenLogout,
});
