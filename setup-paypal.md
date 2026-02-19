# 🧪 PayPal Sandbox Setup Guide



## 📋 **What You Need:**

### 1. PayPal Sandbox Account
1. Go to [https://developer.paypal.com](https://developer.paypal.com)
2. Log in or create a PayPal Developer account
3. Go to Dashboard → Apps & Credentials → Create App
4. Create a new app or use existing one

### 2. Get Sandbox Credentials
From your PayPal app, you need:
- **Client ID** (Public identifier)
- **Client Secret** (Private key)

### 3. Configure Environment

## 🔧 **Setup Steps:**

### Step 1: Create `.env` file
```bash
# Copy the example file
cp .env.example .env
```

### Step 2: Add Your PayPal Credentials
Edit `.env` file and replace these lines:
```env
# PayPal Sandbox Configuration
PAYPAL_CLIENT_ID=YOUR_ACTUAL_SANDBOX_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_ACTUAL_SANDBOX_CLIENT_SECRET
PAYPAL_MODE=sandbox
```

### Step 3: Update Frontend Client ID
In `client/checkout.html`, update line 12:
```html
<!-- Replace YOUR_PAYPAL_CLIENT_ID with your actual client ID -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_ACTUAL_SANDBOX_CLIENT_ID&currency=USD&disable-funding=credit,card"></script>
```

### Step 4: Restart Server
```bash
npm start
```

## 🧪 **Test Your Setup**

### 1. Verify Configuration
```bash
curl http://localhost:3000/api/paypal/config
```
Should return:
```json
{
  "clientId": "YOUR_ACTUAL_SANDBOX_CLIENT_ID",
  "mode": "sandbox",
  "currency": "USD"
}
```

### 2. Test Payment Flow
1. Go to `http://localhost:3000/checkout`
2. Add items to cart
3. Complete checkout
4. Should redirect to PayPal Sandbox with USD currency

## 🌐 **PayPal Sandbox URLs**
- **Login**: https://www.sandbox.paypal.com
- **Test Account**: Use your sandbox buyer account
- **Developer Dashboard**: https://developer.paypal.com

## ✅ **Expected Result**
- PayPal Sandbox shows USD currency (not INR)
- Payment completes successfully
- Order created in database
- Redirect to payment success page

## 🔍 **Troubleshooting**

### If you see "seller doesn't accept INR":
- ✅ **Fixed**: Our code now forces USD everywhere
- ✅ **Solution**: Set up your PayPal credentials correctly

### If PayPal button doesn't appear:
1. Check browser console for errors
2. Verify client ID is set correctly
3. Ensure PayPal SDK loads without errors

## 🚀 **After Setup**
Your EcoStyle application will:
- ✅ Force all payments in USD
- ✅ Handle PayPal Sandbox correctly
- ✅ Create orders properly
- ✅ Support refunds in USD

---

**📞 Need Help?**
1. Get PayPal Sandbox credentials from developer.paypal.com
2. Update `.env` file with your credentials
3. Update checkout.html with your client ID
4. Restart server and test checkout flow

**Your PayPal USD integration is ready - just add your credentials!** 🌿
