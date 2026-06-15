#!/bin/bash

# SSL Certificate Renewal Script
# This script renews SSL certificates and updates the Docker containers

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 example.com"
    exit 1
fi

echo "Renewing SSL certificate for $DOMAIN..."

# Renew the certificate
sudo certbot renew --cert-name $DOMAIN

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/cert.pem ssl/key.pem

# Set correct permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

# Restart nginx to load new certificates
docker-compose restart nginx

echo "✓ SSL certificate renewed and nginx restarted"
