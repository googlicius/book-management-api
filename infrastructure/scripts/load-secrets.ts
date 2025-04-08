import * as path from 'path';
import { execSync } from 'child_process';
import * as yaml from 'js-yaml';

export function loadSecrets(): Record<string, string> {
  const secretsPath = path.join(__dirname, '../secrets/env.sops.yaml');
  const configPath = path.join(__dirname, '../.sops.yaml');
  
  try {
    // Decrypt the file using SOPS
    const decryptedContent = execSync(`sops --decrypt --config ${configPath} ${secretsPath}`, {
      encoding: 'utf8',
    });

    // Parse the YAML content
    const secrets = yaml.load(decryptedContent) as Record<string, string>;
    return secrets;
  } catch (error) {
    console.error('Error decrypting secrets:', error);
    process.exit(1);
  }
}

// Export the decrypted secrets
export const secrets = loadSecrets();
