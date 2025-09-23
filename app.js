const productList = document.getElementById('product-list'); 
const searchInput = document.getElementById('search');
const sortBtn = document.getElementById('sortBtn');
const darkModeToggle = document.getElementById('darkMode');

let products = [];
let sortedASC = true;
let cartCount = 0;
let cartItems = [];

// Fetch products
async function fetchProducts() {
    const res = await fetch('http://localhost:3000/products');
    products = await res.json();
    renderProducts(products);
}

// Render products
function renderProducts(data) {
    productList.innerHTML = "";
    data.forEach(p => {
        const div = document.createElement("div");
        div.className = "card";
        div.id = `product-${p.id}`;
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
                    <button type="submit">Select Vendors</button>
                </form>
            </div>
            <div class="vendor-section" id="vendor-section-${p.id}"></div>
        `;

        // Form submit: show vendors
        div.querySelector(".qty-form").addEventListener("submit", (e) => {
            e.preventDefault();
            renderVendors(p);
        });

        productList.appendChild(div);
    });
}

// Render vendors for a product
function renderVendors(product) {
    const vendorContainer = document.getElementById(`vendor-section-${product.id}`);
    const form = document.querySelector(`#product-${product.id} .qty-form`);
    const qtyInput = form.querySelector("input");
    const unitSelect = form.querySelector("select");
    const qty = parseFloat(qtyInput.value) || 1;

    vendorContainer.innerHTML = `<h4>Vendors for ${product.name}</h4>`;

    product.vendors.forEach((v, index) => {
        const div = document.createElement('div');
        div.className = 'vendor';
        const totalPrice = v.price * qty;
        div.innerHTML = `
            <input type="radio" name="selected-vendor-${product.id}" id="vendor-${product.id}-${index}" value="${v.name}">
            <label for="vendor-${product.id}-${index}">
                <strong>${v.name}</strong> - KES ${v.price} | Total: KES <span id="total-${product.id}-${index}">${totalPrice}</span> | Stock: <span id="stock-${product.id}-${index}">${v.stock}</span>
            </label>
        `;
        vendorContainer.appendChild(div);
    });

    // Update totals live when quantity changes
    qtyInput.oninput = () => {
        const newQty = parseFloat(qtyInput.value) || 1;
        product.vendors.forEach((v, index) => {
            const totalSpan = document.getElementById(`total-${product.id}-${index}`);
            totalSpan.textContent = v.price * newQty;
        });
    };

    // Add to cart button
    let addBtn = vendorContainer.querySelector('.add-vendor-btn');
    if (!addBtn) {
        addBtn = document.createElement('button');
        addBtn.className = 'add-vendor-btn';
        addBtn.textContent = "Add Selected Vendor to Cart";
        vendorContainer.appendChild(addBtn);
    }

    addBtn.onclick = () => {
        const selected = vendorContainer.querySelector(`input[name="selected-vendor-${product.id}"]:checked`);
        if (!selected) {
            alert("Please select a vendor!");
            return;
        }

        const vendorName = selected.value;
        const vendorObj = product.vendors.find(v => v.name === vendorName);
        const qtyVal = parseFloat(qtyInput.value) || 1;
        const unitVal = unitSelect.value;

        if (qtyVal > vendorObj.stock) {
            alert("Not enough stock for this vendor!");
            return;
        }

        // Deduct stock
        vendorObj.stock -= qtyVal;
        document.getElementById(`stock-${product.id}-${product.vendors.indexOf(vendorObj)}`).textContent = vendorObj.stock;

        // Add to cart
        cartCount++;
        cartItems.push({ name: product.name, qty: qtyVal, unit: unitVal, vendor: vendorName });
        document.getElementById("cart-count").textContent = cartCount;
        updateCartDropdown();

        // Reset radio selection
        selected.checked = false;

        // Confirmation message
        const msg = document.createElement('div');
        msg.textContent = "Added to cart!";
        msg.style.color = "green";
        msg.style.fontSize = "12px";
        vendorContainer.appendChild(msg);
        setTimeout(() => msg.remove(), 1500);
    };
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

    // Summary
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

// Sort toggle
sortBtn.addEventListener("click", () => {
    const sorted = [...products].sort((a, b) => {
        const priceA = Math.min(...a.vendors.map(v => v.price));
        const priceB = Math.min(...b.vendors.map(v => v.price));
        return sortedASC ? priceA - priceB : priceB - priceA;
    });
    sortedASC = !sortedASC;
    renderProducts(sorted);
});

// Dark mode toggle
darkModeToggle.addEventListener("change", e => {
    document.body.classList.toggle("dark", e.target.checked);
});

// Navbar alerts
document.getElementById('signupBtn').addEventListener("click", () => alert("Signup feature coming soon!"));
document.getElementById('categoriesBtn').addEventListener("click", () => alert("Categories feature coming soon!"));
document.getElementById('contactBtn').addEventListener("click", () => alert("Contact Us feature coming soon!"));

fetchProducts();
