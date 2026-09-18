// server/config/ssl/generateCert.js
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const SSL_DIR = path.join(__dirname);
const CERT_FILE = path.join(SSL_DIR, 'cert.pem');
const KEY_FILE = path.join(SSL_DIR, 'key.pem');

const getOrGenerateCertificates = async () => {
  if (fs.existsSync(CERT_FILE) && fs.existsSync(KEY_FILE)) {
    return {
      cert: fs.readFileSync(CERT_FILE, 'utf8'),
      key: fs.readFileSync(KEY_FILE, 'utf8'),
    };
  }

  console.log('🔒 Generating local SSL/TLS certificate for HTTPS development...');
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = await selfsigned.generate(attrs, { days: 365 });

  fs.writeFileSync(CERT_FILE, pems.cert, 'utf8');
  fs.writeFileSync(KEY_FILE, pems.private, 'utf8');
  console.log('✅ Local development SSL certificates generated in server/config/ssl/');

  return {
    cert: pems.cert,
    key: pems.private,
  };
};

if (require.main === module) {
  getOrGenerateCertificates().then(() => {
    console.log('SSL certs generated successfully.');
  });
}

module.exports = { getOrGenerateCertificates, CERT_FILE, KEY_FILE };
