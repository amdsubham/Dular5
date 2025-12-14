/**
 * CCAvenue Payment Gateway Backend
 *
 * This server handles encryption/decryption of payment data
 * for CCAvenue integration.
 */

const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Your CCAvenue credentials
const WORKING_KEY = 'E6FF0434306EFA9066D8BFB4C55C8F81';
const ACCESS_CODE = 'AVNF94KH56AC67FNCA';
const MERCHANT_ID = '2718018';

console.log('🔐 CCAvenue Backend Server');
console.log('==========================');
console.log(`Merchant ID: ${MERCHANT_ID}`);
console.log(`Access Code: ${ACCESS_CODE}`);
console.log('');

// Encryption function (CCAvenue spec)
function encrypt(plainText, workingKey) {
  const m = crypto.createHash('md5');
  m.update(workingKey);
  const key = m.digest();
  const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  let encoded = cipher.update(plainText, 'utf8', 'hex');
  encoded += cipher.final('hex');
  return encoded;
}

// Decryption function (CCAvenue spec)
function decrypt(encText, workingKey) {
  const m = crypto.createHash('md5');
  m.update(workingKey);
  const key = m.digest();
  const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  let decoded = decipher.update(encText, 'hex', 'utf8');
  decoded += decipher.final('utf8');
  return decoded;
}

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'CCAvenue Backend Server',
    merchant: MERCHANT_ID,
  });
});

// Encrypt payment request
app.post('/api/payment/encrypt', (req, res) => {
  try {
    console.log('📥 Encryption request received');
    const { orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({
        success: false,
        error: 'Order data is required'
      });
    }

    // Create query string with proper URL encoding
    const queryString = Object.keys(orderData)
      .map(key => `${key}=${encodeURIComponent(orderData[key])}`)
      .join('&');

    console.log('📝 Query string:', queryString.substring(0, 100) + '...');
    console.log('📝 Full query string:', queryString);

    // Encrypt
    const encRequest = encrypt(queryString, WORKING_KEY);

    console.log('✅ Encryption successful');
    console.log('🔒 Encrypted length:', encRequest.length);

    res.json({
      success: true,
      encRequest,
      accessCode: ACCESS_CODE,
      merchantId: MERCHANT_ID
    });
  } catch (error) {
    console.error('❌ Encryption error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Decrypt payment response
app.post('/api/payment/decrypt', (req, res) => {
  try {
    console.log('📥 Decryption request received');
    const { encResponse } = req.body;

    if (!encResponse) {
      return res.status(400).json({
        success: false,
        error: 'Encrypted response is required'
      });
    }

    const decrypted = decrypt(encResponse, WORKING_KEY);
    console.log('✅ Decryption successful');

    // Parse response
    const params = {};
    decrypted.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });

    console.log('📊 Parsed params:', Object.keys(params));

    res.json({
      success: true,
      data: params
    });
  } catch (error) {
    console.error('❌ Decryption error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Payment response handler (redirect from CCAvenue)
app.post('/api/payment/response', (req, res) => {
  try {
    console.log('📥 Payment response received');
    const { encResp } = req.body;

    if (!encResp) {
      return res.status(400).send('Encrypted response missing');
    }

    const decrypted = decrypt(encResp, WORKING_KEY);

    // Parse response
    const params = {};
    decrypted.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });

    console.log('✅ Payment Status:', params.order_status);
    console.log('📋 Order ID:', params.order_id);

    const status = params.order_status || 'Unknown';
    const orderId = params.order_id || '';
    const trackingId = params.tracking_id || '';

    // Redirect to app (deep link)
    res.send(`
      <html>
        <head>
          <title>Payment ${status}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: ${status === 'Success' ? '#4CAF50' : '#f44336'};
              margin-bottom: 20px;
            }
            .info {
              text-align: left;
              background: #f9f9f9;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .info p {
              margin: 8px 0;
              font-size: 14px;
            }
            .btn {
              background: #667eea;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin-top: 20px;
              text-decoration: none;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${status === 'Success' ? '✅ Payment Successful!' : '❌ Payment Failed'}</h1>
            <div class="info">
              <p><strong>Status:</strong> ${status}</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
              ${trackingId ? `<p><strong>Tracking ID:</strong> ${trackingId}</p>` : ''}
            </div>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              You can close this window and return to the app.
            </p>
            <a href="dular://payment/result?status=${status}&orderId=${orderId}${trackingId ? '&trackingId=' + trackingId : ''}" class="btn">Back to App</a>
            <button onclick="window.close()" class="btn" style="margin-left: 10px; background: #999;">Close</button>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ Response handler error:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1 style="color: #f44336;">Error Processing Payment Response</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('📡 Available endpoints:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   POST http://localhost:${PORT}/api/payment/encrypt`);
  console.log(`   POST http://localhost:${PORT}/api/payment/decrypt`);
  console.log(`   POST http://localhost:${PORT}/api/payment/response`);
  console.log('');
  console.log('✅ Ready to handle CCAvenue payments!');
});
