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
        favorites: document.getElementById('favorites-page')
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

// Initialize App
function initApp() {
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
    
    // Load data
    loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start carousel
    startCarousel();
    
    // Notify Telegram that app is ready
    window.Telegram.WebApp.ready();
}

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

        // Load user favorites
        const favoritesSnapshot = await db.collection('users')
            .doc(state.currentUser.id)
            .collection('favorites')
            .get();
        
        state.favorites = new Set(favoritesSnapshot.docs.map(doc => doc.id));

        // Load user cart
        const cartSnapshot = await db.collection('users')
            .doc(state.currentUser.id)
            .collection('cart')
            .get();
        
        state.cart = {};
        cartSnapshot.forEach(doc => {
            state.cart[doc.id] = doc.data();
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

// Load mock data for demo
function loadMockData() {
    state.products = [
        {
            id: '1',
            name: 'Wireless Bluetooth Headphones',
            description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
            price: 89.99,
            discount: 20,
            imageUrls: [
                'https://placehold.co/300x400/3b82f6/white?text=Headphones+1',
                'https://placehold.co/300x400/3b82f6/white?text=Headphones+2'
            ],
            categoryId: 'electronics',
            buyLink: 'https://example.com/product/1'
        },
        {
            id: '2',
            name: 'Smart Fitness Watch',
            description: 'Track your heart rate, sleep, and daily activities with this advanced smartwatch.',
            price: 129.99,
            discount: 15,
            imageUrls: [
                'https://placehold.co/300x400/10b981/white?text=Watch+1',
                'https://placehold.co/300x400/10b981/white?text=Watch+2'
            ],
            categoryId: 'electronics',
            buyLink: 'https://example.com/product/2'
        },
        {
            id: '3',
            name: 'Organic Cotton T-Shirt',
            description: 'Comfortable and eco-friendly t-shirt made from 100% organic cotton.',
            price: 24.99,
            discount: 0,
            imageUrls: [
                'https://placehold.co/300x400/f59e0b/white?text=T-Shirt+1'
            ],
            categoryId: 'clothing',
            buyLink: 'https://example.com/product/3'
        },
        {
            id: '4',
            name: 'Stainless Steel Water Bottle',
            description: 'Keep your drinks hot or cold for hours with this durable water bottle.',
            price: 19.99,
            discount: 10,
            imageUrls: [
                'https://placehold.co/300x400/8b5cf6/white?text=Bottle+1',
                'https://placehold.co/300x400/8b5cf6/white?text=Bottle+2'
            ],
            categoryId: 'home',
            buyLink: 'https://example.com/product/4'
        }
    ];

    state.categories = [
        { id: 'electronics', name: 'Electronics', icon: 'fas fa-laptop' },
        { id: 'clothing', name: 'Clothing', icon: 'fas fa-tshirt' },
        { id: 'home', name: 'Home & Kitchen', icon: 'fas fa-home' },
        { id: 'books', name: 'Books', icon: 'fas fa-book' },
        { id: 'sports', name: 'Sports', icon: 'fas fa-football-ball' },
        { id: 'beauty', name: 'Beauty', icon: 'fas fa-spa' }
    ];

    renderHomePage();
    renderCategoriesPage();
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
    document.getElementById('product-name').textContent = product.name;
    
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

// Toggle Favorite
async function toggleFavorite(productId) {
    const isFavorite = state.favorites.has(productId);
    
    try {
        const userRef = db.collection('users').doc(state.currentUser.id);
        
        if (isFavorite) {
            // Remove from favorites
            await userRef.collection('favorites').doc(productId).delete();
            state.favorites.delete(productId);
        } else {
            // Add to favorites
            await userRef.collection('favorites').doc(productId).set({ timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            state.favorites.add(productId);
        }
        
        // Update UI
        updateFavoriteButtons();
        if (state.currentPage === 'favorites') {
            renderFavoritesPage();
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        // For demo, update local state
        if (isFavorite) {
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
