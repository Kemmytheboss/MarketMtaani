const productList = document.getElementById('product-list');
const cartList = document.getElementById("cart-items");
const cartBtn = document.getElementById("cart-btn");
const cartDropdown = document.getElementById("cart-dropdown");
const vendorPanel = document.getElementById("vendor-panel");
const vendorContent = document.getElementById("vendor-content");
const closeVendorBtn = document.getElementById("close-vendor");
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const signupSection = document.getElementById("signup-section");
const loginSection = document.getElementById("login-section");
const toLogin = document.getElementById("to-login");
const toSignup = document.getElementById("to-signup");
const logout = document.getElementById("logout");
const userMenu = document.getElementById("user-menu");
const userIcon = document.getElementById("user-icon");
const userDropDown = document.getElementById("user-dropdown");
// const authModal = document.getElementById("auth-modal");
// const authTitle = document.getElementById("auth-title");
// const authForm = document.getElementById("auth-form");
// const closeAuth = document.getElementById("close-auth");
const darkModeBtn = document.getElementById("dark-mode-toggle");

let products = [];
let cartItems = [];
let islLogin = false;

// Fetch products from db.json
async function fetchProducts() {
  const res = await fetch("http://localhost:3000/products");
  products = await res.json();
  renderProducts(products);
}

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

// ----------------- SEARCH FUNCTIONALITY -------------------
const searchInput = document.getElementById("search");

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();

  if (query === "") {
    renderProducts(products); // show all if search empty
  } else {
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    );
    renderProducts(filtered);
  }
});

/* ----------------- GEOLOCATION ------------------- */

// Get user location
function getUserLocation(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        callback(position.coords.latitude, position.coords.longitude);
      },
      error => {
        console.error("Geolocation error:", error.message);
        alert("Please enable location to see nearest vendors.");
        callback(null, null);
      }
    );
  } else {
    alert("Geolocation not supported in this browser.");
    callback(null, null);
  }
}

// Calculate distance (Haversine formula)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function findNearestVendor(userLat, userLng, vendors) {
  let nearest = null;
  let minDist = Infinity;

  vendors.forEach(v => {
    if (v.lat && v.lng) {
      const dist = getDistance(userLat, userLng, v.lat, v.lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = { ...v, distance: dist };
      }
    }
  });
  return nearest;
}

/* ----------------- VENDOR PANEL ------------------- */

function showVendors(product) {
  vendorContent.innerHTML = "<p>Loading vendors...</p>";

  getUserLocation((userLat, userLng) => {
    vendorContent.innerHTML = "";

    product.vendors.forEach(vendor => {
      let distanceText = "";
      if (userLat && userLng) {
        const dist = getDistance(userLat, userLng, vendor.lat, vendor.lng).toFixed(2);
        distanceText = ` | ${dist} km away`;
      }

      const vendorDiv = document.createElement("div");
      vendorDiv.className = "vendor";
      vendorDiv.innerHTML = `
        <p><strong>${vendor.name}</strong> - KES ${vendor.price}${distanceText}</p>
        <input type="number" min="1" value="1" class="qty-input">
        <div class="unit-buttons">
          <button class="unit-btn" data-unit="pcs">Pieces</button>
          <button class="unit-btn" data-unit="kg">Kgs</button>
        </div>
        <button class="add-cart-btn">Add to Cart</button>
      `;

      // Add to cart event
      vendorDiv.querySelector(".add-cart-btn").addEventListener("click", () => {
        const qty = parseFloat(vendorDiv.querySelector(".qty-input").value) || 1;
        const unit = vendorDiv.querySelector(".unit-btn.active")?.dataset.unit || "pcs";

        cartItems.push({
          product: product.name,
          vendor: vendor.name,
          price: vendor.prices[unit],
          qty,
          unit
        });
        updateCart();
        // shows alert for confirmation
          alert(`${qty} ${unit} of ${product.name} from ${vendor.name} added to cart!`);

      });


      // Unit selection buttons
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
        const vendorDivs = vendorContent.querySelectorAll(".vendor");
        vendorDivs.forEach(div => {
          if (div.textContent.includes(nearest.name)) {
            div.style.background = "#c8facc";
          }
        });
      }
    }
  });

  vendorPanel.classList.add("open");
}

