# Setting up HTTPS for Book Management API

This guide explains how to deploy the Book Management API with HTTPS support.

## Prerequisites

1. An ACM certificate for your domain
2. AWS CLI configured with appropriate permissions

## Deployment Steps

1. Create an environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your certificate information:
   ```
   CERTIFICATE_ARN=arn:aws:acm:region:account-id:certificate/certificate-id
   ```

   Replace with your actual certificate ARN.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Deploy the stack:
   ```bash
   npm run cdk deploy -- --all
   ```

## Deployment with GitHub Actions

For automated deployments using GitHub Actions:

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Select the "Variables" tab
4. Add the following repository variable:
   - `CERTIFICATE_ARN`: The ARN of your ACM certificate

The deployment workflow will automatically use this variable when deploying the stack.

## What happens during deployment

The CDK stack will:
- Use your existing ACM certificate for HTTPS
- Configure the ALB with HTTPS listeners using the certificate
- Set up automatic HTTP to HTTPS redirection

## Troubleshooting

- **Certificate not found**: Ensure your certificate ARN is correct and the certificate is in the same region as your deployment
- **ALB health check failures**: Verify your service is responding correctly on the `/health` endpoint

## Security Considerations

- The setup includes automatic HTTP to HTTPS redirection
- The ALB security group only allows HTTP and HTTPS traffic
- Make sure your AWS account has appropriate IAM permissions for ACM

## Creating a Certificate in ACM

If you don't have a certificate yet, you can create one in the AWS Management Console:

1. Open the ACM console
2. Click "Request a certificate"
3. Choose "Request a public certificate" and click "Next"
4. Enter your domain name
5. Choose DNS validation and click "Request"
6. Follow the validation steps
7. Once validated, copy the certificate ARN for use in your deployment 