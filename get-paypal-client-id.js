// Get PayPal Client ID from server config
async function getPayPalClientId() {
    try {
        const response = await fetch('http://localhost:3000/api/paypal/config');
        const config = await response.json();
        
        console.log('🔑 Your PayPal Client ID:');
        console.log(config.clientId);
        console.log('\n📝 Update client/checkout.html line 12:');
        console.log(`Replace "YOUR_PAYPAL_CLIENT_ID" with "${config.clientId}"`);
        
        return config.clientId;
    } catch (error) {
        console.error('❌ Error getting PayPal config:', error.message);
        console.log('💡 Make sure server is running on http://localhost:3000');
    }
}

getPayPalClientId();
