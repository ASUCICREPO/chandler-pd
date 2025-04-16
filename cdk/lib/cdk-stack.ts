import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as amplify from "@aws-cdk/aws-amplify-alpha";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

interface CdkStackProps extends cdk.StackProps {
  githubToken: string;
  githubOwner: string;
  viteApiUrl: string;
  viteEnableAuth: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    // 🔐 Store GitHub token in Secrets Manager
    const githubTokenSecret = new secretsmanager.Secret(this, "GitHubToken", {
      secretName: "chandler-pd-access-token-cdk",
      description: "GitHub Personal Access Token for Amplify",
      secretStringValue: cdk.SecretValue.unsafePlainText(props.githubToken),
    });

    // 🚀 Amplify App
    const amplifyApp = new amplify.App(this, "ComplaintsPortalApp", {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: props.githubOwner,
        repository: "chandler-pd",
        oauthToken: githubTokenSecret.secretValue,
      }),
      autoBranchCreation: {
        patterns: ["*"],
        basicAuth: amplify.BasicAuth.fromGeneratedPassword("auto-user"),
        pullRequestEnvironmentName: "staging",
      },
      buildSpec: cdk.aws_codebuild.BuildSpec.fromObjectToYaml({
        version: "1.0",
        frontend: {
          phases: {
            preBuild: {
              commands: ["cd frontend/complaints-portal", "npm ci"],
            },
            build: {
              commands: ["npm run build"],
            },
          },
          artifacts: {
            baseDirectory: "frontend/complaints-portal/dist",
            files: ["**/*"],
          },
          cache: {
            paths: ["frontend/complaints-portal/node_modules/**/*"],
          },
        },
      }),
    });

    // 🌱 Add main branch
    amplifyApp.addBranch("main");

    // 🔁 Add environment variables
    amplifyApp.addEnvironment("VITE_API_URL", props.viteApiUrl);
    amplifyApp.addEnvironment("VITE_ENABLE_AUTH", props.viteEnableAuth);
  }
}
