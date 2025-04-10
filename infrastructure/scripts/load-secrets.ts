import * as path from 'path';
import { execSync } from 'child_process';
import * as yaml from 'js-yaml';

export function loadSecrets(): Record<string, string> {
  const secretsPath = path.join(__dirname, '../secrets/env.sops.yaml');
  
  try {
    // Decrypt the file using SOPS
    const decryptedContent = execSync(`sops --decrypt ${secretsPath}`, {
      encoding: 'utf8',
    });

    // Parse the YAML content
    const secrets = yaml.load(decryptedContent) as Record<string, string>;
    return secrets;
  } catch (error: any) {
    console.error('Error decrypting secrets:', error.message);
    return {};
  }
}
