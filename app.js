const productList = document.getElementById('product-list');
const searchInput = document.getElementById('search');
const sortBtn = document.getElementById('sortBtn');
const darkModeToggle = document.getElementById('darkMode');

let products = [];
let sortedASC = true;

// fetch data from json-server

async function fetchProducts() {
    const res = await fetch('http://localhost:3000/products');
    products = await res.json();
    renderProducts (products);
}

// render products

function renderProducts(data) {
    productList.innerHTML = "";
    data.forEach(p => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<h3> ${p.name} </h3>
                        <p>vendor: ${p.vendor}</p>
                        <p>Price: KES ${p.price}</p>`;
        productList.appendChild(div);
        
    });
}

// search filter
searchInput.addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const filtered = products.filter(p=> p.name.toLowerCase().includes(query));
    renderProducts(filtered);
});