// Initialize App
async function initApp() {
    console.log('Telegram WebApp Object:', window.Telegram?.WebApp);
    console.log('initData:', window.Telegram?.WebApp?.initData);

    // Qolgan kod...
}
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
    userRole: 'user', // 'user' or 'admin'
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
    authModal: document.getElementById('auth-modal'),
    authForm: document.getElementById('auth-form'),
    nameInput: document.getElementById('name-input'),
    phoneInput: document.getElementById('phone-input'),
    telegramId: document.getElementById('telegram-id'),
    logoutLink: document.getElementById('logout-link'),
    pages: {
        home: document.getElementById('home-page'),
        categories: document.getElementById('categories-page'),
        productDetail: document.getElementById('product-detail-page'),
        favorites: document.getElementById('favorites-page'),
        cart: document.getElementById('cart-page'),
        profile: document.getElementById('profile-page'),
        admin: document.getElementById('admin-page')
    },
    navButtons: {
        home: document.getElementById('nav-home'),
        categories: document.getElementById('nav-categories'),
        favorites: document.getElementById('nav-favorites'),
        cart: document.getElementById('nav-cart'),
        profile: document.getElementById('nav-profile')
    },
    loading: {
        home: document.getElementById('home-loading'),
        categories: document.getElementById('categories-loading'),
        favorites: document.getElementById('favorites-loading')
    },
    profile: {
        name: document.getElementById('profile-name'),
        phone: document.getElementById('profile-phone'),
        nameInput: document.getElementById('profile-name-input'),
        phoneInput: document.getElementById('profile-phone-input'),
        form: document.getElementById('profile-form')
    },
    admin: {
        addProductBtn: document.getElementById('add-product-btn'),
        productsTable: document.getElementById('admin-products-table')
    }
};

// Initialize App
async function initApp() {
    console.log('Initializing app with Firebase...');
    
    // Check if token exists in localStorage
    const token = localStorage.getItem('authToken');
    
    if (token) {
        // Token exists, try to get user data from server
        try {
            const response = await fetch('https://us-central1-miniapp-78bb0.cloudfunctions.net/validateToken', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                state.currentUser = { uid: userData.uid, profile: userData };
                state.userRole = userData.role || 'user';
                
                // Hide auth modal and show app content
                elements.authModal.classList.add('hidden');
                
                // Load all data from Firebase
                await loadData();
                
                // Setup event listeners
                setupEventListeners();
                
                // Start carousel
                startCarousel();
                
                console.log('App initialized successfully with existing token');
                return;
            } else {
                // Token invalid, remove it
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
                const response = await fetch('https://us-central1-miniapp-78bb0.cloudfunctions.net/authTelegram', {
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
                    
                    // Hide auth modal and show app content
                    elements.authModal.classList.add('hidden');
                    
                    // Load all data from Firebase
                    await loadData();
                    
                    // Setup event listeners
                    setupEventListeners();
                    
                    // Start carousel
                    startCarousel();
                    
                    console.log('App initialized successfully with new token');
                } else {
                    // Authentication failed, show auth modal
                    elements.authModal.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error during authentication:', error);
                elements.authModal.classList.remove('hidden');
            }
        } else {
            // No Telegram initData, show auth modal
            elements.authModal.classList.remove('hidden');
        }
    } else {
        // Telegram WebApp not available, show auth modal
        elements.authModal.classList.remove('hidden');
    }
}

// Load user profile from Firestore (or from server if needed)
async function loadUserProfile() {
    try {
        // In this new approach, user data comes with token validation
        // So we don't need to load from Firestore separately
        // Just use state.currentUser.profile which is already set
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Handle form submission for authentication
elements.authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = elements.nameInput.value.trim();
    const phone = elements.phoneInput.value.trim();
    
    if (!name || !phone) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // Get Telegram initData
        let initData = null;
        if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
            initData = window.Telegram.WebApp.initData;
        }
        
        if (!initData) {
            alert('Telegram user data not available');
            return;
        }
        
        // Send both initData and user details to server
        const response = await fetch('https://us-central1-miniapp-78bb0.cloudfunctions.net/authTelegram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                initData,
                name,
                phone
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            state.currentUser = { uid: result.user.id.toString(), profile: result.user };
            state.userRole = result.user.role || 'user';
            
            // Save token to localStorage
            localStorage.setItem('authToken', result.token);
            
            // Hide auth modal and show app content
            elements.authModal.classList.add('hidden');
            
            // Load all data from Firebase
            await loadData();
            
            // Setup event listeners
            setupEventListeners();
            
            // Start carousel
            startCarousel();
            
            console.log('User authenticated and profile created');
        } else {
            alert('Authentication failed. Please try again.');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Error creating user. Please try again.');
    }
});

// Handle logout
elements.logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    elements.authModal.classList.remove('hidden');
    state.currentUser = null;
    localStorage.removeItem('authToken'); // Remove token on logout
});

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

        // Load categories
        const categoriesSnapshot = await db.collection('categories')
            .orderBy('name')
            .get();
        
        state.categories = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`Loaded ${state.categories.length} categories`);

        // Load user favorites (from Firestore using user ID)
        await loadUserFavorites();
        
        // Hide loading indicators
        hideAllLoading();
        
        // Render all pages
        renderHomePage();
        renderCategoriesPage();
        renderFavoritesPage();
        renderAdminPage();
        
        console.log('All data loaded successfully');
        
    } catch (error) {
        console.error('Error loading data from Firebase:', error);
        hideAllLoading();
        throw error;
    }
}

