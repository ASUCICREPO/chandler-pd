This is the primary codebase for Chandler PD

# Chandler Police Department Dashboard Repository

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
   **Note**: You can ignore the bootstrap version parameter as it is a necessary parameter with a default value
      - **Stack name** - Provide a suitable name for the stackset
      - **githubOwner** - Provide the organization name that this repo is created in
      - **githubToken** - Provide the Generated Token from the previous instructions
      - **viteEnableAuth** - Choose the DISABLED value
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
cdk bootstrap -c githubToken=$stored-github-token githubOwner=$github-owner-of-repo viteEnableAuth=“DISABLED”
cdk synth -c githubToken=$stored-github-token githubOwner=$github-owner-of-repo viteEnableAuth=“DISABLED”
cdk deploy -c githubToken=$stored-github-token githubOwner=$github-owner-of-repo viteEnableAuth=“DISABLED”
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

---

# 🎉 Congratulations!!

Your **Chandler PD Dashboard** has been successfully deployed! You can now explore your chatbot and start using it for breast cancer awareness and support.

