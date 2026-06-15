#!/bin/bash

# Setup HTTPS for local development using mkcert
# This script installs mkcert and creates locally trusted SSL certificates

echo "Setting up HTTPS for local development..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "mkcert not found. Installing..."
    
    # Check OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install mkcert nss
        else
            echo "Homebrew not found. Please install Homebrew first: https://brew.sh"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y mkcert libnss3-tools
        elif command -v yum &> /dev/null; then
            sudo yum install -y mkcert nss-tools
        else
            echo "Please install mkcert manually: https://github.com/FiloSottile/mkcert"
            exit 1
        fi
    else
        echo "Unsupported OS. Please install mkcert manually: https://github.com/FiloSottile/mkcert"
        exit 1
    fi
fi

# Create certificates directory
mkdir -p ssl

# Install local CA
echo "Installing local CA..."
mkcert -install

# Generate certificate for localhost
echo "Generating SSL certificate for localhost..."
mkcert -key-file ssl/localhost-key.pem -cert-file ssl/localhost.pem localhost 127.0.0.1 ::1

echo "✓ HTTPS setup complete!"
echo "  Certificates saved to: ssl/"
echo "  You can now run: npm run dev:https"
