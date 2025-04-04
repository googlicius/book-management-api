# DNS Configuration for HTTPS Access

After deploying your infrastructure with HTTPS enabled, you need to configure DNS to make your service accessible via the domain in your certificate.

## Prerequisites

1. A registered domain name
2. Access to your domain's DNS settings (through your domain registrar or DNS provider)
3. The deployed ALB DNS name (available in the AWS console or from CDK outputs)

## Step 1: Find Your ALB DNS Name

When you deploy the infrastructure stack, the ALB DNS name will be displayed in the outputs:

```
BookManagementInfrastructureStack.ALBDNS = some-alb-12345.region.elb.amazonaws.com
```

You can also find this in the AWS Console:
1. Go to EC2 > Load Balancers
2. Select your load balancer (BookMa-ALB...)
3. Copy the DNS name from the "DNS name" field

## Step 2: Create DNS Records

You need to create either a CNAME record or an Alias record (if using Route 53) for your domain:

### If Using Route 53

1. Go to the Route 53 console
2. Select your hosted zone
3. Click "Create Record"
4. Set the record name to match your certificate domain (e.g., if your certificate is for `api.example.com`, use `api`)
5. Choose "Alias" as the record type
6. For the Alias target, select "Alias to Application and Classic Load Balancer"
7. Select your region
8. Select your load balancer from the dropdown
9. Click "Create records"

### If Using Another DNS Provider

1. Go to your DNS provider's management console
2. Create a CNAME record:
   - Name/Host: the subdomain part of your certificate domain (e.g., `api` for `api.example.com`)
   - Value/Target: the ALB DNS name (e.g., `some-alb-12345.region.elb.amazonaws.com`)
   - TTL: 300 seconds (or as low as allowed)
3. Save the record

## Step 3: Verify DNS Propagation

DNS changes can take time to propagate (usually 15 minutes to 24 hours). You can check if the DNS is resolving correctly using:

```bash
dig your-domain.com
```

or

```bash
nslookup your-domain.com
```

## Step 4: Access Your Application

Once DNS has propagated, you should be able to access your application at:

```
https://your-domain.com
```

Requests to `http://your-domain.com` will automatically be redirected to HTTPS.

## Troubleshooting

- **Certificate errors**: Ensure the domain in your DNS record exactly matches the domain in your certificate
- **HTTPS not working**: Check that your ALB security group allows traffic on port 443
- **DNS not resolving**: Verify your DNS settings and wait for propagation
- **Health check failures**: Make sure your application is responding correctly on the `/health` endpoint 