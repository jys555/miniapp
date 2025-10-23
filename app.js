// Firebase Configuration - O'ZINGIZNIKINI QO'YING!
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// App State
const state = {
    currentPage: 'home',
    currentUser: null,
    userRole: 'user',
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
    pages: {
        home: document.getElementById('home-page'),
        productDetail: document.getElementById('product-detail-page')
    },
    navButtons: {
        home: document.querySelector('.footer-nav .nav-item:nth-child(1)'),
        categories: document.querySelector('.footer-nav .nav-item:nth-child(2)'),
        favorites: document.querySelector('.footer-nav .nav-item:nth-child(3)'),
        cart: document.querySelector('.footer-nav .nav-item:nth-child(4)'),
        profile: document.querySelector('.footer-nav .nav-item:nth-child(5)')
    },
    productGrid: document.getElementById('product-grid')
};

// Initialize App
async function initApp() {
    console.log('Initializing app with Firebase...');
    
    // Check if token exists in localStorage
    const token = localStorage.getItem('authToken');
    
    if (token) {
        try {
            const response = await fetch('https://authtelegram-oo5yfooloq-uc.a.run.app', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                state.currentUser = { uid: userData.uid, profile: userData };
                state.userRole = userData.role || 'user';
                
                // Load all data from Firebase
                await loadData();
                
                // Setup event listeners
                setupEventListeners();
                
                console.log('App initialized successfully with existing token');
                return;
            } else {
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            console.error('Error validating token:', error);
            localStorage.removeItem('authToken');
        }
    }
    
    // Check if Telegram WebApp is available
    if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
        const initData = window.Telegram.WebApp.initData;
        
        if (initData) {
            try {
                // Send initData to server for authentication
                const response = await fetch('https://authtelegram-oo5yfooloq-uc.a.run.app', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ initData })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    state.currentUser = { uid: result.user.id.toString(), profile: result.user };
                    state.userRole = result.user.role || 'user';

                    // Save token to localStorage
                    localStorage.setItem('authToken', result.token);
                    
                    // Load all data from Firebase
                    await loadData();
                    
                    // Setup event listeners
                    setupEventListeners();
                    
                    console.log('App initialized successfully with new token');
                } else {
                    // Authentication failed
                    alert('Authentication failed. Please try again.');
                }
            } catch (error) {
                console.error('Error during authentication:', error);
            }
        }
    }
}

// Load all data from Firebase
async function loadData() {
    try {
        console.log('Loading data from Firebase...');
        
        // Load products
        const productsSnapshot = await db.collection('products')
            .orderBy('name')
            .get();
        
        state.products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`Loaded ${state.products.length} products`);
        
        // Render products
        renderProducts();
        
    } catch (error) {
        console.error('Error loading data from Firebase:', error);
    }
}

// Render Products
function renderProducts() {
    const productGrid = elements.productGrid;
    productGrid.innerHTML = '';
    
    state.products.forEach(product => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });
}

