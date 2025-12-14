# CCAvenue Backend Integration Required

## 🚨 Current Issue

CCAvenue requires **server-side encryption** of payment data using AES-256-CBC with your Working Key. This cannot be done securely in React Native (client-side) because:

1. The Working Key must remain secret
2. Client-side encryption can be reverse-engineered
3. CCAvenue's API requires proper encryption/decryption

## ✅ Solution: Add Backend

You need a backend server (Node.js/Express) to:
1. Encrypt payment request using Working Key
2. Decrypt payment response from CCAvenue
3. Verify payment authenticity

## 🔧 Quick Backend Setup (Option 1: Node.js/Express)

### Step 1: Create Backend Directory

```bash
mkdir ccavenue-backend
cd ccavenue-backend
npm init -y
npm install express cors crypto body-parser
```

### Step 2: Create Server (`server.js`)

```javascript
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

// Encryption function
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

// Decryption function
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

// Encrypt payment request
app.post('/api/payment/encrypt', (req, res) => {
  try {
    const { orderData } = req.body;

    // Create query string
    const queryString = Object.keys(orderData)
      .map(key => `${key}=${encodeURIComponent(orderData[key])}`)
      .join('&');

    // Encrypt
    const encRequest = encrypt(queryString, WORKING_KEY);

    res.json({
      success: true,
      encRequest,
      accessCode: ACCESS_CODE,
      merchantId: MERCHANT_ID
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Decrypt payment response
app.post('/api/payment/decrypt', (req, res) => {
  try {
    const { encResponse } = req.body;
    const decrypted = decrypt(encResponse, WORKING_KEY);

    // Parse response
    const params = {};
    decrypted.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[key] = decodeURIComponent(value);
    });

    res.json({
      success: true,
      data: params
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Redirect/Response handler
app.post('/api/payment/response', (req, res) => {
  try {
    const { encResp } = req.body;
    const decrypted = decrypt(encResp, WORKING_KEY);

    // Parse and handle response
    const params = {};
    decrypted.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[key] = decodeURIComponent(value);
    });

    // Redirect to app with payment status
    const status = params.order_status;
    const orderId = params.order_id;
    const trackingId = params.tracking_id;

    res.redirect(`myapp://payment?status=${status}&orderId=${orderId}&trackingId=${trackingId}`);
  } catch (error) {
    res.redirect(`myapp://payment?status=Error&error=${error.message}`);
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 CCAvenue Backend running on http://localhost:${PORT}`);
});
```

### Step 3: Start Backend

```bash
node server.js
```

## 📱 Update Mobile App

### Update `services/payment.ts`

Add encryption endpoint call:

```typescript
export const getEncryptedPaymentRequest = async (
  orderData: any
): Promise<{ encRequest: string; accessCode: string } | null> => {
  try {
    const response = await fetch('http://localhost:3002/api/payment/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderData }),
    });

    const data = await response.json();
    return data.success ? data : null;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};
```

### Update Payment Modal

```typescript
// In handlePayment function
const paymentConfig = await getCCAvenuePaymentConfig(result.orderId, plan);

// Get encrypted request
const encrypted = await getEncryptedPaymentRequest({
  merchant_id: paymentConfig.merchantId,
  order_id: paymentConfig.orderId,
  currency: paymentConfig.currency,
  amount: paymentConfig.amount,
  redirect_url: paymentConfig.redirectUrl,
  cancel_url: paymentConfig.cancelUrl,
  billing_name: paymentConfig.billingName,
  billing_email: paymentConfig.billingEmail,
  delivery_name: paymentConfig.billingName,
  delivery_email: paymentConfig.billingEmail,
});

if (!encrypted) {
  throw new Error('Failed to encrypt payment request');
}

// Pass encrypted.encRequest to HTML generation
```

## 🌐 Option 2: Use Firebase Cloud Functions

Create a Cloud Function for encryption:

```javascript
const functions = require('firebase-functions');
const crypto = require('crypto');

exports.encryptCCAvenue = functions.https.onCall((data, context) => {
  const WORKING_KEY = 'E6FF0434306EFA9066D8BFB4C55C8F81';

  function encrypt(plainText) {
    const m = crypto.createHash('md5');
    m.update(WORKING_KEY);
    const key = m.digest();
    const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encoded = cipher.update(plainText, 'utf8', 'hex');
    encoded += cipher.final('hex');
    return encoded;
  }

  const queryString = Object.keys(data.orderData)
    .map(key => `${key}=${encodeURIComponent(data.orderData[key])}`)
    .join('&');

  return {
    encRequest: encrypt(queryString),
    accessCode: 'AVNF94KH56AC67FNCA',
  };
});
```

## 🎯 Temporary Workaround (Testing Only)

For immediate testing, you can:

1. **Use CCAvenue Test Mode**
   - Test URL: `https://test.ccavenue.com`
   - May allow less strict encryption (check docs)

2. **Contact CCAvenue Support**
   - Ask about iframe/SDK integration
   - Request developer sandbox access

3. **Use Demo Credentials**
   - CCAvenue provides demo merchant accounts
   - These might have relaxed encryption rules

## 📚 CCAvenue Documentation

- Integration Kit: https://www.ccavenue.com/integration_kit.jsp
- Developer Docs: Check your merchant dashboard
- Support: support@ccavenue.com

## ✅ Recommended Approach

**Best Solution**: Create a simple Node.js backend (as shown above)

**Why**:
- Secure encryption/decryption
- Proper payment verification
- Can add webhook handling
- Better error handling
- Production-ready

**Time Required**: 30-60 minutes to set up

## 🚀 Next Steps

1. Create backend server with encryption
2. Deploy backend (Heroku, Railway, or Firebase Functions)
3. Update mobile app to call backend
4. Test complete payment flow
5. Add webhook handling for payment confirmation

Without a backend, CCAvenue payments cannot work securely in production!
