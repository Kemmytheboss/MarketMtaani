const productList = document.getElementById('product-list');
const searchInput = document.getElementById('search');
const sortBtn = document.getElementById('sortBtn');
const darkModeToggle = document.getElementById('darkMode');
const vendorSection = document.getElementById('vendor-section');
const vendorTitle = document.getElementById('vendor-title');
const vendorList = document.getElementById('vendor-list');

let products = [];
let sortedASC = true;

// fetch data from json-server

async function fetchProducts() {
    const res = await fetch('http://localhost:3000/products');
    products = await res.json();
    renderProducts (products);
}

// render product card

function renderProducts(data) {
    productList.innerHTML = "";
    data.forEach(p => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
                        <img src="${p.image}" alt="${p.name}">
                        <h3> ${p.name} </h3>
                        <p>Click to view vendors</p>`;

                        div.addEventListener('click', () => renderVendors (p));
                        productList.appendChild(div);
        
    });
}

// render vendor list for a product
function renderVendors(product) {
    vendorTitle.textContent = `Vendors for ${product.name}`;
    vendorList.innerHTML = "";
    product.vendors.forEach (v => {
        const div =document.createElement('div');
        div.className ='vendor';
        div.innerHTML = `<strong>${v.name}</strong> -KES ${v.price}`;
        vendorList.appendChild(div);
    });
}

// search filter
searchInput.addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const filtered = products.filter(p=> p.name.toLowerCase().includes(query));
    renderProducts(filtered);
});

// sort toggle for vendor price
sortBtn.addEventListener("click", () => {
  const sorted = [...products].sort((a, b) => {
    const priceA = Math.min(...a.vendors.map(v => v.price));
    const priceB = Math.min(...b.vendors.map(v => v.price));

    return sortedASC ? priceA - priceB : priceB - priceA;
  });
  sortedASC = !sortedASC;
  renderProducts(sorted);
});

// Dark Mode toggle
darkModeToggle.addEventListener("change", e => {
    document.body.classList.toggle("dark", e.target.checked);
});

// Dummy alerts for navbar buttons
document.getElementById('signupBtn').addEventListener("click", () => alert("Signup feature coming soon!"));
document.getElementById('categoriesBtn').addEventListener("click", () => alert("Categories feature coming soon!"));
document.getElementById('contactBtn').addEventListener("click", () => alert("Contact Us feature coming soon!"));


fetchProducts();