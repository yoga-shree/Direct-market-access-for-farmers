/* ======= Simple SPA + App logic using hash routing + localStorage =======
   - localStorage keys: users, products, currentUser, transactions
   - persistent cart lives in localStorage key "cart_<username>" for buyers
   - This is a demo app: DO NOT use localStorage for real auth in production.
   ====================================================================== */

/* ---------- Utilities ---------- */
const el = id => document.getElementById(id);
const q = sel => document.querySelector(sel);
const now = () => new Date().toISOString();
const uid = () => 'id'+Math.random().toString(36).slice(2,9);

/* ---------- init demo data ---------- */
function seedIfEmpty() {
  if (!localStorage.getItem('users')) {
    const users = [
      { id: uid(), name:'Farmer Ram', email:'farmer1@example.com', role:'farmer', password:'pass', created: now() },
      { id: uid(), name:'Buyer Sita', email:'buyer1@example.com', role:'buyer', password:'pass', created: now() }
    ];
    localStorage.setItem('users', JSON.stringify(users));
  }
  if (!localStorage.getItem('products')) {
    const products = [
      { id: uid(), farmerId: getAnyFarmerId(), name:'Tomatoes (1kg)', price:40, qty:200, unit:'kg', desc:'Fresh ripe tomatoes', created: now() },
      { id: uid(), farmerId: getAnyFarmerId(), name:'Potatoes (1kg)', price:25, qty:400, unit:'kg', desc:'Local potatoes', created: now() }
    ];
    localStorage.setItem('products', JSON.stringify(products));
  }
}
function getAnyFarmerId() {
  let users = JSON.parse(localStorage.getItem('users')||'[]');
  let f = users.find(u=>u.role==='farmer');
  if (f) return f.id;
  // else create a farmer
  const nid = uid();
  users.push({id:nid,name:'Demo Farmer',email:'demo@farm.com',role:'farmer',password:'pass',created:now()});
  localStorage.setItem('users', JSON.stringify(users));
  return nid;
}

/* ---------- App state helpers ---------- */
function getUsers(){ return JSON.parse(localStorage.getItem('users')||'[]'); }
function setUsers(u){ localStorage.setItem('users', JSON.stringify(u)); }
function getProducts(){ return JSON.parse(localStorage.getItem('products')||'[]'); }
function setProducts(p){ localStorage.setItem('products', JSON.stringify(p)); }
function getCurrentUser(){ return JSON.parse(localStorage.getItem('currentUser')||'null'); }
function setCurrentUser(u){ localStorage.setItem('currentUser', JSON.stringify(u)); renderNav(); }
function logout(){ localStorage.removeItem('currentUser'); renderNav(); routeTo('/'); }
function cartKeyFor(user){ return `cart_${user.email.replace(/[^a-z0-9]/gi,'')}`; }
function getCart(){ const u=getCurrentUser(); if(!u)return []; return JSON.parse(localStorage.getItem(cartKeyFor(u))||'[]'); }
function setCart(arr){ const u=getCurrentUser(); if(!u) return; localStorage.setItem(cartKeyFor(u), JSON.stringify(arr)); }
function addTransaction(tx){ const txs = JSON.parse(localStorage.getItem('transactions')||'[]'); txs.push(tx); localStorage.setItem('transactions', JSON.stringify(txs)); }

/* ---------- Router ---------- */
const routes = {
  '/': showSplash,
  '/onboard': showOnboarding,
  '/login': showLogin,
  '/signup': showSignup,
  '/dashboard': showDashboard,
  '/market': showMarketplace,
  '/product': showProductDetails, // expects hash like #/product?id=xxx
  '/cart': showCart,
  '/profile': showProfile,
  '/manage': showManageProducts, // farmer product management page
};
function routeTo(path){ location.hash = '#'+path; }
function parseHash(){
  const raw = location.hash.slice(1) || '/';
  const [path, qstr] = raw.split('?');
  const params = {};
  if (qstr) qstr.split('&').forEach(p=>{ const [k,v]=p.split('='); params[k]=decodeURIComponent(v||''); });
  return {path, params};
}
function router(){
  const {path, params} = parseHash();
  const fn = routes[path] || showNotFound;
  fn(params);
}

