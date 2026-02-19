// PayPal Setup Helper
const fs = require('fs');
const path = require('path');

console.log('🧪 EcoStyle PayPal Setup Helper\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
    console.log('📁 Creating .env file from .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
} else {
    console.log('✅ .env file already exists');
}

// Read current .env content
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if PayPal credentials are set
const hasClientId = envContent.includes('PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id_here') === false;
const hasClientSecret = envContent.includes('PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret_here') === false;

console.log('\n🔍 PayPal Configuration Status:');
console.log(`Client ID: ${hasClientId ? '✅ SET' : '❌ NOT SET'}`);
console.log(`Client Secret: ${hasClientSecret ? '✅ SET' : '❌ NOT SET'}`);

if (!hasClientId || !hasClientSecret) {
    console.log('\n📋 Next Steps:');
    console.log('1. Go to https://developer.paypal.com');
    console.log('2. Create/get your Sandbox App');
    console.log('3. Copy your Client ID and Secret');
    console.log('4. Update .env file with your credentials');
    console.log('5. Update client/checkout.html with your Client ID');
    console.log('6. Restart server: npm start');
} else {
    console.log('\n🎉 PayPal credentials are configured!');
    console.log('🚀 Ready to test checkout flow');
}

// Check checkout.html for PayPal client ID
const checkoutPath = path.join(__dirname, 'client', 'checkout.html');
if (fs.existsSync(checkoutPath)) {
    const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
    const hasPayPalClientId = checkoutContent.includes('client-id=YOUR_PAYPAL_CLIENT_ID') === false;
    
    console.log('\n🔍 Frontend PayPal Status:');
    console.log(`Checkout.html Client ID: ${hasPayPalClientId ? '✅ SET' : '❌ NOT SET'}`);
    
    if (!hasPayPalClientId) {
        console.log('⚠️  Update client/checkout.html line 12 with your actual PayPal Client ID');
    }
}

console.log('\n📖 For detailed setup instructions, see: setup-paypal.md');
