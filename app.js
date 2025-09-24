const productList = document.getElementById('product-list');
const cartList = document.getElementById("cart-items");
const cartBtn = document.getElementById("cart-btn");
const cartDropdown = document.getElementById("cart-dropdown");
const vendorPanel = document.getElementById("vendor-panel");
const vendorContent = document.getElementById("vendor-content");
const closeVendorBtn = document.getElementById("close-vendor");

let products = [];
let cartItems = [];

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