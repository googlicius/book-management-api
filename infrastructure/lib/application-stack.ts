import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
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
      assignPublicIp: true,
    });

    // Register the Fargate service with the ALB target group
    fargateService.attachToApplicationTargetGroup(infrastructureStack.targetGroup);

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
