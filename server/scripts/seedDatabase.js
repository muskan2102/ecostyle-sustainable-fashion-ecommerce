const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// Seed data for sustainable fashion products
const seedProducts = [
  // Organic Cotton T-Shirts
  {
    name: "Classic Organic Cotton T-Shirt",
    description: "A timeless essential made from 100% GOTS certified organic cotton. Soft, breathable, and perfect for everyday wear. Each purchase supports sustainable farming practices.",
    price: 29.99,
    category: "t-shirts",
    ecoTags: ["organic-cotton", "fair-trade", "water-conservation"],
    imageUrl: "https://picsum.photos/seed/organic-tshirt-classic/400/400.jpg",
    stockQty: 50,
    featured: true,
    sustainabilityScore: 85
  },
  {
    name: "Recycled Cotton Graphic Tee",
    description: "Made from 50% recycled cotton and 50% organic cotton. Features eco-friendly water-based ink printing. Comfortable fit with a positive environmental message.",
    price: 34.99,
    category: "t-shirts",
    ecoTags: ["recycled-materials", "organic-cotton", "water-conservation"],
    imageUrl: "https://picsum.photos/seed/recycled-graphic-tee/400/400.jpg",
    stockQty: 35,
    featured: false,
    sustainabilityScore: 90
  },
  {
    name: "Hemp Blend T-Shirt",
    description: "Innovative blend of hemp and organic cotton creates a durable, breathable fabric that gets softer with each wash. Naturally antimicrobial and requires less water to produce.",
    price: 39.99,
    category: "t-shirts",
    ecoTags: ["organic-cotton", "water-conservation", "biodegradable"],
    imageUrl: "https://picsum.photos/seed/hemp-blend-tee/400/400.jpg",
    stockQty: 25,
    featured: true,
    sustainabilityScore: 92
  },

  // Recycled Hoodies
  {
    name: "Recycled Fleece Hoodie",
    description: "Cozy hoodie made from 100% recycled polyester fleece. Warm, comfortable, and diverts plastic bottles from landfills. Features a relaxed fit and kangaroo pocket.",
    price: 69.99,
    category: "hoodies",
    ecoTags: ["recycled-materials", "water-conservation"],
    imageUrl: "https://picsum.photos/seed/recycled-fleece-hoodie/400/400.jpg",
    stockQty: 30,
    featured: true,
    sustainabilityScore: 88
  },
  {
    name: "Organic Cotton Zip-Up Hoodie",
    description: "Premium heavyweight organic cotton hoodie with full zip front. Ethically manufactured with fair labor practices. Pre-shrunk for lasting fit.",
    price: 79.99,
    category: "hoodies",
    ecoTags: ["organic-cotton", "fair-trade", "ethical-manufacturing"],
    imageUrl: "https://picsum.photos/seed/organic-cotton-hoodie/400/400.jpg",
    stockQty: 20,
    featured: false,
    sustainabilityScore: 86
  },
  {
    name: "Bamboo Blend Pullover",
    description: "Luxuriously soft hoodie made from bamboo and organic cotton blend. Naturally moisture-wicking and antibacterial. Perfect for active lifestyles.",
    price: 74.99,
    category: "hoodies",
    ecoTags: ["organic-cotton", "biodegradable", "water-conservation"],
    imageUrl: "https://picsum.photos/seed/bamboo-pullover/400/400.jpg",
    stockQty: 15,
    featured: true,
    sustainabilityScore: 91
  },

  // Biodegradable Shoes
  {
    name: "Natural Rubber Sneakers",
    description: "Stylish sneakers made from natural rubber and organic canvas. Fully biodegradable and compostable at end of life. Comfortable for all-day wear.",
    price: 89.99,
    category: "shoes",
    ecoTags: ["biodegradable", "water-conservation"],
    imageUrl: "https://picsum.photos/seed/natural-rubber-sneakers/400/400.jpg",
    stockQty: 25,
    featured: true,
    sustainabilityScore: 94
  },
  {
    name: "Cork Sandals",
    description: "Elegant sandals featuring cork footbed and natural rubber soles. Cork is harvested sustainably without harming trees. Lightweight and supportive.",
    price: 59.99,
    category: "shoes",
    ecoTags: ["biodegradable", "water-conservation"],
    imageUrl: "https://picsum.photos/seed/cork-sandals/400/400.jpg",
    stockQty: 40,
    featured: false,
    sustainabilityScore: 96
  },
  {
    name: "Hemp Canvas Shoes",
    description: "Durable shoes made from hemp canvas with natural rubber soles. Hemp requires minimal water and no pesticides to grow. Built to last.",
    price: 84.99,
    category: "shoes",
    ecoTags: ["biodegradable", "water-conservation", "organic-cotton"],
    imageUrl: "https://picsum.photos/seed/hemp-canvas-shoes/400/400.jpg",
    stockQty: 18,
    featured: true,
    sustainabilityScore: 93
  },

  // Handmade Accessories
  {
    name: "Handwoven Organic Scarf",
    description: "Beautiful scarf handwoven by artisans using organic cotton and natural dyes. Each piece is unique and supports traditional crafting communities.",
    price: 44.99,
    category: "accessories",
    ecoTags: ["handmade", "organic-cotton", "fair-trade"],
    imageUrl: "https://picsum.photos/seed/handwoven-organic-scarf/400/400.jpg",
    stockQty: 12,
    featured: true,
    sustainabilityScore: 95
  },
  {
    name: "Recycled Leather Belt",
    description: "Stylish belt made from recycled leather scraps. Reduces waste while creating a durable accessory. Features a recycled metal buckle.",
    price: 54.99,
    category: "accessories",
    ecoTags: ["recycled-materials", "handmade"],
    imageUrl: "https://picsum.photos/seed/recycled-leather-belt/400/400.jpg",
    stockQty: 22,
    featured: false,
    sustainabilityScore: 87
  },
  {
    name: "Bamboo Sunglasses",
    description: "Sustainable sunglasses made from laminated bamboo. Polarized lenses with UV protection. Lightweight and unique grain patterns.",
    price: 64.99,
    category: "accessories",
    ecoTags: ["biodegradable", "water-conservation"],
    imageUrl: "https://picsum.photos/seed/bamboo-sunglasses/400/400.jpg",
    stockQty: 30,
    featured: true,
    sustainabilityScore: 89
  },
  {
    name: "Organic Cotton Tote Bag",
    description: "Spacious tote bag made from heavy-duty organic cotton. Perfect for shopping or daily use. Machine washable and built to last for years.",
    price: 24.99,
    category: "accessories",
    ecoTags: ["organic-cotton", "fair-trade"],
    imageUrl: "https://picsum.photos/seed/organic-tote-bag/400/400.jpg",
    stockQty: 60,
    featured: false,
    sustainabilityScore: 92
  },
  {
    name: "Recycled Ocean Plastic Watch",
    description: "Modern watch with strap made from recycled ocean plastic. Each purchase removes 1kg of plastic from oceans. Solar-powered movement.",
    price: 149.99,
    category: "accessories",
    ecoTags: ["recycled-materials", "carbon-neutral"],
    imageUrl: "https://picsum.photos/seed/ocean-plastic-watch/400/400.jpg",
    stockQty: 8,
    featured: true,
    sustainabilityScore: 98
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecostyle', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing products');

    // Insert seed products
    const insertedProducts = await Product.insertMany(seedProducts);
    console.log(`🌱 Successfully seeded ${insertedProducts.length} products`);

    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log('==================');
    
    const categories = {};
    insertedProducts.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });

    Object.entries(categories).forEach(([category, count]) => {
      console.log(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${count} products`);
    });

    const featuredCount = insertedProducts.filter(p => p.featured).length;
    console.log(`\nFeatured Products: ${featuredCount}`);
    console.log(`Total Products: ${insertedProducts.length}`);

    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
