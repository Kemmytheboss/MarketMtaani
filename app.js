const productList = document.getElementById('product-list');
const vendorList = document.getElementById('vendor-list'); // 👈 create this div in HTML

async function fetchProducts() {
    const res = await fetch('http://localhost:3000/products');
    products = await res.json(); // save to global products array
    renderProducts(products);
}

// render products
function renderProducts(data) {
    productList.innerHTML = "";
    vendorList.innerHTML = ""; // clear vendors when re-rendering products

    data.forEach(p => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
            <img src="${p.image}" alt="${p.name}" width="100">
            <h3>${p.name}</h3>
        `;
        
        // 👇 Add click listener to show vendors
        div.addEventListener("click", () => renderVendors(p));
        
        productList.appendChild(div);
    });
}

// render vendors for a product
function renderVendors(product) {
    vendorList.innerHTML = `<h2>${product.name} Vendors</h2>`;
    product.vendors.forEach(v => {
        const div = document.createElement("div");
        div.className = "vendor-card";
        div.innerHTML = `
            <p><strong>${v.name}</strong></p>
            <p>Price: KES ${v.price}</p>
        `;
        vendorList.appendChild(div);
    });
}

fetchProducts();
