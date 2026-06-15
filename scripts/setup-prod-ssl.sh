#!/bin/bash

# SSL Certificate Setup for Production
# This script helps set up SSL certificates for production deployment

echo "SSL Certificate Setup for Production"
echo "===================================="
echo ""

# Create SSL directory
mkdir -p ssl

echo "Choose SSL certificate option:"
echo "1) Self-signed certificate (for testing)"
echo "2) Let's Encrypt (for production)"
echo "3) Use existing certificates"
echo ""
read -p "Enter option (1-3): " option

case $option in
    1)
        echo "Generating self-signed certificate..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        echo "✓ Self-signed certificate generated!"
        echo "  Location: ssl/"
        echo "  Warning: Browsers will show security warnings for self-signed certificates"
        ;;
    
    2)
        echo "Setting up Let's Encrypt certificates..."
        echo "This requires:"
        echo "  - A domain name pointed to this server"
        echo "  - Port 80 and 443 open"
        echo "  - certbot installed"
        echo ""
        
        if ! command -v certbot &> /dev/null; then
            echo "Installing certbot..."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install certbot
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                sudo apt-get update
                sudo apt-get install -y certbot
            fi
        fi
        
        read -p "Enter your domain name: " domain
        read -p "Enter your email for Let's Encrypt: " email
        
        echo "Obtaining certificate from Let's Encrypt..."
        sudo certbot certonly --standalone \
            -d $domain \
            --email $email \
            --agree-tos \
            --non-interactive
        
        echo "Copying certificates to ssl directory..."
        sudo cp /etc/letsencrypt/live/$domain/fullchain.pem ssl/cert.pem
        sudo cp /etc/letsencrypt/live/$domain/privkey.pem ssl/key.pem
        sudo chown $USER:$USER ssl/cert.pem ssl/key.pem
        
        echo "✓ Let's Encrypt certificates obtained!"
        echo "  Location: ssl/"
        echo "  Auto-renewal: certbot auto-renews by default"
        ;;
    
    3)
        echo "Using existing certificates..."
        read -p "Enter path to certificate file: " cert_path
        read -p "Enter path to private key file: " key_path
        
        cp $cert_path ssl/cert.pem
        cp $key_path ssl/key.pem
        
        echo "✓ Certificates copied to ssl/"
        ;;
    
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "Setting permissions..."
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "✓ SSL setup complete!"
echo "  Certificates are ready in: ssl/"
echo "  You can now deploy with: docker-compose up -d"