/* ---------- UI helpers ---------- */
function renderNav(){
  const nav = document.getElementById('nav-actions');
  const user = getCurrentUser();
  nav.innerHTML = '';
  if (!user) {
    nav.innerHTML = `<button class="btn" onclick="goTo('#/login')">Login</button>
                     <button class="btn ghost" onclick="goTo('#/signup')">Sign up</button>`;
  } else {
    const name = user.name.split(' ')[0];
    nav.innerHTML = `<span class="small">Hi, ${name} (${user.role})</span>
      <button class="btn ghost" onclick="goTo('#/dashboard')">Dashboard</button>
      <button class="btn" onclick="goTo('#/cart')">Cart</button>
      <button class="btn ghost" onclick="logout()">Logout</button>`;
  }
}
function goTo(hash){ location.hash = hash; }

/* ---------- Views ---------- */
function showSplash(){
  document.getElementById('view-root').innerHTML = `
    <section class="card">
      <div class="header"><h2>Welcome to FarmDirect</h2></div>
      <p class="small">Connect farmers directly with buyers — list produce, buy fresh, and track transactions. This demo stores data in your browser.</p>
      <div class="row" style="margin-top:12px;">
        <button class="btn" onclick="goTo('#/onboard')">Get Started</button>
        <button class="btn ghost" onclick="goTo('#/market')">Browse Marketplace</button>
      </div>
    </section>`;
}
function showOnboarding(){
  document.getElementById('view-root').innerHTML = `
    <section class="card">
      <h3>Onboarding</h3>
      <p class="small">Choose your role to continue.</p>
      <div class="row" style="margin-top:12px;">
        <button class="btn" onclick="prefillSignup('farmer')">I'm a Farmer</button>
        <button class="btn ghost" onclick="prefillSignup('buyer')">I'm a Buyer</button>
      </div>
    </section>`;
}
function prefillSignup(role){
  goTo('/signup');
  // small delay until signup view renders, then prefill role
  setTimeout(()=>{ const roleSel = q('#signup-role'); if(roleSel) roleSel.value = role; }, 60);
}

function showLogin(){
  document.getElementById('view-root').innerHTML = `
    <section class="card">
      <h3>Login</h3>
      <div class="form-row"><label>Email</label><input id="login-email" class="input" /></div>
      <div class="form-row"><label>Password</label><input id="login-pass" type="password" class="input" /></div>
      <div class="row">
        <button class="btn" onclick="doLogin()">Login</button>
        <button class="btn ghost" onclick="goTo('#/signup')">Create account</button>
      </div>
    </section>`;
}
function doLogin(){
  const email = q('#login-email').value.trim();
  const pass = q('#login-pass').value;
  const users = getUsers();
  const found = users.find(u=>u.email.toLowerCase()===email.toLowerCase() && u.password===pass);
  if (!found) return alert('Invalid credentials (demo: use pass / create a new account)');
  setCurrentUser(found);
  routeTo('/dashboard');
}

function showSignup(){
  document.getElementById('view-root').innerHTML = `
    <section class="card">
      <h3>Create Account</h3>
      <div class="form-row"><label>Name</label><input id="signup-name" class="input" /></div>
      <div class="form-row"><label>Email</label><input id="signup-email" class="input" /></div>
      <div class="form-row"><label>Password</label><input id="signup-pass" type="password" class="input" /></div>
      <div class="form-row"><label>Role</label>
        <select id="signup-role" class="input">
          <option value="buyer">Buyer</option>
          <option value="farmer">Farmer</option>
        </select>
      </div>
      <div class="row">
        <button class="btn" onclick="doSignup()">Create account</button>
        <button class="btn ghost" onclick="goTo('#/login')">Back to login</button>
      </div>
    </section>`;
}
function doSignup(){
  const name=q('#signup-name').value.trim();
  const email=q('#signup-email').value.trim();
  const pass=q('#signup-pass').value;
  const role=q('#signup-role').value;
  if(!name||!email||!pass) return alert('Please fill all fields');
  const users=getUsers();
  if(users.find(u=>u.email.toLowerCase()===email.toLowerCase())) return alert('Email already registered');
  const newUser={id:uid(),name, email, password:pass, role, created:now()};
  users.push(newUser);
  setUsers(users);
  setCurrentUser(newUser);
  alert('Account created — demo password stored in localStorage (not secure)');
  goTo('/dashboard');
}

