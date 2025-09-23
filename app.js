const productList = document.getElementById('product-list'); 
const searchInput = document.getElementById('search');
const sortBtn = document.getElementById('sortBtn');
const darkModeToggle = document.getElementById('darkMode');

let products = [];
let sortedASC = true;
let cartCount = 0;
let cartItems = [];

// Fetch products from json-server
async function fetchProducts() {
    const res = await fetch('http://localhost:3000/products');
    products = await res.json();
    renderProducts(products);
}

// Render product cards
function renderProducts(data) {
    productList.innerHTML = "";
    data.forEach(p => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
            <div class="product-info">
                <img src="${p.image}" alt="${p.name}">
                <h3>${p.name}</h3>
                <form class="qty-form">
                    <div class="qty-unit">
                        <label>Quantity:</label>
                        <input type="number" min="1" value="1" required>
                        <select>
                            <option value="pcs">Pieces</option>
                            <option value="kg">Kgs</option>
                        </select>
                    </div>
                    <button type="submit">Add to Cart</button>
                </form>
            </div>
            <div class="vendor-section" id="vendor-section-${p.id}">
                <!-- Vendor info will load here -->
            </div>
        `;

        // Click product to show vendors inline
        div.addEventListener('click', (e) => {
            if (!e.target.closest(".qty-form")) {
                const form = div.querySelector(".qty-form");
                const qty = parseFloat(form.querySelector("input").value);
                const unit = form.querySelector("select").value;
                renderVendors(p, qty, unit);
            }
        });

        // Handle "Add to Cart" button click to show vendor selection
        div.querySelector(".qty-form").addEventListener("submit", (e) => {
            e.preventDefault();
            const qty = parseFloat(e.target.querySelector("input").value);
            const unit = e.target.querySelector("select").value;
            renderVendors(p, qty, unit);
        });

        productList.appendChild(div);
    });
}

// Render vendors inline
function renderVendors(product, qty = 1, unit = 'pcs') {
    const vendorContainer = document.getElementById(`vendor-section-${product.id}`);
    vendorContainer.innerHTML = `<h4>Vendors for ${product.name}</h4>`;

    product.vendors.forEach((v, index) => {
        const div = document.createElement('div');
        div.className = 'vendor';
        let totalPrice = v.price * qty;
        const disabled = qty > v.stock ? 'disabled' : '';

        div.innerHTML = `
            <input type="radio" name="selected-vendor-${product.id}" id="vendor-${product.id}-${index}" value="${v.name}" ${disabled}>
            <label for="vendor-${product.id}-${index}">
                <strong>${v.name}</strong> - KES ${v.price} | Total: KES ${totalPrice} | Stock: ${v.stock}
            </label>
        `;
        vendorContainer.appendChild(div);
    });

    const addBtn = document.createElement('button');
    addBtn.textContent = "Add Selected Vendor to Cart";
    addBtn.addEventListener('click', () => {
        const selected = vendorContainer.querySelector(`input[name="selected-vendor-${product.id}"]:checked`);
        if (!selected) {
            alert("Please select a vendor!");
            return;
        }

        const vendorName = selected.value;
        const vendorObj = product.vendors.find(v => v.name === vendorName);

        if (qty > vendorObj.stock) {
            alert("Not enough stock for this vendor!");
            return;
        }

        vendorObj.stock -= qty;

        cartCount++;
        cartItems.push({
            name: product.name,
            qty,
            unit,
            vendor: vendorName
        });

        document.getElementById("cart-count").textContent = cartCount;
        updateCartDropdown();

        vendorContainer.innerHTML = ""; // hide after adding
    });

    vendorContainer.appendChild(addBtn);
}

// Update cart dropdown
function updateCartDropdown() {
    const cartList = document.getElementById("cart-items");
    cartList.innerHTML = "";

    let totalItems = 0;
    let totalAmount = 0;

    cartItems.forEach(item => {
        totalItems += parseFloat(item.qty);
        const product = products.find(p => p.name === item.name);
        const vendor = product.vendors.find(v => v.name === item.vendor);
        const itemTotal = vendor.price * item.qty;
        totalAmount += itemTotal;

        const li = document.createElement("li");
        li.textContent = `${item.name} - ${item.qty} ${item.unit} | Vendor: ${item.vendor} | Total: KES ${itemTotal}`;
        cartList.appendChild(li);
    });

    const summary = document.createElement("li");
    summary.innerHTML = `<strong>Total Products: ${totalItems}</strong> | <strong>Total Amount: KES ${totalAmount}</strong>`;
    summary.style.borderBottom = "1px solid #ccc";
    summary.style.paddingBottom = "5px";
    cartList.prepend(summary);
}

// Toggle cart dropdown
document.getElementById("cart-btn").addEventListener("click", () => {
    const dropdown = document.getElementById("cart-dropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
});

// Search filter
searchInput.addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    renderProducts(filtered);
});

// Sort toggle by vendor price
sortBtn.addEventListener("click", () => {
    const sorted = [...products].sort((a, b) => {
        const priceA = Math.min(...a.vendors.map(v => v.price));
        const priceB = Math.min(...b.vendors.map(v => v.price));
        return sortedASC ? priceA - priceB : priceB - priceA;
    });
    sortedASC = !sortedASC;
    renderProducts(sorted);
});

// Dark mode
darkModeToggle.addEventListener("change", e => {
    document.body.classList.toggle("dark", e.target.checked);
});

// Dummy alerts
document.getElementById('signupBtn').addEventListener("click", () => alert("Signup feature coming soon!"));
document.getElementById('categoriesBtn').addEventListener("click", () => alert("Categories feature coming soon!"));
document.getElementById('contactBtn').addEventListener("click", () => alert("Contact Us feature coming soon!"));

fetchProducts();
