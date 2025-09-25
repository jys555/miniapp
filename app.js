// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrU8Vt8kZo4PvlG5diZuMeZ3yQxUJy2YQ",
  authDomain: "miniapp-78bb0.firebaseapp.com",
  projectId: "miniapp-78bb0",
  storageBucket: "miniapp-78bb0.firebasestorage.app",
  messagingSenderId: "245019211142",
  appId: "1:245019211142:web:217c6d37f060d3561a2807",
  measurementId: "G-Y0R50WRQ6Y"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// App State
const state = {
    currentPage: 'home',
    currentUser: null,
    products: [],
    categories: [],
    favorites: new Set(),
    cart: {},
    currentProduct: null,
    carouselIndex: 0,
    productImageIndex: 0
};

// DOM Elements
const elements = {
    app: document.getElementById('app'),
    mainContent: document.getElementById('main-content'),
    pages: {
        home: document.getElementById('home-page'),
        categories: document.getElementById('categories-page'),
        productDetail: document.getElementById('product-detail-page'),
        favorites: document.getElementById('favorites-page'),
        cart: document.getElementById('cart-page') // MUHIM!
    },
    navButtons: {
        home: document.getElementById('nav-home'),
        categories: document.getElementById('nav-categories'),
        favorites: document.getElementById('nav-favorites'),
        cart: document.getElementById('nav-cart')
    },
    productsGrid: document.getElementById('products-grid'),
    categoriesGrid: document.getElementById('categories-grid'),
    favoritesGrid: document.getElementById('favorites-grid'),
    carousel: document.getElementById('carousel'),
    cartCount: document.getElementById('nav-cart-count')
};

// User ma'lumotlarini avtomatik saqlash
async function ensureUserDocument() {
    const userRef = db.collection('users').doc(state.currentUser.id.toString());
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        await userRef.set({
            first_name: state.currentUser.first_name  '',
            last_name: state.currentUser.last_name  '',
            username: state.currentUser.username  '',
            favorites: [],
            cart: []
        });
    }
}

// Initialize App
async function initApp() {
    // Simulate Telegram WebApp initialization
    window.Telegram = {
        WebApp: {
            initDataUnsafe: {
                user: {
                    id: '123456789',
                    first_name: 'John',
                    last_name: 'Doe',
                    username: 'johndoe'
                }
            },
            ready: function() {
                console.log('Telegram WebApp is ready');
            }
        }
    };

    // Get current user
    state.currentUser = window.Telegram.WebApp.initDataUnsafe.user;

    // USERNI FIRESTOREDA YARATISH YOKI YANGILASH
    await ensureUserDocument();

    // Load data
    await loadData();

    // Setup event listeners
    setupEventListeners();

    // Start carousel
    startCarousel();

    // Notify Telegram that app is ready
    window.Telegram.WebApp.ready();
}

// DOM loaded bo'lganda chaqirish
document.addEventListener('DOMContentLoaded', () => initApp());
// Load data from Firebase
async function loadData() {
    try {
        // Load products
        const productsSnapshot = await db.collection('products').get();
        state.products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Load categories
        const categoriesSnapshot = await db.collection('categories').get();
        state.categories = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // USERNING FAVORITES VA CART MA'LUMOTLARINI ARRAY SIFATIDA O'QISH
const userRef = db.collection('users').doc(state.currentUser.id.toString());
const userDoc = await userRef.get();
const userData = userDoc.data();

state.favorites = new Set(userData.favorites  []);
state.cart = {};

JYS_, [11/09/2025 23:20]
(userData.cart  []).forEach(item => {
    state.cart[item.productId] = item;
});

        // Update UI
        updateCartCount();
        renderHomePage();
        renderCategoriesPage();
        renderFavoritesPage();
    } catch (error) {
        console.error('Error loading data:', error);
        // Use mock data for demo
        loadMockData();
    }
}


// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    elements.navButtons.home.addEventListener('click', () => switchPage('home'));
    elements.navButtons.categories.addEventListener('click', () => switchPage('categories'));
    elements.navButtons.favorites.addEventListener('click', () => switchPage('favorites'));
    elements.navButtons.cart.addEventListener('click', () => switchPage('cart'));

    // Search and Cart buttons
    document.getElementById('search-button').addEventListener('click', () => {
        alert('Search functionality would be implemented here');
    });
}

// Switch between pages
function switchPage(page) {
    // Hide all pages
    Object.values(elements.pages).forEach(pageEl => {
        pageEl.classList.add('hidden');
    });

    // Remove active class from all nav buttons
    Object.values(elements.navButtons).forEach(button => {
        button.classList.remove('active-tab');
        button.classList.add('text-gray-500');
    });

    // Show selected page
    if (elements.pages[page]) {
        elements.pages[page].classList.remove('hidden');
    }
    state.currentPage = page;

    // Update active nav button
    if (elements.navButtons[page]) {
        elements.navButtons[page].classList.add('active-tab');
        elements.navButtons[page].classList.remove('text-gray-500');
    }

    // Special handling for product detail page
    if (page === 'productDetail' && state.currentProduct) {
        renderProductDetailPage();
    }
}

// Render Home Page
function renderHomePage() {
    elements.productsGrid.innerHTML = '';
    
    state.products.slice(0, 6).forEach(product => {
        const productCard = createProductCard(product);
        elements.productsGrid.appendChild(productCard);
    });
}

// Render Categories Page
function renderCategoriesPage() {
    elements.categoriesGrid.innerHTML = '';
    
    state.categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'bg-white rounded-lg shadow-sm p-4 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow';
        categoryCard.innerHTML = `
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <i class="${category.icon} text-blue-500 text-xl"></i>
            </div>
            <h3 class="font-medium text-gray-800">${category.name}</h3>
        `;
        
        categoryCard.addEventListener('click', () => {
            alert(`Filtering by category: ${category.name}`);
        });
        
        elements.categoriesGrid.appendChild(categoryCard);
    });
}

// Render Product Detail Page
function renderProductDetailPage() {
    const product = state.currentProduct;
    if (!product) return;

    // Reset image index
    state.productImageIndex = 0;

    // Render product images
    const productImages = document.getElementById('product-images');
    productImages.innerHTML = '';
    
    product.imageUrls.forEach((url, index) => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'w-full flex-shrink-0';
        imgDiv.innerHTML = `<img src="${url}" alt="${product.name}" class="w-full h-64 object-cover">`;
        productImages.appendChild(imgDiv);
    });

    // Update image indicators
    const indicators = document.getElementById('image-indicators');
    indicators.innerHTML = '';
    product.imageUrls.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = `w-2 h-2 rounded-full ${index === 0 ? 'bg-white' : 'bg-white bg-opacity-50'}`;
        indicators.appendChild(indicator);
    });

    // Update product info
    docu

JYS_, [11/09/2025 23:20]
ment.getElementById('product-name').textContent = product.name;
    
    const discountedPrice = product.price * (1 - (product.discount / 100));
    document.getElementById('product-price-discounted').textContent = `$${discountedPrice.toFixed(2)}`;
    
    if (product.discount > 0) {
        document.getElementById('product-price-original').textContent = `$${product.price.toFixed(2)}`;
        document.getElementById('product-discount').textContent = `-${product.discount}%`;
    } else {
        document.getElementById('product-price-original').textContent = '';
        document.getElementById('product-discount').textContent = '';
    }
    
    document.getElementById('product-description').textContent = product.description;

    // Setup buy button
    document.getElementById('buy-button').onclick = () => {
        window.open(product.buyLink, '_blank');
    };

    // Setup image swipe
    setupProductImageSwipe();
}