/* ---------- Dashboard ---------- */
function showDashboard(){
  const user = getCurrentUser();
  if(!user) return goTo('/login');
  if(user.role==='farmer') return showFarmerDashboard();
  return showBuyerDashboard();
}
function showFarmerDashboard(){
  const user = getCurrentUser();
  const products = getProducts().filter(p=>p.farmerId===user.id);
  const txs = JSON.parse(localStorage.getItem('transactions')||'[]').filter(t=>t.farmerId===user.id);
  // simple stats
  const totalSold = txs.reduce((s,t)=>s + (t.qty * t.price),0);
  const view = document.getElementById('view-root');
  view.innerHTML = `
    <section class="card">
      <div class="header"><h3>Farmer Dashboard</h3>
        <div><button class="btn" onclick="goTo('#/manage')">Manage Produce</button></div>
      </div>
      <p class="small">Welcome, ${user.name}. Products listed: <strong>${products.length}</strong></p>
      <div class="grid grid-cols-2" style="margin-top:12px;">
        <div class="card"><h4>Stats</h4><p class="small">Total revenue (sold): ₹${totalSold}</p><p class="small">Transactions: ${txs.length}</p></div>
        <div class="card"><h4>Recent Transactions</h4>
          <ul class="list">${txs.slice(-5).reverse().map(t=>`<li>${t.buyerName} bought ${t.qty} × ${t.productName} (₹${t.price} each) <span class="small">on ${new Date(t.date).toLocaleString()}</span></li>`).join('') || '<li class="small">No transactions yet</li>'}</ul>
        </div>
      </div>
    </section>`;
}

function showBuyerDashboard(){
  const user = getCurrentUser();
  const view = document.getElementById('view-root');
  view.innerHTML = `
    <section class="card">
      <div class="header"><h3>Buyer Dashboard</h3>
      <div><button class="btn" onclick="goTo('#/market')">Go to Marketplace</button></div></div>
      <p class="small">Welcome, ${user.name}. Quick actions: view market, view cart, edit profile.</p>
      <div class="grid grid-cols-2" style="margin-top:12px;">
        <div class="card"><h4>Cart</h4><p class="small">Items in cart: <strong>${getCart().length}</strong></p></div>
        <div class="card"><h4>Orders</h4><p class="small">Visit cart and checkout to complete purchase.</p></div>
      </div>
    </section>`;
}

/* ---------- Marketplace / Search ---------- */
function showMarketplace(){
  const { params } = parseHash();
  const qstr = params && params.q ? params.q.toLowerCase() : '';
  const products = getProducts().filter(p => p.name.toLowerCase().includes(qstr) || p.desc.toLowerCase().includes(qstr));
  document.getElementById('view-root').innerHTML = `
    <section class="card">
      <div class="header">
        <h3>Marketplace</h3>
        <div><button class="btn" onclick="routeTo('/dashboard')">Dashboard</button></div>
      </div>
      <div class="searchbar">
        <input id="search-input" placeholder="Search produce or description..." class="input" />
        <button class="btn" onclick="doSearch()">Search</button>
        <button class="btn ghost" onclick="renderAll()">All</button>
      </div>
      <div id="market-list" class="grid grid-cols-3"></div>
    </section>`;
  renderMarketList(products);
  if (qstr) q('#search-input').value = params.q;
}
function doSearch(){
  const val = q('#search-input').value.trim();
  if(!val) return showMarketplace();
  goTo('/market?q='+encodeURIComponent(val));
}
function renderAll(){ goTo('/market'); }

function renderMarketList(products){
  const wrapper = document.getElementById('market-list');
  wrapper.innerHTML = '';
  if (!products.length) {
    wrapper.innerHTML = `<div class="card">No produce found</div>`; return;
  }
  products.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'card card-product';
    div.innerHTML = `
      <div class="product-head">
        <strong>${p.name}</strong>
        <small class="small">₹${p.price}/${p.unit}</small>
      </div>
      <div class="small">${p.desc}</div>
      <div style="margin-top:auto;display:flex;gap:8px;margin-top:12px">
        <button class="btn" onclick="addToCartFromMarket('${p.id}')">Add to cart</button>
        <button class="btn ghost" onclick="goTo('/product?id=${p.id}')">Details</button>
      </div>
    `;
    wrapper.appendChild(div);
  });
}

