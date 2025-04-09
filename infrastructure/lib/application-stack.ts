import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { InfrastructureStack } from './infrastructure-stack';
import { secrets } from '../scripts/load-secrets';

export class ApplicationStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    infrastructureStack: InfrastructureStack,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // Create the Fargate Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'BookManagementTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    // Add container to the task definition
    const container = taskDefinition.addContainer('BookManagementContainer', {
      image: ecs.ContainerImage.fromEcrRepository(infrastructureStack.repository),
      environment: secrets,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'book-management-api'
      }),
    });

    // Add port mapping to the container
    container.addPortMappings({
      containerPort: 3000,
      hostPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Create the Fargate Service
    const fargateService = new ecs.FargateService(this, 'BookManagementService', {
      cluster: infrastructureStack.cluster,
      taskDefinition,
      desiredCount: 1,
      securityGroups: [infrastructureStack.fargateSecurityGroup],
      // assignPublicIp: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Add the Fargate service as a target to the HTTPS listener
    infrastructureStack.httpsListener.addTargets('BookManagementServiceTarget', {
      port: 3000,
      targets: [fargateService],
      protocol: elbv2.ApplicationProtocol.HTTP,
      healthCheck: {
        path: '/health',
        healthyHttpCodes: '200',
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
        timeout: cdk.Duration.seconds(5),
        interval: cdk.Duration.seconds(30),
      },
    });

    // Set up auto scaling
    const scaling = fargateService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    new cdk.CfnOutput(this, 'ServiceURL', {
      value: infrastructureStack.alb.loadBalancerDnsName,
      description: 'Service URL',
    });
  }
}