// Setup product image swipe
function setupProductImageSwipe() {
    const productImages = document.getElementById('product-images');
    const indicators = document.querySelectorAll('#image-indicators > div');
    let startX = 0;
    let endX = 0;

    productImages.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    productImages.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });

    function handleSwipe() {
        const threshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe left - next image
                if (state.productImageIndex < state.currentProduct.imageUrls.length - 1) {
                    state.productImageIndex++;
                }
            } else {
                // Swipe right - previous image
                if (state.productImageIndex > 0) {
                    state.productImageIndex--;
                }
            }
            
            // Update carousel position
            productImages.style.transform = `translateX(-${state.productImageIndex * 100}%)`;
            
            // Update indicators
            indicators.forEach((indicator, index) => {
                if (index === state.productImageIndex) {
                    indicator.classList.remove('bg-opacity-50');
                } else {
                    indicator.classList.add('bg-opacity-50');
                }
            });
        }
    }
}

// Render Favorites Page
function renderFavoritesPage() {
    elements.favoritesGrid.innerHTML = '';
    
    const favoriteProducts = state.products.filter(product => state.favorites.has(product.id));
    
    if (favoriteProducts.length === 0) {
        elements.favoritesGrid.innerHTML = `
            <div class="col-span-2 text-center py-8">
                <i class="fas fa-heart text-gray-300 text-4xl mb-3"></i>
                <p class="text-gray-500">No favorite products yet</p>
            </div>
        `;
        return;
    }
    
    favoriteProducts.forEach(product => {
        const productCard = createProductCard(product);
        elements.favoritesGrid.appendChild(productCard);
    });
}

