const fs = require('fs');
const https = require('https');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.HTTPS_PORT || 3443;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Check if SSL certificates exist
const keyPath = './ssl/localhost-key.pem';
const certPath = './ssl/localhost.pem';

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('❌ SSL certificates not found!');
  console.error('Please run: ./scripts/setup-dev-https.sh');
  console.error('Or manually generate certificates using mkcert.');
  process.exit(1);
}

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
  https.createServer(options, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`\n🔒 HTTPS Server ready at https://${hostname}:${port}`);
      console.log(`📝 Using SSL certificates from: ${keyPath}\n`);
    });
});