// Create Product Card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const price = product.price || 0;
    const discount = product.discount || 0;
    const discountedPrice = price * (1 - (discount / 100));
    
    card.innerHTML = `
        <div style="position: relative;">
            <img src="${product.imageUrls?.[0] || 'https://placehold.co/300x200'}" 
                 alt="${product.name || 'Product'}" 
                 class="product-image" 
                 onerror="this.src='https://placehold.co/300x200'">
            <button class="like-button" data-product-id="${product.id}">
                <i class="${state.favorites.has(product.id) ? 'fas' : 'far'} fa-heart"></i>
            </button>
            ${discount > 0 ? `
                <div class="discount-badge">
                    -${discount}%
                </div>
            ` : ''}
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name || 'Unnamed Product'}</h3>
            <div class="product-price">
                <div>
                    <span class="price-current">$${discountedPrice.toFixed(2)}</span>
                    ${discount > 0 ? `<span class="price-original">$${price.toFixed(2)}</span>` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    const likeButton = card.querySelector('.like-button');
    if (likeButton) {
        likeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
        });
    }
    
    card.addEventListener('click', () => {
        state.currentProduct = product;
        switchPage('productDetail');
    });
    
    return card;
}

// Toggle Favorite
async function toggleFavorite(productId) {
    console.log('Toggling favorite for product:', productId);
    
    try {
        // Toggle in local state first for immediate feedback
        if (state.favorites.has(productId)) {
            state.favorites.delete(productId);
        } else {
            state.favorites.add(productId);
        }


        // Update user in Firebase (using user ID)
        const userRef = db.collection('users').doc(state.currentUser.uid);
        const favoritesArray = Array.from(state.favorites);
        await userRef.update({ favorites: favoritesArray });
        
        console.log('Favorites updated in Firebase');
        
        // Update UI immediately
        updateFavoriteButtons();
        
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Failed to update favorites. Please try again.');
        
        // Revert local state change on error
        if (state.favorites.has(productId)) {
            state.favorites.delete(productId);
        } else {
            state.favorites.add(productId);
        }
    }
}

// Update Favorite Buttons
function updateFavoriteButtons() {
    document.querySelectorAll('.like-button').forEach(button => {
        const productId = button.getAttribute('data-product-id');
        const icon = button.querySelector('i');
        
        if (icon) {
            if (state.favorites.has(productId)) {
                icon.className = 'fas fa-heart';
            } else {
                icon.className = 'far fa-heart';
            }
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Footer navigation
    if (elements.navButtons.home) {
        elements.navButtons.home.addEventListener('click', () => {
            switchPage('home');
        });
    }
    
    if (elements.navButtons.categories) {
        elements.navButtons.categories.addEventListener('click', () => {
            alert('Categories page not implemented yet');
        });
    }
    
    if (elements.navButtons.favorites) {
        elements.navButtons.favorites.addEventListener('click', () => {
            alert('Favorites page not implemented yet');
        });
    }
    
    if (elements.navButtons.cart) {
        elements.navButtons.cart.addEventListener('click', () => {
            alert('Cart page not implemented yet');
        });
    }
    
    if (elements.navButtons.profile) {
        elements.navButtons.profile.addEventListener('click', () => {
            alert('Profile page not implemented yet');
        });
    }
}

// Switch between pages
function switchPage(page) {
    console.log('Switching to page:', page);
    
    // Hide all pages
    Object.values(elements.pages).forEach(pageEl => {
        if (pageEl) {
            pageEl.classList.add('hidden');
        }
    });

    // Show selected page
    if (elements.pages[page]) {
        elements.pages[page].classList.remove('hidden');
    }
    state.currentPage = page;

    // Update active nav button
    Object.values(elements.navButtons).forEach(button => {
        if (button) {
            button.classList.remove('active');
        }
    });
    
    if (elements.navButtons[page]) {
        elements.navButtons[page].classList.add('active');
    }

    // Special handling for product detail page
    if (page === 'productDetail' && state.currentProduct) {
        renderProductDetailPage();
    }
}

// Render Product Detail Page
function renderProductDetailPage() {
    console.log('Rendering product detail page...');
    
    const product = state.currentProduct;
    if (!product) return;

    // Reset image index
    state.productImageIndex = 0;


    // Create product detail HTML
    const productDetail = document.createElement('div');
    productDetail.className = 'product-detail-container';
    productDetail.innerHTML = `
        <div class="product-images">
            <img src="${product.imageUrls?.[0] || 'https://placehold.co/400x300'}" 
                 alt="${product.name || 'Product'}" 
                 class="product-image-main" 
                 onerror="this.src='https://placehold.co/400x300'">
            <div class="image-indicators" id="image-indicators">
                ${product.imageUrls?.map((_, index) => `<div class="indicator ${index === 0 ? 'active' : ''}"></div>`).join('') || ''}
            </div>
        </div>
        <div class="product-details">
            <h1 class="product-title">${product.name || 'Unnamed Product'}</h1>
            <div class="product-rating">
                <span>⭐️ 4.0 (148) • 1K kupili</span>
            </div>
            <div class="product-variations">
                <div class="variation-option">белый,</div>
                <div class="variation-option">синий</div>
                <div class="variation-option active">черный</div>
                <div class="variation-all">Все варианты</div>
            </div>
            <div class="product-price-section">
                <div class="price-current">${product.price ? `${(product.price * 0.45).toFixed(0)} so'm` : 'Narx mavjud emas'}</div>
                <div class="price-original">${product.price ? `${product.price.toFixed(0)} so'm` : ''}</div>
                <div class="discount-percentage">-${product.discount || 0}%</div>
            </div>
            <div class="product-actions">
                <button class="action-button">Hozir sotib olish</button>
                <button class="add-to-cart">Savatga</button>
            </div>
        </div>
    `;
    
    // Replace main content with product detail
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = '';
    mainContent.appendChild(productDetail);
    
    // Add back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
    backButton.style.position = 'absolute';
    backButton.style.top = '10px';
    backButton.style.left = '10px';
    backButton.style.background = 'white';
    backButton.style.border = 'none';
    backButton.style.padding = '5px 10px';
    backButton.style.borderRadius = '50%';
    backButton.style.cursor = 'pointer';
    backButton.addEventListener('click', () => {
        switchPage('home');
    });
    
    mainContent.insertBefore(backButton, mainContent.firstChild);
}

// Initialize the app when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
