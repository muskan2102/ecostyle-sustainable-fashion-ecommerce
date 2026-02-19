// EcoStyle Main Application JavaScript

// Global state
let cart = [];
let products = [];
let currentProduct = null;

// DOM Elements
const cartCount = document.querySelector('.cart-count');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadCartFromStorage();
    updateCartUI();
    initializeEventListeners();
    
    // Page-specific initialization
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        loadFeaturedProducts();
    }
    
    if (window.location.pathname.includes('products') && !window.location.pathname.includes('/add-product')) {
        if (window.location.pathname.includes('/products/')) {
            loadProductDetails();
        } else {
            loadProducts();
        }
    }
    
    if (window.location.pathname.includes('cart')) {
        loadCartPage();
    }
    
    if (window.location.pathname.includes('orders')) {
        loadOrderHistory();
    }
}

// Event Listeners
function initializeEventListeners() {
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    // Filter functionality
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', applyFilters);
    }
}

// Mobile Menu
function toggleMobileMenu() {
    navLinks.classList.toggle('active');
}

// Cart Management
function loadCartFromStorage() {
    const storedCart = localStorage.getItem('ecostyle-cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

function saveCartToStorage() {
    localStorage.setItem('ecostyle-cart', JSON.stringify(cart));
}

function addToCart(productId, quantity = 1) {
    console.log('🛒 Adding to cart:', productId, quantity);
    
    // Validate inputs
    if (!productId) {
        console.error('❌ No product ID provided');
        return;
    }
    
    quantity = parseInt(quantity) || 1;
    if (quantity < 1) quantity = 1;
    
    try {
        const existingItem = cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
            console.log('✅ Updated existing item:', existingItem);
        } else {
            cart.push({
                productId: productId,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
            console.log('✅ Added new item:', { productId, quantity });
        }
        
        // Save to localStorage
        localStorage.setItem('ecostyle-cart', JSON.stringify(cart));
        
        // Update UI
        updateCartUI();
        
        // Show success message
        showMessage(`Added ${quantity}x ${getProductName(productId)} to cart!`, 'success');
        
        console.log('📊 Cart after adding:', cart);
        
        // Redirect to cart page after adding
        setTimeout(() => {
            window.location.href = '/cart';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error adding to cart:', error);
        showMessage('Error adding product to cart', 'error');
    }
}

function getProductName(productId) {
    const product = products.find(p => p._id === productId);
    return product ? product.name : 'Unknown Product';
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveCartToStorage();
    updateCartUI();
    
    if (window.location.pathname.includes('cart')) {
        loadCartPage();
    }
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity = Math.max(1, parseInt(quantity));
        saveCartToStorage();
        updateCartUI();
        
        if (window.location.pathname.includes('cart')) {
            loadCartPage();
        }
    }
}

function getCartCount() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function updateCartUI() {
    console.log('🔄 Updating cart UI...');
    
    if (cartCount) {
        const count = getCartCount();
        console.log('📊 Cart count:', count);
        
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'flex' : 'none';
        cartCount.style.backgroundColor = count > 0 ? '#2d5016' : '#666';
        cartCount.style.color = 'white';
        
        console.log('✅ Cart UI updated:', {
            count: count,
            display: cartCount.style.display,
            text: cartCount.textContent
        });
    } else {
        console.error('❌ Cart count element not found');
    }
}

// Product Management
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (response.ok) {
            products = data.products;
            renderProducts(products);
        } else {
            showMessage('Failed to load products', 'error');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage('Error loading products', 'error');
    }
}

async function loadFeaturedProducts() {
    try {
        const response = await fetch('/api/products/featured');
        const data = await response.json();
        
        if (response.ok) {
            renderFeaturedProducts(data.products);
        } else {
            showMessage('Failed to load featured products', 'error');
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
        showMessage('Error loading featured products', 'error');
    }
}

async function loadProductDetails() {
    const productId = window.location.pathname.split('/').pop();
    
    try {
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();
        
        if (response.ok) {
            currentProduct = data.product;
            renderProductDetails(currentProduct);
        } else {
            showMessage('Product not found', 'error');
            setTimeout(() => {
                window.location.href = '/products';
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading product details:', error);
        showMessage('Error loading product details', 'error');
    }
}

// Search and Filter
async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        showMessage('Please enter at least 2 characters to search', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/products/search?name=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (response.ok) {
            products = data.products;
            renderProducts(products);
            showMessage(`Found ${data.pagination.totalResults} products for "${query}"`, 'success');
        } else {
            showMessage('Search failed', 'error');
        }
    } catch (error) {
        console.error('Error searching products:', error);
        showMessage('Error searching products', 'error');
    }
}

async function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    
    let url = '/api/products?';
    const params = [];
    
    if (categoryFilter && categoryFilter.value) {
        params.push(`category=${categoryFilter.value}`);
    }
    
    if (priceFilter && priceFilter.value) {
        const [min, max] = priceFilter.value.split('-');
        if (min) params.push(`minPrice=${min}`);
        if (max) params.push(`maxPrice=${max}`);
    }
    
    url += params.join('&');
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            products = data.products;
            renderProducts(products);
        } else {
            showMessage('Failed to apply filters', 'error');
        }
    } catch (error) {
        console.error('Error applying filters:', error);
        showMessage('Error applying filters', 'error');
    }
}

// Rendering Functions
function renderProducts(productsToRender) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;
    
    if (productsToRender.length === 0) {
        productGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <h3>No products found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }
    
    productGrid.innerHTML = productsToRender.map(product => `
        <div class="product-card">
            <img src="${product.imageUrl}" alt="${product.name}" class="product-image" 
                     style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;"
                     onload="console.log('✅ Image loaded:', this.src)"
                     onerror="console.log('❌ Image failed, using fallback'); this.src='https://picsum.photos/seed/${product._id}/280/250.jpg'; this.onerror=function(){this.src='https://via.placeholder.com/280x250/2d5016/ffffff?text=${encodeURIComponent(product.name)}'}">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${product.price.toFixed(2)}</div>
                <p class="product-description">${product.description.substring(0, 100)}...</p>
                <div class="eco-tags">
                    ${product.ecoTags.map(tag => `<span class="eco-tag">${tag.replace('-', ' ')}</span>`).join('')}
                </div>
                <div class="product-actions">
                    <a href="/products/${product._id}" class="btn btn-outline">View Details</a>
                    <button class="btn btn-primary" onclick="addToCart('${product._id}')">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderFeaturedProducts(featuredProducts) {
    const featuredGrid = document.getElementById('featuredGrid');
    if (!featuredGrid) return;
    
    if (featuredProducts.length === 0) {
        featuredGrid.innerHTML = '<p>No featured products available at the moment.</p>';
        return;
    }
    
    featuredGrid.innerHTML = featuredProducts.map(product => `
        <div class="product-card">
            <img src="${product.imageUrl}" alt="${product.name}" class="product-image" 
                     style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;"
                     onload="console.log('✅ Image loaded:', this.src)"
                     onerror="console.log('❌ Image failed, using fallback'); this.src='https://picsum.photos/seed/${product._id}/280/250.jpg'; this.onerror=function(){this.src='https://via.placeholder.com/280x250/2d5016/ffffff?text=${encodeURIComponent(product.name)}'}">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <p class="product-description">${product.description.substring(0, 100)}...</p>
                <div class="eco-tags">
                    ${product.ecoTags.map(tag => `<span class="eco-tag">${tag.replace('-', ' ')}</span>`).join('')}
                </div>
                <div class="product-actions">
                    <a href="/products/${product._id}" class="btn btn-outline">View Details</a>
                    <button class="btn btn-primary" onclick="addToCart('${product._id}')">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderProductDetails(product) {
    const container = document.getElementById('productDetails');
    if (!container) return;
    
    container.innerHTML = `
        <div class="product-details">
            <div>
                <img src="${product.imageUrl}" alt="${product.name}" class="product-detail-image" 
                         style="width: 100%; max-width: 600px; height: auto; border-radius: 8px;"
                         onload="console.log('✅ Detail image loaded:', this.src)"
                         onerror="console.log('❌ Detail image failed, using fallback'); this.src='https://picsum.photos/seed/${product._id}/600x500.jpg'; this.onerror=function(){this.src='https://via.placeholder.com/600x500/2d5016/ffffff?text=${encodeURIComponent(product.name)}'}">
            </div>
            <div class="product-detail-info">
                <h1>${product.name}</h1>
                <div class="product-detail-price">$${product.price.toFixed(2)}</div>
                <p class="product-detail-description">${product.description}</p>
                
                <div class="product-meta">
                    <div class="meta-item">
                        <span class="meta-label">Category:</span>
                        <span>${product.category}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Stock:</span>
                        <span>${product.stockQty} units</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Sustainability Score:</span>
                        <span>${product.sustainabilityScore}/100</span>
                    </div>
                </div>
                
                <div class="eco-tags">
                    ${product.ecoTags.map(tag => `<span class="eco-tag">${tag.replace('-', ' ')}</span>`).join('')}
                </div>
                
                <div class="quantity-selector">
                    <label for="quantity">Quantity:</label>
                    <input type="number" id="quantity" class="quantity-input" value="1" min="1" max="${product.stockQty}">
                </div>
                
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="addToCartWithQuantity('${product._id}')">
                        Add to Cart
                    </button>
                    <a href="/cart" class="btn btn-secondary">View Cart</a>
                </div>
            </div>
        </div>
    `;
}

function addToCartWithQuantity(productId) {
    const quantityInput = document.getElementById('quantity');
    const quantity = parseInt(quantityInput.value) || 1;
    addToCart(productId, quantity);
}

// Cart Page
async function loadCartPage() {
    const cartContainer = document.getElementById('cartContainer');
    const cartSummary = document.getElementById('cartSummary');
    
    if (!cartContainer || !cartSummary) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3>Your cart is empty</h3>
                <p>Start shopping to add items to your cart!</p>
                <a href="/products" class="btn btn-primary">Shop Now</a>
            </div>
        `;
        cartSummary.innerHTML = '';
        return;
    }
    
    try {
        // Get product details for all cart items
        const productIds = cart.map(item => item.productId);
        const productPromises = productIds.map(id => fetch(`/api/products/${id}`));
        const responses = await Promise.all(productPromises);
        const productData = await Promise.all(responses.map(res => res.json()));
        
        const cartItems = cart.map((cartItem, index) => {
            const productResponse = productData[index];
            const product = productResponse.product;
            return {
                ...cartItem,
                product: product
            };
        });
        
        renderCartItems(cartItems);
        renderCartSummary(cartItems);
        
    } catch (error) {
        console.error('Error loading cart:', error);
        showMessage('Error loading cart', 'error');
    }
}

function renderCartItems(cartItems) {
    const cartContainer = document.getElementById('cartContainer');
    if (!cartContainer) return;
    
    cartContainer.innerHTML = cartItems.map(item => `
        <div class="cart-item">
            <img src="${item.product.imageUrl}" alt="${item.product.name}" class="cart-item-image" 
                    style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;"
                    onload="console.log('✅ Cart image loaded:', this.src)"
                    onerror="console.log('❌ Cart image failed, using fallback'); this.src='https://picsum.photos/seed/${item.product._id}/80x80.jpg'; this.onerror=function(){this.src='https://via.placeholder.com/80x80/2d5016/ffffff?text=${encodeURIComponent(item.product.name)}'}">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.product.name}</div>
                <div class="cart-item-price">$${item.product.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-quantity">
                <input type="number" value="${item.quantity}" min="1" max="${item.product.stockQty}"
                       onchange="updateCartQuantity('${item.productId}', this.value)">
            </div>
            <div class="cart-item-total">
                $${(item.product.price * item.quantity).toFixed(2)}
            </div>
            <button class="btn btn-secondary" onclick="removeFromCart('${item.productId}')">
                Remove
            </button>
        </div>
    `).join('');
}

function renderCartSummary(cartItems) {
    const cartSummary = document.getElementById('cartSummary');
    if (!cartSummary) return;
    
    const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
    const total = subtotal + shipping;
    
    cartSummary.innerHTML = `
        <h3>Order Summary</h3>
        <div class="summary-row">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Shipping:</span>
            <span>${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
        </div>
        <a href="/checkout" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
            Proceed to Checkout
        </a>
        ${shipping > 0 ? '<p style="margin-top: 1rem; font-size: 0.9rem; color: var(--medium-gray);">Add $' + (50 - subtotal).toFixed(2) + ' more for free shipping!</p>' : ''}
    `;
}

// Order History
async function loadOrderHistory() {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;
    
    try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        if (response.ok) {
            renderOrderHistory(data.orders);
        } else {
            showMessage('Failed to load order history', 'error');
        }
    } catch (error) {
        console.error('Error loading order history:', error);
        showMessage('Error loading order history', 'error');
    }
}

function renderOrderHistory(orders) {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3>No orders found</h3>
                <p>Start shopping to see your order history!</p>
                <a href="/products" class="btn btn-primary">Shop Now</a>
            </div>
        `;
        return;
    }
    
    ordersContainer.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-number">${order.orderNumber}</div>
                    <div style="color: var(--medium-gray); font-size: 0.9rem;">
                        ${new Date(order.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div class="order-status status-${order.paymentStatus}">
                    ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </div>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <div>
                            <strong>${item.name}</strong> (Qty: ${item.quantity})
                        </div>
                        <div>$${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="summary-row total">
                <span>Total:</span>
                <span>$${order.totalAmount.toFixed(2)}</span>
            </div>
            
            ${order.paymentStatus === 'completed' ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--light-gray);">
                    <small style="color: var(--medium-gray);">
                        PayPal Order ID: ${order.paypalOrderId}
                    </small>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Utility Functions
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    messageContainer.appendChild(messageElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Export functions for global access
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.addToCartWithQuantity = addToCartWithQuantity;
window.performSearch = performSearch;
window.applyFilters = applyFilters;
