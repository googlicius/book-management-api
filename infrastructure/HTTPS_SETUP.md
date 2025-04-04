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
4. Add the variable:
   - `CERTIFICATE_ARN`: The ARN of your ACM certificate

The deployment workflow will automatically use this variable when deploying the stack.

## What happens during deployment

The deployment will:

1. Create Infrastructure Stack:
   - Set up an ALB with both HTTP and HTTPS listeners
   - Configure HTTPS using your certificate
   - Create a target group for your application
   - Set up HTTP to HTTPS redirection

2. Create Application Stack:
   - Create a Fargate service with your application
   - Register the Fargate tasks with the ALB target group
   - Configure auto-scaling based on CPU utilization

## Accessing Your Application

After deployment:

1. You can immediately access your application using the ALB DNS name, but it will show certificate warnings because the certificate is for your domain, not the ALB DNS name.

2. For proper HTTPS access, set up DNS records to point your domain to the ALB. See `DNS_SETUP.md` for detailed instructions.

## Troubleshooting

- **Certificate not found**: Ensure your certificate ARN is correct and the certificate is in the same region as your deployment
- **ALB health check failures**: Verify your service is responding correctly on the `/health` endpoint
- **Deployment errors about existing listeners**: You may need to destroy existing stacks with `cdk destroy --all` before redeploying

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