const mongoose = require('mongoose');
const Product = require('./server/models/Product');
require('dotenv').config();

async function checkProduct() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecostyle', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find the product by name
    const product = await Product.findOne({ 
      name: { $regex: 'njnj', $options: 'i' } 
    });
    
    if (product) {
      console.log('🌱 Found product:');
      console.log('================');
      console.log(`Name: ${product.name}`);
      console.log(`Category: ${product.category}`);
      console.log(`Price: $${product.price}`);
      console.log(`Stock: ${product.stockQty}`);
      console.log(`Eco Tags: ${product.ecoTags.join(', ')}`);
      console.log(`Image URL: ${product.imageUrl}`);
      console.log(`Product ID: ${product._id}`);
      console.log(`Featured: ${product.featured}`);
      console.log('================');
    } else {
      console.log('❌ Product not found');
    }

    // Get all products to check count
    const allProducts = await Product.find({});
    console.log(`\n📊 Total products in database: ${allProducts.length}`);
    
    // List all product names
    console.log('\n📝 All product names:');
    allProducts.forEach((p, index) => {
      console.log(`${index + 1}. ${p.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking product:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
checkProduct();
