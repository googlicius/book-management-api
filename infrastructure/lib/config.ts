import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Get the ACM certificate ARN from environment variables
 * @returns The certificate ARN
 * @throws Error if certificate ARN is not provided
 */
export function getCertificateArn(): string {
  const certArn = process.env.CERTIFICATE_ARN;
  if (!certArn) {
    throw new Error('CERTIFICATE_ARN environment variable must be set');
  }
  return certArn;
}
