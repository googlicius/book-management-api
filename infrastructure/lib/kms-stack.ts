import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export class KmsStack extends cdk.Stack {
  public readonly sopsKey: kms.Key;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create KMS key for SOPS
    this.sopsKey = new kms.Key(this, 'SopsKey', {
      description: 'KMS key for SOPS encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Output the key ARN
    new cdk.CfnOutput(this, 'SopsKeyArn', {
      value: this.sopsKey.keyArn,
      description: 'KMS Key ARN for SOPS',
      exportName: 'BookManagementSopsKeyArn',
    });
  }
}
