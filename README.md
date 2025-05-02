This is the primary codebase for Chandler PD

# 👮Chandler Police Department Dashboard Repository 🚔

Welcome to the **Chandler Police Department Dashboard** repository! This guide will walk you through the process of setting up and deploying the project using **CloudFormation Template** and **AWS CDK**.

## ⚙️ Prerequisites

Ensure that the following tools are installed before proceeding:

- A JSON file of a stack template

**For AWS CDK Deployment**

- **AWS CLI**: version `2.15.41`
- **AWS CDK**: version `2.1`

```
npm install
sudo npm install -g aws-cdk
```

---

## 🚀 Let's Get Started!

### Step 1: Initial Setup

1. **🍴 Fork the Repository**

   - Go to the repository on GitHub and click the **Fork** button in the top-right corner.

2. **🔐 Create a Personal Access Token (PAT)**
   - Navigate to **Settings** in GitHub.
   - Scroll down to **Developer Settings**.
   - Click **Personal Access Tokens**, and select **Tokens (classic)**.
   - Click **Generate New Token (classic)**.
   - Add a note like `ChandlerPD-token` to identify the token.
   - Set an expiration period that suits your needs.
   - Select the following scopes:
     - **repo** (Full control of private repositories)
     - **repo_hook** (Manage webhooks)
   - Click **Generate Token** and **store it securely** for later use.

---

## 🔧 Step 2: Setup Instructions

1. **📂 Clone the Forked Repository**

```bash
git clone <your-forked-repo-link>
```

### Deploying using Cloud Formation Template

- Proceed to CloudFormation Service on your AWS console
- Choose "Create Stack" --> "with new resources"
- Click "Choose an existing template" --> "Upload a template file" --> Upload the file and click next
- Provide the following parameters
	- githubToken – GitHub Personal Access Token used by Amplify to clone the source repo.
	- githubOwner – GitHub username or organization where the repo is hosted.
	- clientId – Client ID from MiniOrange.
	- clientSecret – Client Secret from MiniOrange.
	- authEndPoint – Authorization Endpoint URL.
	- tokenEndPoint – Access Token Endpoint used to exchange the auth code for an ID token.
	- redirectUri – Redirect URI to return to after login. This should match your deployed app’s Amplify URL (or http://localhost:5173/ for local testing).
	- tokenLogout – Logout Endpoint URL.
- Choose Next until you reach the "Review and Create" page
- Choose Submit

**This will start the Stack Creation**

### Deployment using AWS CDK

#### If you intend to change the name of your forked repo, please change the name in the cdk file as well

- Navigate to root_folder/CDK/lib/cdk-stack.ts
- Go to line 375
- Replace 'chandler-pd' with your new repository name.

2. **📁 Navigate to the CDK Folder**

```bash
cd chandler-pd/backend/cdk
```

3. **📦 Deploy the Application Using CDK**

```bash
cdk bootstrap \
  -c githubToken=GitHub Token \
  -c githubOwner=GitHub Owner \
  -c clientId=Client ID \
  -c clientSecret=Client Secret \
  -c authEndPoint='Authorize Endpoint' \
  -c tokenEndPoint='Access Token Endpoint' \
  -c redirectUri='http://localhost:5173/' \
  -c tokenLogout='OpenID Single Logout Endpoint'


cdk synth \
  -c githubToken=GitHub Token \
  -c githubOwner=GitHub Owner \
  -c clientId=Client ID \
  -c clientSecret=Client Secret \
  -c authEndPoint='Authorize Endpoint' \
  -c tokenEndPoint='Access Token Endpoint' \
  -c redirectUri='http://localhost:5173/' \
  -c tokenLogout='OpenID Single Logout Endpoint'

cdk deploy \
  -c githubToken=GitHub Token \
  -c githubOwner=GitHub Owner \
  -c clientId=Client ID \
  -c clientSecret=Client Secret \
  -c authEndPoint='Authorize Endpoint' \
  -c tokenEndPoint='Access Token Endpoint' \
  -c redirectUri='http://localhost:5173/' \
  -c tokenLogout='OpenID Single Logout Endpoint'
```

# 🏁 Almost There!

## Post-Deployment Instructions

1. **🔍 Access the Amplify App in the AWS Console**

   - Navigate to the **Amplify** service in your AWS Management Console.
   - Find and select the newly created **ComplaintForm** and **ComplaintPortal** app.

2. **🚀 Start the GitHub App Migration**

   - If prompted with a migration popup, click **Start Migration** to begin the setup process.
   - This ensures proper GitHub integration for continuous deployment.

3. **🔧 Configure the GitHub App**

   - Follow the steps to configure the **GitHub App** for your repository.
   - Complete the installation by selecting your repository and authorizing access.

4. **🏗️ Run the Amplify Build Job**
   - After configuring the GitHub App, return to the Amplify console.
   - Select your app, and click **Run Job** to trigger the deployment pipeline.
   - The job will build and deploy your chatbot automatically.

**Note:** Repeat the above steps for remaining app as well

5. **🌐 Access Your Deployed Dashboard**

   - Once the deployment is completed, Amplify will provide a **domain link**.
   - Click the link to access your live **Chandler PD Dashboard**.

6. **Update Redirect URL**
   Once the Complaints Portal App is successfully deployed via AWS Amplify, it will be assigned a unique domain name (e.g., https://main.<app-id>.amplifyapp.com

- Log in to your MiniOrange Admin Console

- Update the Redirect URI field to the new deployed Amplify app URL.

- Then redeploy the CDK stack with the updated redirect URI:

```bash
cdk deploy \
  -c githubToken=GitHub Token \
  -c githubOwner=GitHub Owner \
  -c clientId=Client ID \
  -c clientSecret=Client Secret \
  -c authEndPoint='Authorize Endpoint' \
  -c tokenEndPoint='Access Token Endpoint' \
  -c redirectUri='ComplaintsPortal Amplify App url' \
  -c tokenLogout='OpenID Single Logout Endpoint'
```

- Then, go to the ComplaintsPortal app in the AWS Amplify Console, and click “Redeploy” on the main branch (or relevant branch).

- This ensures that the new environment configuration is applied to the live app.

---

# 🎉 Congratulations!!

Your **Chandler PD Dashboard** has been successfully deployed! You can now explore your dashboard and start using it to enhance road safety initiatives throughout Chandler!!
