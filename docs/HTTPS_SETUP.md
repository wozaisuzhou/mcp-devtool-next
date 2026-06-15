# HTTPS Setup Guide

This guide explains how to set up HTTPS for both development and production environments.

## Development HTTPS Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- mkcert (will be installed automatically by the setup script)

### Quick Start

1. **Install mkcert and generate certificates:**
   ```bash
   npm run setup:https
   ```

2. **Run the development server with HTTPS:**
   ```bash
   npm run dev:https
   ```

3. **Access your app:**
   ```
   https://localhost:3443
   ```

### Manual Setup

If the automated script doesn't work, you can set up HTTPS manually:

1. **Install mkcert:**
   ```bash
   # macOS
   brew install mkcert nss
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install mkcert libnss3-tools
   ```

2. **Install local CA:**
   ```bash
   mkcert -install
   ```

3. **Generate certificates:**
   ```bash
   mkdir -p ssl
   mkcert -key-file ssl/localhost-key.pem -cert-file ssl/localhost.pem localhost 127.0.0.1 ::1
   ```

4. **Run with HTTPS:**
   ```bash
   npm run dev:https
   ```

## Production HTTPS Setup

### Option 1: Self-Signed Certificates (Testing)

1. **Generate self-signed certificates:**
   ```bash
   ./scripts/setup-prod-ssl.sh
   # Choose option 1
   ```

2. **Deploy with Docker:**
   ```bash
   docker-compose up -d
   ```

⚠️ **Warning**: Browsers will show security warnings for self-signed certificates. Use only for testing!

### Option 2: Let's Encrypt (Recommended for Production)

1. **Prepare your server:**
   - Have a domain name pointed to your server
   - Ensure ports 80 and 443 are open
   - Have a valid email address

2. **Generate Let's Encrypt certificates:**
   ```bash
   ./scripts/setup-prod-ssl.sh
   # Choose option 2
   # Enter your domain and email when prompted
   ```

3. **Deploy with Docker:**
   ```bash
   docker-compose up -d
   ```

### Option 3: Existing Certificates

If you already have SSL certificates:

1. **Copy your certificates:**
   ```bash
   ./scripts/setup-prod-ssl.sh
   # Choose option 3
   # Enter paths to your certificate files
   ```

2. **Deploy with Docker:**
   ```bash
   docker-compose up -d
   ```

## SSL Certificate Renewal

### Let's Encrypt Auto-Renewal

Let's Encrypt certificates are valid for 90 days and need to be renewed.

1. **Manual renewal:**
   ```bash
   ./scripts/renew-ssl.sh your-domain.com
   ```

2. **Set up automatic renewal (recommended):**
   ```bash
   # Add to crontab for weekly renewal check
   crontab -e
   
   # Add this line (runs every week at 3 AM):
   0 3 * * 0 /path/to/mcp-devtool-next/scripts/renew-ssl.sh your-domain.com
   ```

## Docker Deployment

### Environment Setup

1. **Copy environment example:**
   ```bash
   cp .env.example .env.production
   ```

2. **Edit production environment:**
   ```bash
   nano .env.production
   ```
   
   Set these important values:
   ```env
   JWT_SECRET=your-production-secret-key-min-32-characters
   NODE_ENV=production
   NEXT_PUBLIC_DEFAULT_SERVER_URL=https://your-mcp-server.com/mcp
   ```

### Deploy with Docker

1. **Build and start containers:**
   ```bash
   docker-compose up -d --build
   ```

2. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop containers:**
   ```bash
   docker-compose down
   ```

### Docker Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f nextjs
docker-compose logs -f nginx

# Restart services
docker-compose restart

# Update and redeploy
docker-compose down
docker-compose up -d --build
```

## Security Configuration

The Nginx configuration includes several security features:

- **HTTP to HTTPS redirect**: All HTTP traffic is automatically redirected to HTTPS
- **Modern SSL protocols**: TLS 1.2 and 1.3 only
- **Security headers**: HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Rate limiting**: API endpoints are rate-limited to prevent abuse
- **Gzip compression**: Reduces bandwidth usage

## Troubleshooting

### Certificate Issues

**Problem**: Browser shows "Not Secure" warning
- **Solution**: For development, ensure you ran `mkcert -install`. For production, use Let's Encrypt.

**Problem**: Certificate expired
- **Solution**: Run `./scripts/renew-ssl.sh your-domain.com`

**Problem**: Port 443 already in use
- **Solution**: Stop other services using port 443 or change the port in nginx.conf

### Docker Issues

**Problem**: Container won't start
- **Solution**: Check logs with `docker-compose logs`, ensure SSL certificates exist in ssl/ directory

**Problem**: Can't access the application
- **Solution**: Ensure ports 80 and 443 are open in your firewall

### Development Issues

**Problem**: HTTPS setup script fails
- **Solution**: Install mkcert manually and generate certificates as shown in Manual Setup above

**Problem**: Changes not reflecting
- **Solution**: Clear browser cache or use incognito mode

## Best Practices

1. **Always use HTTPS in production** - Never expose authentication endpoints over HTTP
2. **Use strong JWT secrets** - Minimum 32 characters, preferably longer
3. **Keep certificates updated** - Set up automatic renewal for Let's Encrypt
4. **Monitor SSL expiration** - Set up alerts before certificates expire
5. **Use a reverse proxy** - Nginx provides additional security and performance benefits
6. **Enable HSTS** - Already configured in nginx.conf for enhanced security
7. **Regular security updates** - Keep Docker images and dependencies updated

## Alternative Deployment Options

If you prefer not to use Docker:

### Vercel (Recommended for Next.js)
Vercel provides automatic HTTPS and SSL certificates:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Traditional Server with Nginx

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the application:
   ```bash
   npm start
   ```

3. Configure Nginx as shown in `nginx/nginx.conf`

4. Set up SSL certificates as described above

## Support

For issues specific to HTTPS setup:
- Check Docker logs: `docker-compose logs`
- Check Nginx error logs: `docker exec nginx cat /var/log/nginx/error.log`
- Verify certificate files exist and have correct permissions
- Ensure firewall allows traffic on ports 80 and 443