closeVendorBtn.addEventListener("click", () => {
  vendorPanel.classList.remove("open");
});

/* ----------------- CART ------------------- */

function updateCart() {
  // Update count by actual cart length
  document.getElementById("cart-count").textContent = cartItems.length;
  cartList.innerHTML = "";

  let total = 0;

  if (cartItems.length === 0) {
    const emptyMsg = document.createElement("li");
    emptyMsg.textContent = "Your cart is empty.";
    cartList.appendChild(emptyMsg);
    return; // stop here if no items
  }

  cartItems.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const li = document.createElement("li");
    li.innerHTML = `
      ${item.product} - ${item.qty} ${item.unit} | ${item.vendor} | KES ${itemTotal}
      <button class="remove-btn" data-index="${index}">❌</button>
    `;

    // remove item on click
    li.querySelector(".remove-btn").addEventListener("click", () => {
      cartItems.splice(index, 1);
      updateCart();
    });

    cartList.appendChild(li);
  });

  // add total summary
  const summary = document.createElement("li");
  summary.innerHTML = `<strong>Total: KES ${total}</strong>`;
  summary.style.borderTop = "1px solid #ccc";
  summary.style.paddingTop = "5px";
  cartList.appendChild(summary);
}


cartBtn.addEventListener("click", () => {
  cartDropdown.style.display = cartDropdown.style.display === "block" ? "none" : "block";
});

/* ----------------- INIT ------------------- */
fetchProducts();

// ----------------- INTRO BUTTONS -------------------
const shopNowBtn = document.getElementById("shop-now-btn");

// Shop Now scrolls to product list
shopNowBtn.addEventListener("click", () => {
  document.getElementById("products-section").scrollIntoView({ behavior: "smooth" });
});

// Load preference from localStorage
if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
}

darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  // Save preference
  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("darkMode", "enabled");
    darkModeBtn.textContent = "☀️ Light Mode";
  } else {
    localStorage.setItem("darkMode", "disabled");
    darkModeBtn.textContent = "🌙 Dark Mode";
  }
});


// Show signup form
signupBtn.addEventListener("click", () => {
  signupSection.style.display = "block";
  loginSection.style.display = "none";
  signupSection.scrollIntoView({ behavior: "smooth" });
});

// Show login form
loginBtn.addEventListener("click", () => {
  loginSection.style.display = "block";
  signupSection.style.display = "none";
  loginSection.scrollIntoView({ behavior: "smooth" });
});

// Toggle links inside forms
toLogin.addEventListener("click", () => {
  signupSection.style.display = "none";
  loginSection.style.display = "block";
});

toSignup.addEventListener("click", () => {
  signupSection.style.display = "block";
  loginSection.style.display = "none";
});

// Signup form submit
document.getElementById("signup-form").addEventListener("submit", e => {
  e.preventDefault();
  isLoggedIn = true;
  updateNavbar();
  alert("Signup successful!");
});

// Login form submit
document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  isLoggedIn = true;
  updateNavbar();
  alert("Login successful!");
});

// Update navbar based on login state
function updateNavbar() {
  if(isLoggedIn){
    signupBtn.style.display = "none";
    loginBtn.style.display = "none";
    userMenu.style.display = "inline-block";
    signupSection.style.display = "none";
    loginSection.style.display = "none";
  } else {
    signupBtn.style.display = "inline-block";
    loginBtn.style.display = "inline-block";
    userMenu.style.display = "none";
  }
}

// User dropdown toggle
userIcon.addEventListener("click", () => {
  userDropdown.style.display = userDropdown.style.display === "block" ? "none" : "block";
});

// Logout
logout.addEventListener("click", () => {
  isLoggedIn = false;
  updateNavbar();
  alert("You have logged out!");
  userDropdown.style.display = "none";
});

// Close dropdown if clicked outside
window.addEventListener("click", (e) => {
  if(!userIcon.contains(e.target) && !userDropdown.contains(e.target)){
    userDropdown.style.display = "none";
  }
});

// Initialize navbar state
updateNavbar();