# EcoStyle - Sustainable Fashion E-commerce Platform

A complete sustainable fashion e-commerce web application built with Node.js, Express, MongoDB, and PayPal integration. EcoStyle sells environmentally conscious, ethically manufactured, and affordable fashion items including organic cotton t-shirts, recycled hoodies, biodegradable shoes, and handmade accessories.

## 🌿 Features

- **Product Management**: Browse, search, and filter sustainable fashion products
- **Shopping Cart**: Add items to cart and manage quantities
- **PayPal Integration**: Secure sandbox payment processing
- **Order History**: View past purchases and order details
- **Admin Product Creation**: Add new products to the catalog
- **Responsive Design**: Mobile-friendly interface
- **Search Functionality**: Client-side and server-side product search
- **Eco-Friendly Focus**: Products tagged with sustainability features

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **PayPal REST SDK** - Payment processing
- **Helmet** - Security middleware
- **Express Rate Limit** - Rate limiting

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with custom design system
- **JavaScript (Vanilla)** - Client-side functionality
- **Responsive Design** - Mobile-first approach

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **MongoDB Container** - Database service

## 📦 Project Structure

```
ecostyle/
├── client/                 # Frontend files
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   ├── js/
│   │   └── app.js         # Main JavaScript file
│   ├── index.html         # Landing page
│   ├── products.html      # Product listing
│   ├── product-details.html # Product details
│   ├── add-product.html   # Add product form
│   ├── cart.html          # Shopping cart
│   ├── checkout.html      # Checkout page
│   ├── payment-success.html # Payment success
│   ├── payment-cancel.html  # Payment cancellation
│   ├── orders.html        # Order history
│   └── 404.html           # 404 error page
├── server/                # Backend files
│   ├── models/            # Database models
│   │   ├── Product.js     # Product model
│   │   ├── Order.js       # Order model
│   │   └── User.js        # User model
│   ├── routes/            # API routes
│   │   ├── products.js    # Product routes
│   │   ├── orders.js      # Order routes
│   │   └── paypal.js      # PayPal routes
│   ├── scripts/           # Utility scripts
│   │   └── seedDatabase.js # Database seeding
│   └── index.js           # Main server file
├── docker/                # Docker configuration
│   └── mongodb/
│       └── init-mongo.js  # MongoDB initialization
├── Dockerfile             # Main application container
├── Dockerfile.seed-db     # Database seeding container
├── docker-compose.yml     # Multi-container setup
├── dockerignore           # Docker ignore file
├── package.json           # Node.js dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed on your system
- PayPal Sandbox account (for payment testing)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecostyle
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Configure PayPal Sandbox**
   - Create a PayPal Sandbox account at [https://developer.paypal.com/](https://developer.paypal.com/)
   - Create a new application in the PayPal Developer Dashboard
   - Copy your Sandbox Client ID and Client Secret
   - Update the `.env` file with your PayPal credentials:
     ```
     PAYPAL_CLIENT_ID=your_sandbox_client_id
     PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
     ```

4. **Start the application**
   ```bash
   docker-compose up --build
   ```

5. **Seed the database** (in a new terminal)
   ```bash
   docker-compose --profile seed up ecostyle-seed
   ```

6. **Access the application**
   - Open your browser and navigate to: `http://localhost:3000`
   - The application should be running with all 15+ sustainable fashion products

### Docker Commands

```bash
# Start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Seed database
docker-compose --profile seed up ecostyle-seed

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p password123 ecostyle
```

## 🛠 Manual Setup (Without Docker)

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v7.0 or higher)
- npm or yarn

### Setup Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   mongod
   ```

4. **Seed the database**
   ```bash
   npm run seed
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📊 Database Schema