/* ---------- Product Details ---------- */
function showProductDetails(params){
  const id = params && params.id;
  const p = getProducts().find(x=>x.id===id);
  if(!p) return document.getElementById('view-root').innerHTML = `<section class="card"><p>Product not found</p></section>`;
  const farmer = getUsers().find(u=>u.id===p.farmerId) || {name:'Unknown'};
  document.getElementById('view-root').innerHTML = `
    <section class="card">
      <div class="header"><h3>${p.name}</h3><div><button class="btn" onclick="goTo('#/market')">Back</button></div></div>
      <p class="small">By: ${farmer.name}</p>
      <p>${p.desc}</p>
      <p class="kv">Price: ₹${p.price} / ${p.unit} | Available: ${p.qty} ${p.unit}</p>
      <div style="margin-top:12px">
        <label>Quantity (${p.unit})</label>
        <input id="buy-qty" type="number" min="1" value="1" class="input" style="width:120px;margin-top:8px" />
      </div>
      <div style="margin-top:12px">
        <button class="btn" onclick="addToCartWithQty('${p.id}')">Add to cart</button>
      </div>
    </section>`;
}
function addToCartFromMarket(id){ addToCartWithQty(id,1); }
function addToCartWithQty(id,forceQty){
  const qty = forceQty || parseInt(q('#buy-qty')?.value || '1',10);
  const products = getProducts();
  const p = products.find(x=>x.id===id);
  if(!p) return alert('Product not found');
  if(qty <= 0) return alert('Enter valid quantity');
  const user = getCurrentUser();
  if(!user) { if(confirm('You need to login as buyer. Go to login?')) goTo('/login'); return; }
  if(user.role !== 'buyer') return alert('Only buyers can add to cart (switch to buyer account)');
  // cart per-buyer
  const cart = getCart() || [];
  const existing = cart.find(x=>x.id===id);
  if(existing) existing.qty += qty;
  else cart.push({ id: p.id, name: p.name, price: p.price, qty: qty, farmerId: p.farmerId });
  setCart(cart);
  alert(`${p.name} added to cart`);
}

/* ---------- Cart & Checkout ---------- */
function showCart(){
  const user = getCurrentUser();
  if(!user) return goTo('/login');
  const cart = getCart();
  let total = cart.reduce((s,i)=>s + (i.price * i.qty),0);
  document.getElementById('view-root').innerHTML = `
    <section class="card">
      <div class="header"><h3>Your Cart</h3><div><button class="btn ghost" onclick="goTo('#/market')">Continue shopping</button></div></div>
      <ul class="list" id="cart-list">
        ${cart.length ? cart.map((i,idx)=>`<li>${i.name} — ₹${i.price} × ${i.qty} <span><button class="btn ghost" onclick="changeQty(${idx}, -1)">-</button> <button class="btn ghost" onclick="changeQty(${idx}, 1)">+</button> <button class="btn" onclick="removeFromCart(${idx})">Remove</button></span></li>`).join('') : '<li class="small">Your cart is empty</li>'}
      </ul>
      <p class="small">Total: <strong>₹${total}</strong></p>
      <div class="row">
        <button class="btn" onclick="checkout()">Checkout</button>
        <button class="btn ghost" onclick="clearCart()">Clear cart</button>
      </div>
    </section>`;
}
function changeQty(idx, delta){
  const cart = getCart();
  if(!cart[idx]) return;
  cart[idx].qty += delta;
  if(cart[idx].qty < 1) cart.splice(idx,1);
  setCart(cart);
  showCart();
}
function removeFromCart(idx){
  const cart = getCart();
  cart.splice(idx,1);
  setCart(cart);
  showCart();
}
function clearCart(){ if(confirm('Clear cart?')){ setCart([]); showCart(); } }
function checkout(){
  const user = getCurrentUser();
  if(!user) return goTo('/login');
  const cart = getCart();
  if(!cart.length) return alert('Cart empty');
  // simulate payment / order creation: for each cart item, reduce farmer product qty and add transaction
  const products = getProducts();
  cart.forEach(item=>{
    const prod = products.find(p=>p.id===item.id);
    if(prod) prod.qty = Math.max(0, prod.qty - item.qty);
    addTransaction({
      id: uid(),
      productId: item.id,
      productName: item.name,
      buyerId: user.id,
      buyerName: user.name,
      farmerId: item.farmerId,
      price: item.price,
      qty: item.qty,
      date: now()
    });
  });
  setProducts(products);
  // clear cart
  setCart([]);
  alert('Checkout complete — transactions created (demo).');
  goTo('/dashboard');
}

