// App State
const state = {
  currentPage: 'home',
  favorites: new Set(),
  cart: {},
  carouselIndex: 0
};

// DOM Elements
const elements = {
  app: document.getElementById('app'),
  navButtons: document.querySelectorAll('.nav-btn'),
  carousel: null
};

// Sample Data
const sampleProducts = [
  { id: 1, name: "Product A", price: 50, discount: 10, image: "https://via.placeholder.com/150" },
  { id: 2, name: "Product B", price: 80, discount: 15, image: "https://via.placeholder.com/150" },
  { id: 3, name: "Product C", price: 120, discount: 20, image: "https://via.placeholder.com/150" },
  { id: 4, name: "Product D", price: 200, discount: 25, image: "https://via.placeholder.com/150" }
];

// Render Functions
function renderPage(page) {
  state.currentPage = page;
  elements.app.innerHTML = '';

  switch(page) {
    case 'home':
      renderHomePage();
      break;
    case 'categories':
      renderCategoriesPage();
      break;
    case 'favorites':
      renderFavoritesPage();
      break;
    case 'cart':
      renderCartPage();
      break;
  }
  updateActiveNav();
}

// Home Page
function renderHomePage() {
  elements.app.innerHTML = `
    <div class="p-4 space-y-4">
      <h2 class="text-xl font-bold">Carousel</h2>
      <div id="carousel" class="flex overflow-hidden rounded-lg shadow-md">
        ${sampleProducts.map(p => `
          <div class="min-w-full">
            <img src="${p.image}" alt="${p.name}" class="w-full h-48 object-cover">
          </div>
        `).join('')}
      </div>

      <h2 class="text-xl font-bold">Top Products</h2>
      <div class="grid grid-cols-2 gap-4">
        ${sampleProducts.map(p => `
          <div class="bg-white p-2 rounded-lg shadow">
            <img src="${p.image}" alt="${p.name}" class="w-full h-32 object-cover rounded">
            <h3 class="font-medium mt-2">${p.name}</h3>
            <p class="text-sm text-gray-600">
              <span class="line-through">$${p.price}</span>
              <span class="text-red-500 font-bold">$${(p.price * (1 - p.discount/100)).toFixed(2)}</span>
            </p>
            <button class="like-button" data-product-id="${p.id}">
              <i class="far fa-heart text-red-500"></i>
            </button>
            <button class="add-cart-button bg-blue-500 text-white px-2 py-1 rounded mt-1" data-product-id="${p.id}">Add to Cart</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  elements.carousel = document.getElementById('carousel');
  attachProductEventListeners();
}

// Categories Page
function renderCategoriesPage() {
  elements.app.innerHTML = `
    <div class="p-4">
      <h2 class="text-xl font-bold">Categories</h2>
      <div class="grid grid-cols-2 gap-4 mt-4">
        <div class="bg-white p-4 rounded-lg shadow text-center">Electronics</div>
        <div class="bg-white p-4 rounded-lg shadow text-center">Clothing</div>
        <div class="bg-white p-4 rounded-lg shadow text-center">Home</div>
        <div class="bg-white p-4 rounded-lg shadow text-center">Sports</div>
      </div>
    </div>
  `;
}

// Favorites Page
function renderFavoritesPage() {
  const favoriteProducts = sampleProducts.filter(p => state.favorites.has(String(p.id)));

  elements.app.innerHTML = `
    <div class="p-4">
      <h2 class="text-xl font-bold">Favorites</h2>
      <div class="grid grid-cols-2 gap-4 mt-4">
        ${favoriteProducts.length ? favoriteProducts.map(p => `
          <div class="bg-white p-2 rounded-lg shadow">
            <img src="${p.image}" alt="${p.name}" class="w-full h-32 object-cover rounded">
            <h3 class="font-medium mt-2">${p.name}</h3>
            <p class="text-sm text-gray-600">
              <span class="line-through">$${p.price}</span>
              <span class="text-red-500 font-bold">$${(p.price * (1 - p.discount/100)).toFixed(2)}</span>
            </p>
          </div>
        `).join('') : '<p>No favorites yet.</p>'}
      </div>
    </div>
  `;
}

// Cart Page
function renderCartPage() {
  const cartItems = Object.values(state.cart);

  elements.app.innerHTML = `
    <div class="p-4">
      <h2 class="text-xl font-bold">Cart</h2>
      <div class="mt-4 bg-white rounded-lg shadow p-4">
        ${cartItems.length ? cartItems.map(item => `
          <div class="flex justify-between items-center mb-2">
            <span>${item.name} x${item.quantity}</span>
            <span class="font-semibold">$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('') : '<p>Your cart is empty.</p>'}
      </div>
    </div>
  `;
}

// Helpers
function attachProductEventListeners() {
  document.querySelectorAll('.like-button').forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.getAttribute('data-product-id');
      if (state.favorites.has(productId)) {
        state.favorites.delete(productId);
      } else {
        state.favorites.add(productId);
      }
      updateFavoriteButtons();
    });
  });

  document.querySelectorAll('.add-cart-button').forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.getAttribute('data-product-id');
      const product = sampleProducts.find(p => p.id == productId);
      if (!state.cart[productId]) {
        state.cart[productId] = { ...product, quantity: 1 };
      } else {
        state.cart[productId].quantity++;
      }
      updateCartCount();
    });
  });
}

// Update Nav Active State
function updateActiveNav() {
  elements.navButtons.forEach(btn => {
    if (btn.dataset.page === state.currentPage) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
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
  const count = Object.values(state.cart).reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('nav-cart-count').textContent = count;
}

// Carousel Auto Slide
function startCarousel() {
  const carousel = elements.carousel;
  const items = carousel.children;
  setInterval(() => {
    state.carouselIndex = (state.carouselIndex + 1) % items.length;
    carousel.style.transform = `translateX(-${state.carouselIndex * 100}%)`;
  }, 3000);
}

// Event Listeners
elements.navButtons.forEach(button => {
  button.addEventListener('click', () => {
    renderPage(button.dataset.page);
  });
});

// Init
renderPage('home');
startCarousel();