// Load user favorites from Firebase
async function loadUserFavorites() {
    try {
        // This remains the same since we use user ID to fetch from Firestore
        const userRef = db.collection('users').doc(state.currentUser.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            state.favorites = new Set(userData.favorites || []);
            console.log(`Loaded ${state.favorites.size} favorites`);
        }
    } catch (error) {
        console.error('Error loading user favorites:', error);
    }
}

// Hide all loading indicators
function hideAllLoading() {
    Object.values(elements.loading).forEach(loadingEl => {
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Navigation
    if (elements.navButtons.home) {
        elements.navButtons.home.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage('home');
        });
    }
    
    if (elements.navButtons.categories) {
        elements.navButtons.categories.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage('categories');
        });
    }
    
    if (elements.navButtons.favorites) {
        elements.navButtons.favorites.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage('favorites');
        });
    }
    
    if (elements.navButtons.cart) {
        elements.navButtons.cart.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage('cart');
        });
    }
    
    if (elements.navButtons.profile) {
        elements.navButtons.profile.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage('profile');
        });
    }

    // Search button
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const searchInput = document.querySelector('.search-bar input');
            if (searchInput && searchInput.value.trim()) {
                alert(`Searching for: ${searchInput.value.trim()}`);
            } else {
                alert('Please enter a search term');
            }
        });
    }
    
    // Profile form submission
    if (elements.profile.form) {
        elements.profile.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = elements.profile.nameInput.value.trim();
            const phone = elements.profile.phoneInput.value.trim();
            
            if (!name || !phone) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                // Update user profile in Firestore
                const userRef = db.collection('users').doc(state.currentUser.uid);
                await userRef.update({
                    name: name,
                    phone: phone
                });
                
                // Update current state
                state.currentUser.profile = { name, phone };
                
                // Update UI
                elements.profile.name.textContent = name;
                elements.profile.phone.textContent = phone;
                
                alert('Profile updated successfully!');
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Error updating profile. Please try again.');
            }
        });
    }
    
    // Admin event listeners
    if (elements.admin.addProductBtn) {
        elements.admin.addProductBtn.addEventListener('click', () => {
            // Add product functionality
            alert('Add product form would open here');
        });
    }
}