JYS_, [11/09/2025 23:20]
// Create Product Card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card bg-white rounded-lg overflow-hidden shadow-sm';
    
    const discountedPrice = product.price * (1 - (product.discount / 100));
    
    card.innerHTML = `
        <div class="relative">
            <img src="${product.imageUrls[0]}" alt="${product.name}" class="w-full h-48 object-cover">
            <button class="like-button absolute top-2 right-2 w-8 h-8 rounded-full bg-white bg-opacity-80 flex items-center justify-center" 
                    data-product-id="${product.id}">
                <i class="${state.favorites.has(product.id) ? 'fas' : 'far'} fa-heart text-red-500"></i>
            </button>
            ${product.discount > 0 ? `
                <div class="discount-badge absolute bottom-2 left-2">
                    -${product.discount}%
                </div>
            ` : ''}
        </div>
        <div class="p-3">
            <h3 class="font-medium text-gray-800 mb-1 line-clamp-2">${product.name}</h3>
            <div class="flex items-center justify-between">
                <div>
                    <span class="price-discounted font-semibold">$${discountedPrice.toFixed(2)}</span>
                    ${product.discount > 0 ? `<span class="price-original text-sm ml-1">$${product.price.toFixed(2)}</span>` : ''}
                </div>
                <button class="buy-button px-3 py-1 rounded text-white text-sm">
                    Buy
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const likeButton = card.querySelector('.like-button');
    likeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(product.id);
    });
    
    const buyButton = card.querySelector('.buy-button');
    buyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(product.buyLink, '_blank');
    });
    
    card.addEventListener('click', () => {
        state.currentProduct = product;
        switchPage('productDetail');
    });
    
    return card;
}

// Toggle Favorite (array bilan ishlaydi, subcollection emas)
// Demo versiya uchun ham local state yangilanadi
async function toggleFavorite(productId) {
    try {
        const userRef = db.collection('users').doc(state.currentUser.id.toString());
        const userDoc = await userRef.get();
        let favorites = userDoc.data().favorites  [];
        const isFavorite = favorites.includes(productId);

        if (isFavorite) {
            favorites = favorites.filter(id => id !== productId);
            state.favorites.delete(productId);
        } else {
            favorites.push(productId);
            state.favorites.add(productId);
        }

        // Firestorega yangilash
        await userRef.update({ favorites });

        // UI yangilash
        updateFavoriteButtons();
        if (state.currentPage === 'favorites') {
            renderFavoritesPage();
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        // DEMO uchun local state yangilash
        if (state.favorites.has(productId)) {
            state.favorites.delete(productId);
        } else {
            state.favorites.add(productId);
        }
        updateFavoriteButtons();
        if (state.currentPage === 'favorites') {
            renderFavoritesPage();
        }
    }
}

// Update Favorite Buttons
function updateFavoriteButtons() {
    document.querySelectorAll('.like-button').forEach(button => {
        const productId = button.getAttribute('data-product-id');
        const icon = button.querySelector('i');
        
        if (state.favorites.has(productId)) {
            icon.className = 'fas fa-heart text-red-500';
        } else {
            icon.className = 'far fa-heart text-red-500';
        }
    });
}

JYS_, [11/09/2025 23:20]
// Update Cart Count
function updateCartCount() {
    const count = Object.values(state.cart).reduce((sum, item) => sum + item.count, 0);
    elements.cartCount.textContent = count;
}

// Start Carousel
function startCarousel() {
    setInterval(() => {
        state.carouselIndex = (state.carouselIndex + 1) % 3;
        elements.carousel.style.transform = `translateX(-${state.carouselIndex * 100}%)`;
    }, 5000);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

JYS_, [11/09/2025 23:22]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marketplace Mini App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="style.css">
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js"></script>
</head>
<body class="bg-gray-50">
    <div id="app" class="max-w-md mx-auto bg-white min-h-screen flex flex-col">
       <!-- Header -->
<header class="bg-white shadow-sm py-4 px-4 flex items-center justify-between sticky top-0 z-10">
    <h1 class="text-xl font-bold text-gray-800">Marketplace</h1>
    <div class="flex space-x-3">
        <button id="search-button" class="text-gray-600">
            <i class="fas fa-search"></i>
        </button>
    </div>
</header>

        <!-- Main Content -->
        <main id="main-content" class="flex-1 overflow-y-auto pb-16">
            <!-- Home Page -->
            <div id="home-page" class="page">
                <!-- Carousel Banner -->
                <div class="relative overflow-hidden h-48 mb-4">
                    <div id="carousel" class="flex transition-transform duration-300 ease-in-out">
                        <div class="carousel-item w-full flex-shrink-0">
                            <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-48 flex items-center justify-center text-white">
                                <div class="text-center p-4">
                                    <h2 class="text-xl font-bold mb-2">Summer Sale</h2>
                                    <p class="mb-3">Up to 50% off on selected items</p>
                                    <button class="bg-white text-blue-600 px-4 py-2 rounded-full font-medium">Shop Now</button>
                                </div>
                            </div>
                        </div>
                        <div class="carousel-item w-full flex-shrink-0">
                            <div class="bg-gradient-to-r from-green-500 to-teal-600 h-48 flex items-center justify-center text-white">
                                <div class="text-center p-4">
                                    <h2 class="text-xl font-bold mb-2">New Arrivals</h2>
                                    <p class="mb-3">Check out our latest products</p>
                                    <button class="bg-white text-green-600 px-4 py-2 rounded-full font-medium">Explore</button>
                                </div>
                            </div>
                        </div>
                        <div class="carousel-item w-full flex-shrink-0">
                            <div class="bg-gradient-to-r from-yellow-500 to-orange-600 h-48 flex items-center justify-center text-white">
                                <div class="text-center p-4">
                                    <h2 class="text-xl font-bold mb-2">Free Shipping</h2>
                                    <p class="mb-3">On orders over $50</p>
                                    <button class="bg-white text-orange-600 px-4 py-2 rounded-full font-medium">Learn More</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
                        <div class="w-2 h-2 bg-white rounded-full opacity-50"></div>
                        <div class="w-2 h-2 bg-white rounded-full opacity-50"></div>
                        <div class="w-2 h-2 bg-white rounded-full opacity-50"></div>
                    </div>
                </div>

JYS_, [11/09/2025 23:22]
<!-- Top Products Grid -->
                <div class="px-4">
                    <h2 class="text-lg font-semibold mb-3 text-gray-800">Top Products</h2>
                    <div id="products-grid" class="grid grid-cols-2 gap-4">
                        <!-- Product cards will be inserted here -->
                    </div>
                </div>
            </div>

            <!-- Categories Page -->
            <div id="categories-page" class="page hidden">
                <div class="px-4 py-4">
                    <h2 class="text-lg font-semibold mb-4 text-gray-800">Categories</h2>
                    <div id="categories-grid" class="grid grid-cols-2 gap-4">
                        <!-- Categories will be inserted here -->
                    </div>
                </div>
            </div>

            <!-- Product Detail Page -->
            <div id="product-detail-page" class="page hidden">
                <div class="p-4">
                    <!-- Product Images Carousel -->
                    <div class="relative overflow-hidden rounded-lg mb-4">
                        <div id="product-images" class="flex transition-transform duration-300 ease-in-out">
                            <!-- Images will be inserted here -->
                        </div>
                        <div id="image-indicators" class="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
                            <!-- Indicators will be inserted here -->
                        </div>
                    </div>

                    <!-- Product Info -->
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                        <h1 id="product-name" class="text-xl font-bold text-gray-800 mb-2"></h1>
                        
                        <div class="flex items-center mb-3">
                            <span id="product-price-discounted" class="price-discounted text-xl mr-2"></span>
                            <span id="product-price-original" class="price-original text-sm"></span>
                            <span id="product-discount" class="discount-badge ml-2"></span>
                        </div>
                        
                        <p id="product-description" class="text-gray-600 mb-4"></p>
                        
                        <button id="buy-button" class="buy-button w-full py-3 rounded-lg text-white font-medium flex items-center justify-center">
                            <i class="fas fa-shopping-cart mr-2"></i> Buy Now
                        </button>
                    </div>
                </div>
            </div>

            <!-- Favorites Page -->
            <div id="favorites-page" class="page hidden">
                <div class="px-4 py-4">
                    <h2 class="text-lg font-semibold mb-4 text-gray-800">My Favorites</h2>
                    <div id="favorites-grid" class="grid grid-cols-2 gap-4">
                        <!-- Favorite products will be inserted here -->
                    </div>
                </div>
            </div>

            <!-- Cart Page -->                 
            <div id="cart-page" class="page hidden">
    <div class="p-4">
        <h2 class="text-lg font-semibold mb-4 text-gray-800">Your Cart</h2>
        <div class="bg-white rounded-lg p-4 shadow-sm">
            <p class="text-gray-600 text-center py-8">Your cart is empty</p>
        </div>
    </div>
</div>
        </main>

JYS_, [11/09/2025 23:22]
<!-- Bottom Navigation -->
<nav class="bg-white border-t border-gray-200 py-3 px-6 flex justify-around fixed bottom-0 w-full max-w-md">
    <button id="nav-home" class="nav-button flex flex-col items-center text-gray-500 active-tab">
        <i class="fas fa-home text-xl mb-1"></i>
        <span class="text-xs">Home</span>
    </button>
    <button id="nav-categories" class="nav-button flex flex-col items-center text-gray-500">
        <i class="fas fa-th-large text-xl mb-1"></i>
        <span class="text-xs">Categories</span>
    </button>
    <button id="nav-favorites" class="nav-button flex flex-col items-center text-gray-500">
        <i class="fas fa-heart text-xl mb-1"></i>
        <span class="text-xs">Favorites</span>
    </button>
    <button id="nav-cart" class="nav-button flex flex-col items-center text-gray-500 relative">
    <i class="fas fa-shopping-cart text-xl mb-1"></i>
    <span class="text-xs">Cart</span>
    <span id="nav-cart-count" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">0</span>
</button>
</nav>
    </div>
</body>

       <script src="app.js"></script>
</html>
