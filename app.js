// ================= Elements =================
const productList = document.getElementById('product-list');
const cartList = document.getElementById("cart-items");
const cartBtn = document.getElementById("cart-btn");
const cartDropdown = document.getElementById("cart-dropdown");
const vendorPanel = document.getElementById("vendor-panel");
const vendorContent = document.getElementById("vendor-content");
const continueBtn = document.getElementById("continue-shopping");
const checkoutBtn = document.getElementById("checkout");

const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const signupSection = document.getElementById("signup-section");
const loginSection = document.getElementById("login-section");
const toLogin = document.getElementById("to-login");
const toSignup = document.getElementById("to-signup");

const darkModeBtn = document.getElementById("dark-mode-toggle");

// ================= State =================
let products = [];
let cartItems = [];
let isLoggedIn = false;

const API_URL = "http://localhost:3000"; // JSON server root

// ================= API HELPER =================
async function apiRequest(endpoint, method = "GET", body = null) {
  try {
    const options = { method, headers: { "Content-Type": "application/json" } };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    // For DELETE, JSON-server returns empty, so skip parsing
    return method === "DELETE" ? {} : await res.json();
  } catch (err) {
    console.error(`${method} ${endpoint} failed:`, err);
    alert(`${method} request failed. See console for details.`);
  }
}

// ================= CRUD =================
// GET products
async function fetchProducts() {
  products = await apiRequest("/products", "GET");
  if (products) renderProducts(products);
}

// POST new product
async function addProduct(product) {
  const newProduct = await apiRequest("/products", "POST", product);
  if (newProduct) {
    products.push(newProduct);
    renderProducts(products);
  }
}

// PATCH update product
async function updateProduct(id, updates) {
  const updated = await apiRequest(`/products/${id}`, "PATCH", updates);
  if (updated) {
    products = products.map(p => (p.id === id ? updated : p));
    renderProducts(products);
  }
}

// DELETE product
async function deleteProduct(id) {
  await apiRequest(`/products/${id}`, "DELETE");
  products = products.filter(p => p.id !== id);
  renderProducts(products);
}

