const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const ReservedAccount = require('./models/ReservedAccount');

const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Monnify API credentials from .env
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;
const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com'; // Use `https://api.monnify.com` for production

const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
  'https://dashmeafrica-frontend.vercel.app',
  'https://dashmeafrica-frontend.onrender.com',
  'http://localhost:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy error: ${origin} is not allowed.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Database connection error:', err));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Base API Endpoint
app.get('/', (req, res) => res.send('API is running...'));

// Admin Routes
app.use('/api/adminDashboard', adminDashboardRoutes);
app.use('/api/adminProduct', adminProductRoutes);
app.use('/api/admin', adminRoutes);

// User Routes
app.use('/api/products', productRoutes);
app.use('/api/userProfile', userProfileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);


// Function to get Monnify Bearer Token
const getMonnifyToken = async () => {
  try {
      const credentials = `${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`;
      const base64Credentials = Buffer.from(credentials).toString('base64');

      const response = await axios.post(
          `${MONNIFY_BASE_URL}/api/v1/auth/login`,
          {},
          {
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Basic ${base64Credentials}`,
              },
          }
      );

      return response.data.responseBody.accessToken;
  } catch (error) {
      console.error('Error fetching Monnify token:', error.response?.data || error.message);
      throw new Error('Failed to fetch Monnify token');
  }
};


// app.post('/api/webhook', async (req, res) => {
//   console.log('Webhook received:', req.body);

//   const { transactionReference, paymentStatus } = req.body;

//   // Respond quickly to Monnify
//   res.status(200).send('Webhook received');

//   if (!transactionReference || !paymentStatus) {
//     console.error('Invalid webhook payload:', req.body);
//     return;
//   }

//   // Forward the transactionReference to /verify-payment
//   try {
//     const verificationResponse = await axios.post(
//       'https://dashmeafrica-backend.vercel.app/api/payment/verify-payment', // Replace with your server's domain
//       { transactionReference }
//     );

//     console.log(transactionReference);
//     console.log('Verification Response:', verificationResponse.data);
//   } catch (error) {
//     console.error('Error forwarding to verify-payment:', error.message);
//   }
// });


// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;


// router.post('/monnify-webhook', async (req, res) => {
//   const notificationData = req.body;

//   // Verify the notification signature (optional but recommended)
//   const monnifySignature = req.headers['monnify-signature'];
//   const calculatedSignature = crypto
//     .createHmac('sha512', MONNIFY_SECRET_KEY)
//     .update(JSON.stringify(notificationData))
//     .digest('hex');

//   if (monnifySignature !== calculatedSignature) {
//     return res.status(401).json({ success: false, message: 'Invalid signature' });
//   }

//   try {
//     const { paymentReference, paymentStatus, amountPaid } = notificationData;

//     if (paymentStatus === 'PAID') {
//       // Update the transaction status in your database
//       await Transaction.updateOne(
//         { paymentReference },
//         { $set: { status: 'PAID', amountPaid } }
//       );

//       // Disburse funds to the seller (if applicable)
//       const sellerAccount = await findSellerAccount(paymentReference);
//       if (sellerAccount) {
//         await disburseFunds(amountPaid, sellerAccount);
//       }

//       return res.status(200).json({ success: true, message: 'Payment verified' });
//     }

//     res.status(200).json({ success: true, message: 'Payment status recorded' });
//   } catch (error) {
//     console.error('Error handling webhook:', error.message);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// Function to get Monnify Bearer Token
// const getMonnifyToken = async () => {
//   try {
//     // Construct the Base64-encoded apiKey:secretKey string
//     const credentials = `${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`;
//     const base64Credentials = Buffer.from(credentials).toString('base64');

//     // Make the POST request to Monnify's login endpoint
//     const response = await axios.post(
//       `${MONNIFY_BASE_URL}/api/v1/auth/login`,
//       {}, // No body is required for this request
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Basic ${base64Credentials}`,
//         },
//       }
//     );

//     return response.data.responseBody.accessToken;
//   } catch (error) {
//     console.error(
//       'Error fetching Monnify token:',
//       error.response?.data || error.message
//     );
//     throw new Error('Failed to fetch Monnify token');
//   }
// };




// Webhook Endpoint
// app.post('/api/webhook', async (req, res) => {
//   const { transactionReference, paymentReference, amountPaid, paymentStatus } = req.body;

//   try {
//     if (paymentStatus === 'PAID') {
//       const reservedAccount = await ReservedAccount.findOne({ accountReference: paymentReference });

//       if (reservedAccount) {
//         // Update transaction details
//         reservedAccount.balance = (reservedAccount.balance || 0) + amountPaid;
//         reservedAccount.lastTransaction = {
//           transactionReference,
//           amountPaid,
//           paymentStatus,
//           updatedAt: new Date(),
//         };
//         await reservedAccount.save();

//         console.log('Transaction processed and database updated.');
//         return res.status(200).json({ success: true, message: 'Payment processed successfully.' });
//       }
//     }

//     console.log('Payment status not valid or account not found.');
//     res.status(400).json({ success: false, message: 'Payment verification failed.' });
//   } catch (error) {
//     console.error('Webhook processing error:', error.message);
//     res.status(500).json({ success: false, message: 'Internal server error.' });
//   }
// });

// API to Fetch Account and Transaction Details
// app.get('/api/account/:accountReference', async (req, res) => {
//   const { accountReference } = req.params;

//   try {
//     const account = await ReservedAccount.findOne({ accountReference });

//     if (!account) {
//       return res.status(404).json({ success: false, message: 'Account not found.' });
//     }

//     res.status(200).json({ success: true, data: account });
//   } catch (error) {
//     console.error('Error fetching account details:', error.message);
//     res.status(500).json({ success: false, message: 'Internal server error.' });
//   }
// });

// Endpoint to Disburse Funds (Payout)
// app.post('/api/disburse', async (req, res) => {
//   const { accountReference, amount } = req.body;

//   if (!accountReference || !amount) {
//     return res.status(400).json({ success: false, message: 'Account reference and amount are required' });
//   }

//   try {
//     const token = await getMonnifyToken();
//     const payoutData = {
//       amount,
//       accountReference,
//       currencyCode: 'NGN',
//       contractCode: MONNIFY_CONTRACT_CODE,
//     };

//     const response = await axios.post(
//       `${MONNIFY_BASE_URL}/api/v1/disbursements`,
//       payoutData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     if (response.data.responseCode === '00') {
//       return res.status(200).json({
//         success: true,
//         message: 'Disbursement initiated successfully',
//         transactionReference: response.data.responseBody.transactionReference,
//       });
//     } else {
//       return res.status(500).json({
//         success: false,
//         message: 'Disbursement initiation failed',
//       });
//     }
//   } catch (error) {
//     console.error('Error during payout initiation:', error.response?.data || error.message);
//     res.status(500).json({ success: false, message: 'An error occurred during payout initiation' });
//   }
// });


// app.get('/api/verify-transaction/:transactionReference', async (req, res) => {
//   const { transactionReference } = req.params;

//   try {
//     const token = await getMonnifyToken();
//     const response = await axios.get(
//       `${MONNIFY_BASE_URL}/api/v2/transactions/${transactionReference}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     const transactionDetails = response.data.responseBody;

//     if (transactionDetails.paymentStatus === 'PAID') {
//       const reservedAccount = await ReservedAccount.findOne({
//         accountReference: transactionDetails.paymentReference,
//       });

//       if (reservedAccount) {
//         // Log the transaction
//         if (!reservedAccount.transactions) {
//           reservedAccount.transactions = [];
//         }

//         reservedAccount.transactions.push({
//           transactionReference: transactionDetails.transactionReference,
//           amountPaid: transactionDetails.amountPaid,
//           paymentStatus: transactionDetails.paymentStatus,
//           timestamp: new Date(),
//         });

//         // Update user balance
//         reservedAccount.balance = (reservedAccount.balance || 0) + transactionDetails.amountPaid;

//         // Save the updated reserved account
//         await reservedAccount.save();

//         return res.status(200).json({ success: true, data: transactionDetails });
//       }

//       return res.status(404).json({ success: false, message: 'Reserved account not found.' });
//     }

//     res.status(400).json({ success: false, message: 'Payment not verified.' });
//   } catch (error) {
//     console.error('Error verifying transaction:', error.response?.data || error.message);
//     res.status(500).json({ success: false, message: 'An error occurred during transaction verification.' });
//   }
// });