/* ---------- Farmer manage products ---------- */
function showManageProducts(){
  const user = getCurrentUser();
  if(!user || user.role !== 'farmer') return goTo('/login');
  const products = getProducts().filter(p=>p.farmerId===user.id);
  document.getElementById('view-root').innerHTML = `
    <section class="card">
      <div class="header"><h3>Manage Produce</h3><div><button class="btn" onclick="goTo('#/dashboard')">Back</button></div></div>

      <div class="card">
        <h4>Add / Edit Produce</h4>
        <input id="prod-id" type="hidden"/>
        <div class="form-row"><label>Name</label><input id="prod-name" class="input"/></div>
        <div class="form-row"><label>Description</label><textarea id="prod-desc" class="input"></textarea></div>
        <div class="row">
          <div style="flex:1"><label>Price</label><input id="prod-price" type="number" class="input" /></div>
          <div style="flex:1"><label>Quantity</label><input id="prod-qty" type="number" class="input" /></div>
          <div style="flex:1"><label>Unit</label><input id="prod-unit" class="input" value="kg" /></div>
        </div>
        <div style="margin-top:10px"><button class="btn" onclick="saveProduct()">Save product</button><button class="btn ghost" onclick="clearProductForm()">Clear</button></div>
      </div>

      <div class="card">
        <h4>Your Listed Produce</h4>
        <ul id="farmer-list" class="list">
          ${products.length ? products.map(p=>`<li>${p.name} — ₹${p.price}/${p.unit} | ${p.qty} ${p.unit} 
            <span>
              <button class="btn ghost" onclick="editProduct('${p.id}')">Edit</button>
              <button class="btn" onclick="deleteProduct('${p.id}')">Delete</button>
            </span>
          </li>`).join('') : '<li class="small">No products yet</li>'}
        </ul>
      </div>
    </section>`;
}
function clearProductForm(){
  ['prod-id','prod-name','prod-desc','prod-price','prod-qty','prod-unit'].forEach(id=>{ if(q('#'+id)) q('#'+id).value=''; });
}
function saveProduct(){
  const user = getCurrentUser();
  if(!user || user.role!=='farmer') return alert('Only farmers can save products');
  const id = q('#prod-id').value;
  const name = q('#prod-name').value.trim();
  const desc = q('#prod-desc').value.trim();
  const price = parseFloat(q('#prod-price').value||0);
  const qty = parseFloat(q('#prod-qty').value||0);
  const unit = q('#prod-unit').value.trim()||'kg';
  if(!name || price<=0) return alert('Please provide name and price');
  const products = getProducts();
  if(id){
    // edit
    const idx = products.findIndex(p=>p.id===id);
    if(idx>=0){
      products[idx] = {...products[idx], name, desc, price, qty, unit, updated: now()};
    }
  } else {
    products.push({ id: uid(), farmerId: user.id, name, desc, price, qty, unit, created: now() });
  }
  setProducts(products);
  alert('Saved');
  showManageProducts();
}

function editProduct(id){
  const p = getProducts().find(x=>x.id===id);
  if(!p) return;
  goTo('/manage');
  setTimeout(()=> {
    q('#prod-id').value = p.id;
    q('#prod-name').value = p.name;
    q('#prod-desc').value = p.desc;
    q('#prod-price').value = p.price;
    q('#prod-qty').value = p.qty;
    q('#prod-unit').value = p.unit;
  }, 60);
}
function deleteProduct(id){
  if(!confirm('Delete product?')) return;
  let products = getProducts();
  products = products.filter(p=>p.id!==id);
  setProducts(products);
  showManageProducts();
}

/* ---------- Profile ---------- */
function showProfile(){
  const user = getCurrentUser();
  if(!user) return goTo('/login');
  document.getElementById('view-root').innerHTML = `
    <section class="card">
      <div class="header"><h3>Profile & Settings</h3><div><button class="btn" onclick="goTo('#/dashboard')">Back</button></div></div>
      <div class="form-row"><label>Name</label><input id="profile-name" class="input" value="${user.name}" /></div>
      <div class="form-row"><label>Email</label><input id="profile-email" class="input" value="${user.email}" disabled /></div>
      <div class="form-row"><label>Change password</label><input id="profile-pass" type="password" class="input" placeholder="leave blank to keep" /></div>
      <div class="row"><button class="btn" onclick="saveProfile()">Save</button></div>
    </section>`;
}
function saveProfile(){
  const user = getCurrentUser();
  const users = getUsers();
  const name = q('#profile-name').value.trim();
  const pass = q('#profile-pass').value;
  const idx = users.findIndex(u=>u.id===user.id);
  if(idx<0) return alert('User not found');
  users[idx].name = name || users[idx].name;
  if(pass) users[idx].password = pass;
  setUsers(users);
  setCurrentUser(users[idx]);
  alert('Profile saved');
}

/* ---------- Misc ---------- */
function showNotFound(){ document.getElementById('view-root').innerHTML = `<section class="card"><h3>Page not found</h3></section>`; }

/* ---------- Init ---------- */
function init(){
  seedIfEmpty();
  document.getElementById('year').textContent = new Date().getFullYear();
  renderNav();
  window.addEventListener('hashchange', router);
  // initial route
  if(!location.hash) location.hash = '/';
  router();
}
window.addEventListener('load', init);
