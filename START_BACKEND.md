# Start CCAvenue Backend Server

## Quick Setup (30 seconds)

Open a **new terminal** and run these commands:

```bash
cd /Users/subhamroutray/Downloads/Dular5.0

# Install express and cors (one-time only)
npm install express cors body-parser

# Start the backend server
node ccavenue-server.js
```

You should see:
```
🔐 CCAvenue Backend Server
==========================
Merchant ID: 2718018
Access Code: AVNF94KH56AC67FNCA

🚀 Server running on http://localhost:3002
📡 Available endpoints:
   GET  http://localhost:3002/
   POST http://localhost:3002/api/payment/encrypt
   POST http://localhost:3002/api/payment/decrypt
   POST http://localhost:3002/api/payment/response

✅ Ready to handle CCAvenue payments!
```

## That's It!

Once the backend is running:
1. Go back to your mobile app
2. Click on a subscription plan
3. Click "Pay" button
4. The payment will now work with proper encryption!

The backend server encrypts your payment data securely using CCAvenue's Working Key.