### Products Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String (required),
  price: Number (required, > 0),
  category: String (required, enum: ['t-shirts', 'hoodies', 'shoes', 'accessories']),
  ecoTags: [String] (enum: ['organic-cotton', 'recycled-materials', 'biodegradable', 'handmade', 'ethical-manufacturing', 'carbon-neutral', 'water-conservation', 'fair-trade']),
  imageUrl: String (required),
  stockQty: Number (required, >= 0),
  featured: Boolean (default: false),
  sustainabilityScore: Number (0-100, default: 75),
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  orderNumber: String (unique, auto-generated),
  items: [{
    product: ObjectId (ref: 'Product'),
    name: String,
    price: Number,
    quantity: Number,
    ecoTags: [String]
  }],
  totalAmount: Number (required, > 0),
  buyerEmail: String,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  paymentProvider: String (enum: ['paypal']),
  paymentStatus: String (enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded']),
  paypalOrderId: String,
  paypalPaymentId: String,
  orderStatus: String (enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  createdAt: Date,
  updatedAt: Date
}
```

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  firstName: String (required),
  lastName: String (required),
  phone: String,
  addresses: [{
    type: String (enum: ['home', 'work', 'other']),
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean
  }],
  preferences: {
    newsletter: Boolean,
    ecoUpdates: Boolean,
    promotions: Boolean
  },
  loyaltyPoints: Number (default: 0),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Products
- `GET /api/products` - Get all products with pagination and filtering
- `GET /api/products/:id` - Get single product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/search?name=...` - Search products by name
- `GET /api/products/featured` - Get featured products
- `GET /api/products/categories` - Get available categories and eco tags

### Orders
- `GET /api/orders` - Get all orders with filtering
- `GET /api/orders/:id` - Get single order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `GET /api/orders/order-number/:orderNumber` - Get order by order number
- `PUT /api/orders/:id/payment-status` - Update payment status

### PayPal
- `POST /api/paypal/create-payment` - Create PayPal payment
- `POST /api/paypal/execute-payment` - Execute PayPal payment
- `GET /api/paypal/payment/:paymentId` - Get payment details
- `POST /api/paypal/cancel-payment` - Handle payment cancellation
- `GET /api/paypal/config` - Get PayPal configuration
- `POST /api/paypal/refund/:paymentId` - Process refund

### Health Check
- `GET /api/health` - Application health status

## 🧪 Testing the Application

### PayPal Sandbox Testing

1. **Create PayPal Sandbox Account**
   - Visit [PayPal Developer Dashboard](https://developer.paypal.com/)
   - Create a Sandbox account
   - Generate test buyer and seller accounts

2. **Test Payment Flow**
   - Add products to cart
   - Proceed to checkout
   - Fill in shipping information
   - Click "Proceed to PayPal Payment"
   - Login with Sandbox test credentials
   - Complete the payment
   - Verify order creation in database

3. **Test Payment Cancellation**
   - Start checkout process
   - Cancel payment on PayPal page
   - Verify redirection to cancel page
   - Check order status in database

### Sample Test Data

The database is seeded with 15+ sustainable fashion products across all categories:

**T-Shirts (3 products)**
- Classic Organic Cotton T-Shirt
- Recycled Cotton Graphic Tee  
- Hemp Blend T-Shirt

**Hoodies (3 products)**
- Recycled Fleece Hoodie
- Organic Cotton Zip-Up Hoodie
- Bamboo Blend Pullover

**Shoes (3 products)**
- Natural Rubber Sneakers
- Cork Sandals
- Hemp Canvas Shoes

**Accessories (6 products)**
- Handwoven Organic Scarf
- Recycled Leather Belt
- Bamboo Sunglasses
- Organic Cotton Tote Bag
- Recycled Ocean Plastic Watch

## 🌍 Environment Variables

Create a `.env` file with the following variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/ecostyle

# PayPal Sandbox Configuration
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret_here
PAYPAL_MODE=sandbox

# Session Secret
SESSION_SECRET=your_session_secret_here
```

## 📱 Application Routes

### Frontend Pages
- `/` - Landing page with company info and featured products
- `/products` - Product listing with search and filters
- `/products/:id` - Individual product details page
- `/add-product` - Form to add new products (admin-style)
- `/cart` - Shopping cart management
- `/checkout` - Checkout process with PayPal integration
- `/payment/success` - Payment success confirmation
- `/payment/cancel` - Payment cancellation page
- `/orders` - Order history and management

### API Routes
- `/api/products/*` - Product management endpoints
- `/api/orders/*` - Order management endpoints  
- `/api/paypal/*` - PayPal payment endpoints
- `/api/health` - Health check endpoint

## 🎨 Design System

The application uses a custom CSS design system with:

### Color Palette
- Primary Green: `#2d5016`
- Light Green: `#4a7c28`
- Accent Green: `#8bc34a`
- Pale Green: `#f1f8e9`
- Earth Brown: `#6d4c41`
- Sage Gray: `#78909c`

### Typography
- Primary Font: 'Segoe UI', sans-serif
- Heading Font: 'Georgia', serif

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🔒 Security Features

- **Helmet.js**: Security headers for Express.js
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive validation on all inputs
- **MongoDB Injection Prevention**: Mongoose sanitization
- **XSS Protection**: Input sanitization and output encoding
- **CORS Configuration**: Proper cross-origin resource sharing setup

## 🚀 Deployment

### Production Deployment with Docker

1. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

2. **Environment Configuration**
   - Set `NODE_ENV=production`
   - Use production MongoDB URI
   - Configure production PayPal credentials
   - Set up proper SSL certificates

3. **Monitoring**
   - Application health checks
   - Database connection monitoring
   - Error logging and alerting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- **Email**: support@ecostyle.com
- **Documentation**: Check this README and inline code comments
- **Issues**: Create an issue in the repository for bugs or feature requests

## 🌱 Environmental Impact

EcoStyle is committed to sustainability not just in our products, but in our technology choices:

- **Carbon-Neutral Hosting**: Choose green hosting providers
- **Efficient Code**: Optimized algorithms to reduce energy consumption
- **Minimal Dependencies**: Carefully selected packages to reduce bloat
- **Sustainable Development**: Remote-first work to reduce commuting impact

---

**EcoStyle - Sustainable Fashion for a Better Tomorrow** 🌿