// ================= RENDER PRODUCTS =================
function renderProducts(data) {
  productList.innerHTML = "";
  data.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description || "Fresh and quality products available."}</p>
      <button class="select-vendor-btn">Select Vendor</button>
    `;

    // Open vendor panel
    div.querySelector(".select-vendor-btn").addEventListener("click", () => {
      showVendors(p);
    });

    productList.appendChild(div);
  });
}

// ================= SEARCH =================
document.getElementById("search").addEventListener("input", e => {
  const query = e.target.value.toLowerCase().trim();
  const filtered = query
    ? products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      )
    : products;
  renderProducts(filtered);
});

// ================= GEOLOCATION =================
function getUserLocation(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => callback(pos.coords.latitude, pos.coords.longitude),
      () => callback(null, null)
    );
  } else {
    callback(null, null);
  }
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function findNearestVendor(userLat, userLng, vendors) {
  let nearest = null, minDist = Infinity;
  vendors.forEach(v => {
    if (v.lat && v.lng) {
      const dist = getDistance(userLat, userLng, v.lat, v.lng);
      if (dist < minDist) { minDist = dist; nearest = { ...v, distance: dist }; }
    }
  });
  return nearest;
}

// ================= VENDOR PANEL =================
function showVendors(product) {
  vendorContent.innerHTML = "<p>Loading vendors...</p>";
  getUserLocation((userLat, userLng) => {
    vendorContent.innerHTML = "";

    product.vendors.forEach(vendor => {
      const vendorDiv = document.createElement("div");
      vendorDiv.className = "vendor";
      let distanceText = "";
      if (userLat && userLng) {
        const dist = getDistance(userLat, userLng, vendor.lat, vendor.lng).toFixed(2);
        distanceText = ` | ${dist} km away`;
      }
      vendorDiv.innerHTML = `
        <p><strong>${vendor.name}</strong> - KES ${vendor.prices.pcs}${distanceText}</p>
        <input type="number" min="1" value="1" class="qty-input">
        <div class="unit-buttons">
          <button class="unit-btn active" data-unit="pcs">Pieces</button>
          <button class="unit-btn" data-unit="kg">Kgs</button>
        </div>
        <button class="add-cart-btn">Add to Cart</button>
      `;

      // Add to cart
      vendorDiv.querySelector(".add-cart-btn").addEventListener("click", () => {
        const qty = parseFloat(vendorDiv.querySelector(".qty-input").value) || 1;
        const unit = vendorDiv.querySelector(".unit-btn.active").dataset.unit;
        cartItems.push({
          product: product.name,
          vendor: vendor.name,
          price: vendor.prices[unit],
          qty,
          unit
        });
        updateCart();
        alert(`${qty} ${unit} of ${product.name} from ${vendor.name} added to cart!`);
      });

      // Unit selection
      vendorDiv.querySelectorAll(".unit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          vendorDiv.querySelectorAll(".unit-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });

      vendorContent.appendChild(vendorDiv);
    });

    // Highlight nearest vendor
    if (userLat && userLng) {
      const nearest = findNearestVendor(userLat, userLng, product.vendors);
      if (nearest) {
        vendorContent.querySelectorAll(".vendor").forEach(div => {
          if (div.textContent.includes(nearest.name)) div.style.background = "#c8facc";
        });
      }
    }
  });

  vendorPanel.classList.add("open");
}

// Continue Shopping / Checkout
continueBtn.addEventListener("click", () => vendorPanel.classList.remove("open"));
checkoutBtn.addEventListener("click", () => {
  vendorPanel.classList.remove("open");
  cartDropdown.style.display = "block";
});

// ================= CART =================
function updateCart() {
  document.getElementById("cart-count").textContent = cartItems.length;
  cartList.innerHTML = "";

  if (cartItems.length === 0) {
    const emptyMsg = document.createElement("li");
    emptyMsg.textContent = "Your cart is empty.";
    cartList.appendChild(emptyMsg);
    return;
  }

  let total = 0;
  cartItems.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const li = document.createElement("li");
    li.innerHTML = `
      ${item.product} - ${item.qty} ${item.unit} | ${item.vendor} | KES ${itemTotal}
      <button class="remove-btn" data-index="${index}">❌</button>
    `;
    li.querySelector(".remove-btn").addEventListener("click", () => {
      cartItems.splice(index, 1);
      updateCart();
    });
    cartList.appendChild(li);
  });

  const summary = document.createElement("li");
  summary.innerHTML = `<strong>Total: KES ${total}</strong>`;
  summary.style.borderTop = "1px solid #ccc";
  summary.style.paddingTop = "5px";
  cartList.appendChild(summary);
}

cartBtn.addEventListener("click", () => {
  cartDropdown.style.display = cartDropdown.style.display === "block" ? "none" : "block";
});

// ================= INTRO BUTTONS =================
document.getElementById("shop-now-btn").addEventListener("click", () => {
  document.getElementById("products-section").scrollIntoView({ behavior: "smooth" });
});

// ================= DARK MODE =================
if (localStorage.getItem("darkMode") === "enabled") document.body.classList.add("dark-mode");

darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("darkMode", "enabled");
    darkModeBtn.textContent = "☀️ Light Mode";
  } else {
    localStorage.setItem("darkMode", "disabled");
    darkModeBtn.textContent = "🌙 Dark Mode";
  }
});

// ================= LOGIN / SIGNUP =================
function updateNavbar() {
  if (isLoggedIn) {
    signupBtn.style.display = "none";
    loginBtn.style.display = "none";
    signupSection.style.display = "none";
    loginSection.style.display = "none";
  } else {
    signupBtn.style.display = "inline-block";
    loginBtn.style.display = "inline-block";
  }
}

signupBtn.addEventListener("click", () => {
  signupSection.style.display = "block";
  loginSection.style.display = "none";
  signupSection.scrollIntoView({ behavior: "smooth" });
});

loginBtn.addEventListener("click", () => {
  loginSection.style.display = "block";
  signupSection.style.display = "none";
  loginSection.scrollIntoView({ behavior: "smooth" });
});

toLogin.addEventListener("click", () => {
  signupSection.style.display = "none";
  loginSection.style.display = "block";
});

toSignup.addEventListener("click", () => {
  signupSection.style.display = "block";
  loginSection.style.display = "none";
});

document.getElementById("signup-form").addEventListener("submit", e => {
  e.preventDefault();
  isLoggedIn = true;
  updateNavbar();
  alert("Signup successful!");
});

document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  isLoggedIn = true;
  updateNavbar();
  alert("Login successful!");
});

// ================= INIT =================
updateNavbar();
fetchProducts();
