#!/bin/sh

set -e

# Text formatting
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to display steps
function step() {
  echo -e "${BOLD}${GREEN}== $1 ==${NC}"
}

# Function to display info
function info() {
  echo -e "${YELLOW}$1${NC}"
}

# Function to display error and exit
function error() {
  echo -e "${RED}ERROR: $1${NC}" >&2
  exit 1
}

# Ensure AWS CLI is installed
if ! command -v aws &> /dev/null; then
  error "AWS CLI is not installed. Please install it: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
fi

# Check if the security group ID is provided
if [ -z "$1" ]; then
  error "Usage: $0 <security-group-id>"
fi

SG_ID="$1"
info "Using security group: $SG_ID"

# Get your public IP
step "Detecting your public IP address"
YOUR_IP=$(curl -s ifconfig.me)

if [ -z "$YOUR_IP" ]; then
  error "Failed to get your public IP address"
fi

info "Your public IP: $YOUR_IP"

# Add /32 suffix for CIDR notation if not present
if [[ "$YOUR_IP" != */* ]]; then
  YOUR_IP="${YOUR_IP}/32"
  info "CIDR notation: $YOUR_IP"
fi

# Function to clean up on exit
function cleanup() {
  if [ $? -ne 0 ]; then
    echo ""
    info "Script was interrupted or failed"
  fi
  
  step "Removing temporary security group rule"
  aws ec2 revoke-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5432 \
    --cidr $YOUR_IP

  if [ $? -eq 0 ]; then
    info "Security group rule successfully removed"
  else
    error "Failed to remove security group rule. Please check and remove manually!"
  fi
}

# Set trap to ensure cleanup happens even if the script fails
# trap cleanup EXIT

# Add temporary security group rule
step "Adding temporary security group rule"
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr $YOUR_IP

if [ $? -ne 0 ]; then
  error "Failed to add security group rule"
fi

info "Security group rule successfully added to allow access from $YOUR_IP"
info "Your IP now has temporary access to port 5432 (PostgreSQL)"

# info "Cleaning up security group rule..."

# Cleanup happens automatically via the trap
