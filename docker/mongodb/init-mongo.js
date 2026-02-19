// MongoDB initialization script for EcoStyle
// This script runs when the MongoDB container first starts

// Switch to the ecostyle database
db = db.getSiblingDB('ecostyle');

// Create collections with validation
db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'description', 'price', 'category', 'imageUrl', 'stockQty'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Product name is required and must be a string'
        },
        description: {
          bsonType: 'string',
          description: 'Product description is required and must be a string'
        },
        price: {
          bsonType: 'number',
          minimum: 0,
          description: 'Product price must be a positive number'
        },
        category: {
          bsonType: 'string',
          enum: ['t-shirts', 'hoodies', 'shoes', 'accessories'],
          description: 'Product category must be one of the specified values'
        },
        imageUrl: {
          bsonType: 'string',
          description: 'Product image URL is required and must be a string'
        },
        stockQty: {
          bsonType: 'number',
          minimum: 0,
          description: 'Stock quantity must be a non-negative number'
        },
        ecoTags: {
          bsonType: 'array',
          items: {
            bsonType: 'string',
            enum: ['organic-cotton', 'recycled-materials', 'biodegradable', 'handmade', 'ethical-manufacturing', 'carbon-neutral', 'water-conservation', 'fair-trade']
          }
        },
        featured: {
          bsonType: 'bool',
          description: 'Featured flag must be a boolean'
        },
        sustainabilityScore: {
          bsonType: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Sustainability score must be between 0 and 100'
        }
      }
    }
  }
});

db.createCollection('orders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['orderNumber', 'items', 'totalAmount', 'paymentProvider', 'paymentStatus'],
      properties: {
        orderNumber: {
          bsonType: 'string',
          description: 'Order number is required and must be a string'
        },
        items: {
          bsonType: 'array',
          description: 'Order items are required and must be an array'
        },
        totalAmount: {
          bsonType: 'number',
          minimum: 0,
          description: 'Total amount must be a positive number'
        },
        paymentProvider: {
          bsonType: 'string',
          enum: ['paypal'],
          description: 'Payment provider must be paypal'
        },
        paymentStatus: {
          bsonType: 'string',
          enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
          description: 'Payment status must be one of the specified values'
        },
        orderStatus: {
          bsonType: 'string',
          enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
          description: 'Order status must be one of the specified values'
        }
      }
    }
  }
});

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'firstName', 'lastName'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        },
        firstName: {
          bsonType: 'string',
          description: 'First name is required and must be a string'
        },
        lastName: {
          bsonType: 'string',
          description: 'Last name is required and must be a string'
        }
      }
    }
  }
});

// Create indexes for better performance
db.products.createIndex({ name: 'text', description: 'text' });
db.products.createIndex({ category: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ ecoTags: 1 });
db.products.createIndex({ featured: 1 });
db.products.createIndex({ stockQty: 1 });

db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ buyerEmail: 1 });
db.orders.createIndex({ paymentStatus: 1 });
db.orders.createIndex({ createdAt: -1 });
db.orders.createIndex({ paypalOrderId: 1 });

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ isActive: 1 });

// Create a default admin user (optional)
db.users.insertOne({
  email: 'admin@ecostyle.com',
  firstName: 'Admin',
  lastName: 'User',
  isActive: true,
  preferences: {
    newsletter: true,
    ecoUpdates: true,
    promotions: false
  },
  loyaltyPoints: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('MongoDB initialization completed successfully!');
print('Collections created: products, orders, users');
print('Indexes created for optimal performance');
print('Default admin user created: admin@ecostyle.com');