// Switch between pages
function switchPage(page) {
    console.log('Switching to page:', page);
    
    // Check if user is admin and trying to access admin page
    if (page === 'admin' && state.userRole !== 'admin') {
        alert('Access denied! Admin privileges required.');
        return;
    }
    
    // Hide all pages
    Object.values(elements.pages).forEach(pageEl => {
        if (pageEl) {
            pageEl.classList.add('hidden');
        }
    });

    // Remove active class from all nav buttons
    Object.values(elements.navButtons).forEach(button => {
        if (button) {
            button.classList.remove('active-tab');
        }
    });

    // Show selected page
    if (elements.pages[page]) {
        elements.pages[page].classList.remove('hidden');
    }
    state.currentPage = page;

    // Update active nav button
    if (elements.navButtons[page]) {
        elements.navButtons[page].classList.add('active-tab');
    }

    // Special handling for product detail page
    if (page === 'productDetail' && state.currentProduct) {
        renderProductDetailPage();
    }
    
    // Reload favorites when switching to favorites page
    if (page === 'favorites') {
        renderFavoritesPage();
    }
    
    // Reload admin page when switching to admin page
    if (page === 'admin') {
        renderAdminPage();
    }
    
    // Reload profile when switching to profile page
    if (page === 'profile') {
        renderProfilePage();
    }
}

// Render Home Page
function renderHomePage() {
    console.log('Rendering home page...');
    
    const productsGrid = document.getElementById('products-grid');
    const categoriesGrid = document.getElementById('categories-grid');
    
    if (!productsGrid || !categoriesGrid) {
        console.error('Required elements not found for home page');
        return;
    }
    
    // Render products
    productsGrid.innerHTML = '';
    state.products.slice(0, 6).forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    // Render categories
    categoriesGrid.innerHTML = '';
    state.categories.slice(0, 6).forEach(category => {
        const categoryCard = createCategoryCard(category);
        categoriesGrid.appendChild(categoryCard);
    });
}

// Render Categories Page
function renderCategoriesPage() {
    console.log('Rendering categories page...');
    
    const allCategoriesGrid = document.getElementById('all-categories-grid');
    const loadingElement = elements.loading.categories;
    
    if (!allCategoriesGrid) {
        console.error('Categories grid element not found');
        return;
    }
    
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    allCategoriesGrid.innerHTML = '';
    state.categories.forEach(category => {
        const categoryCard = createCategoryCard(category);
        allCategoriesGrid.appendChild(categoryCard);
    });
}

// Render Product Detail Page
function renderProductDetailPage() {
    console.log('Rendering product detail page...');
    
    const product = state.currentProduct;
    if (!product) return;

    // Reset image index
    state.productImageIndex = 0;

    // Update product image
    const productImageMain = document.getElementById('product-image-main');
    if (productImageMain) {
        productImageMain.src = product.imageUrls?.[0] || 'https://placehold.co/400x300';
    }

    // Update image indicators
    const indicators = document.getElementById('image-indicators');
    if (indicators) {
        indicators.innerHTML = '';
        const imageUrls = product.imageUrls || [];
        imageUrls.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
            indicators.appendChild(indicator);
        });
    }

    // Update product info
    const productName = document.getElementById('product-name');
    if (productName) productName.textContent = product.name || 'Unnamed Product';
    
    const price = product.price || 0;
    const discount = product.discount || 0;
    const discountedPrice = price * (1 - (discount / 100));
    
    const priceDiscounted = document.getElementById('product-price-discounted');
    if (priceDiscounted) priceDiscounted.textContent = `$${discountedPrice.toFixed(2)}`;
    
    const priceOriginal = document.getElementById('price-original');
    const productDiscount = document.getElementById('product-discount');
    
    if (discount > 0) {
        if (priceOriginal) priceOriginal.textContent = `$${price.toFixed(2)}`;
        if (productDiscount) productDiscount.textContent = `-${discount}%`;
    } else {
        if (priceOriginal) priceOriginal.textContent = '';
        if (productDiscount) productDiscount.textContent = '';
    }
    
    const productDescription = document.getElementById('product-description');
    if (productDescription) productDescription.textContent = product.description || 'No description available';

    // Setup buy button
    const buyButton = document.getElementById('buy-button');
    if (buyButton) {
        buyButton.onclick = () => {
            if (product.buyLink) {
                window.open(product.buyLink, '_blank');
            } else {
                alert('Buy link not available for this product');
            }
        };
    }
}

