const productList = document.getElementById('product-list');
const cartList = document.getElementById("cart-items");
const cartBtn = document.getElementById("cart-btn");
const cartDropdown = document.getElementById("cart-dropdown");
const vendorPanel = document.getElementById("vendor-panel");
const vendorContent = document.getElementById("vendor-content");
const closeVendorBtn = document.getElementById("close-vendor");

let products = [];
let cartItems = [];
let cartCount = 0;

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

/* ----------------- GEOLOCATION ------------------- */

// Get user location
function getUserLocation(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        callback(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
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
          price: vendor.price,
          qty,
          unit
        });
        cartCount++;
        updateCart();
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
  document.getElementById("cart-count").textContent = cartCount;
  cartList.innerHTML = "";

  let total = 0;

  cartItems.forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const li = document.createElement("li");
    li.textContent = `${item.product} - ${item.qty} ${item.unit} | ${item.vendor} | KES ${itemTotal}`;
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

/* ----------------- INIT ------------------- */
fetchProducts();
/* ----------------- HERO SLIDER ------------------- */
const heroSlidesContainer = document.getElementById("heroSlides");
const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");

const heroImages = [
  { src: "images/Tomato_je.jpg", name: "Tomatoes" },
  { src: "images/potatoes.PNG", name: "Potatoes" },
  { src: "images/RedOnion.PNG", name: "Onions" },
  { src: "images/grapes.PNG", name: "Grapes" },
  { src: "images/cabbage.PNG", name: "Cabbage" },
  { src: "images/Collard-Greens-Bundle.jpg", name: "Kales (Sukuma Wiki)" },
  { src: "images/mangoes.PNG", name: "Mangoes" }
];

// Render slides
heroSlidesContainer.innerHTML = heroImages.map((img, i) => `
  <div class="slide ${i === 0 ? "active" : ""}">
    <img src="${img.src}" alt="${img.name}">
    <div class="hero-text"><h2>${img.name}</h2></div>
  </div>
`).join("");

let slideIndex = 0;
const slides = document.querySelectorAll(".slide");

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.style.display = i === index ? "block" : "none";
  });
}

// Navigation
function nextSlide() {
  slideIndex = (slideIndex + 1) % slides.length;
  showSlide(slideIndex);
}
function prevSlide() {
  slideIndex = (slideIndex - 1 + slides.length) % slides.length;
  showSlide(slideIndex);
}

nextBtn.addEventListener("click", nextSlide);
prevBtn.addEventListener("click", prevSlide);

// Auto slide every 5s
setInterval(nextSlide, 5000);

// Show first slide
showSlide(slideIndex);