// Render Favorites Page
function renderFavoritesPage() {
    console.log('Rendering favorites page...');
    
    const favoritesGrid = document.getElementById('favorites-grid');
    const loadingElement = elements.loading.favorites;
    
    if (!favoritesGrid) {
        console.error('Favorites grid element not found');
        return;
    }
    
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    favoritesGrid.innerHTML = '';
    
    const favoriteProducts = state.products.filter(product => 
        state.favorites.has(product.id)
    );
    
    if (favoriteProducts.length === 0) {
        favoritesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>No Favorites Yet</h3>
                <p>Start adding products to your favorites</p>
            </div>
        `;
        return;
    }
    
    favoriteProducts.forEach(product => {
        const productCard = createProductCard(product);
        favoritesGrid.appendChild(productCard);
    });
}

// Render Profile Page
function renderProfilePage() {
    console.log('Rendering profile page...');
    
    if (!state.currentUser.profile) {
        return;
    }
    
    elements.profile.name.textContent = state.currentUser.profile.name || 'Unknown User';
    elements.profile.phone.textContent = state.currentUser.profile.phone || 'Not provided';
    elements.profile.nameInput.value = state.currentUser.profile.name || '';
    elements.profile.phoneInput.value = state.currentUser.profile.phone || '';
}

// Render Admin Page
function renderAdminPage() {
    console.log('Rendering admin page...');
    
    if (!elements.admin.productsTable) {
        console.error('Admin products table element not found');
        return;
    }
    
    elements.admin.productsTable.innerHTML = '';
    
    state.products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name || 'Unnamed Product'}</td>
            <td>$${(product.price || 0).toFixed(2)}</td>
            <td>${product.discount || 0}%</td>
            <td class="admin-actions">
                <button class="admin-action-btn edit-btn" data-id="${product.id}">Edit</button>
                <button class="admin-action-btn delete-btn" data-id="${product.id}">Delete</button>
            </td>
        `;
        elements.admin.productsTable.appendChild(row);
    });
    
    // Add event listeners for edit/delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-id');
            alert(`Edit product with ID: ${productId}`);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const productId = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this product?')) {
                try {
                    await db.collection('products').doc(productId).delete();
                    // Reload data and page
                    await loadData();
                    if (state.currentPage === 'admin') {
                        renderAdminPage();
                    }
                    alert('Product deleted successfully');
                } catch (error) {
                    console.error('Error deleting product:', error);
                    alert('Error deleting product. Please try again.');
                }
            }
        });
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

// Create Category Card
function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
        <div class="category-icon">
            <i class="${category.icon || 'fas fa-folder'}"></i>
        </div>
        <div class="category-name">${category.name || 'Unnamed'}</div>
    `;
    
    card.addEventListener('click', () => {
        alert(`Filtering by category: ${category.name || 'Unnamed'}`);
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
        
        // If we're on favorites page, re-render it
        if (state.currentPage === 'favorites') {
            renderFavoritesPage();
        }
        
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

// Update Cart Count
function updateCartCount() {
    const count = Object.values(state.cart).reduce((sum, item) => sum + (item.count || 0), 0);
    const cartCountElement = document.getElementById('nav-cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
}

// Start Carousel
function startCarousel() {
    const carousel = document.getElementById('carousel');
    if (!carousel) return;
    
    setInterval(() => {
        state.carouselIndex = (state.carouselIndex + 1) % 3;
        carousel.style.transform = `translateX(-${state.carouselIndex * 100}%)`;
    }, 5000);
}

// Initialize the app when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
