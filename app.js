let allProducts = [];
let activeCategory = 'Все';
let whatsappNumber = '+992901403263'; // Номери WhatsApp-и худро гузоред
let cart = JSON.parse(localStorage.getItem('romashka_cart') || '[]');

const $ = s => document.querySelector(s);
const money = n => Number(n || 0).toLocaleString('ru-RU') + ' сомони';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

function waUrl(text = 'Здравствуйте! Хочу узнать подробнее о букетах магазина Ромашка 🌸') {
  return 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(text);
}

function saveCart() {
  localStorage.setItem('romashka_cart', JSON.stringify(cart));
  renderCart();
}

function addToCart(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p || !p.available) return;
  const item = cart.find(x => x.id === id);
  if (item) item.qty++;
  else cart.push({ id, qty: 1 });
  saveCart();
  openCart();
  toast('Букет добавлен в корзину ♡');
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(x => x.id !== id);
  saveCart();
}

function cartDetails() {
  return cart.map(i => ({ ...i, product: allProducts.find(p => p.id === i.id) })).filter(i => i.product);
}

function renderCart() {
  const items = cartDetails(), count = items.reduce((s, i) => s + i.qty, 0), total = items.reduce((s, i) => s + i.qty * Number(i.product.price), 0);
  if ($('#cartCount')) $('#cartCount').textContent = count > 99 ? '99+' : count;
  if ($('#cartTotal')) $('#cartTotal').textContent = money(total);
  if ($('#cartItems')) {
    $('#cartItems').innerHTML = items.length ? items.map(i => `
      <div class="cart-item">
        <img src="${i.product.image}" alt="${esc(i.product.name)}">
        <div>
          <h4>${esc(i.product.name)}</h4>
          <small>${money(i.product.price)}</small>
          <div class="qty">
            <button onclick="changeQty(${i.id},-1)">−</button>
            <span>${i.qty}</span>
            <button onclick="changeQty(${i.id},1)">+</button>
          </div>
        </div>
        <button class="remove" onclick="changeQty(${i.id},-${i.qty})" aria-label="Удалить">×</button>
      </div>
    `).join('') : '<div class="cart-empty"><div style="font-size:30px;margin-bottom:12px">♡</div>Ваша корзина пока пуста.<br>Добавьте понравившийся букет.</div>';
  }
  const lines = items.map(i => `• ${i.product.name} × ${i.qty} — ${money(i.product.price * i.qty)}`).join('\n');
  if ($('#cartWhatsApp')) $('#cartWhatsApp').href = waUrl('Здравствуйте! 🌸 Хочу оформить заказ:\n' + lines + '\nИтого: ' + money(total) + '\nПодскажите, пожалуйста, как оформить доставку?');
}

function openCart() { $('#cartDrawer')?.classList.add('open'); $('#cartOverlay')?.classList.add('open'); document.body.classList.add('no-scroll'); }
function closeCart() { $('#cartDrawer')?.classList.remove('open'); $('#cartOverlay')?.classList.remove('open'); document.body.classList.remove('no-scroll'); }

function toast(text) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function renderCategories() {
  const cats = [
    ['Розы', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=500&q=85'],
    ['Букеты', 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=500&q=85'],
    ['Композиции', 'https://images.unsplash.com/photo-1495231916356-a86217efff12?auto=format&fit=crop&w=500&q=85'],
    ['Монобукеты', 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=500&q=85'],
    ['Подарки', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=85'],
    ['Свадебные букеты', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=500&q=85']
  ];
  if ($('#categoryGrid')) {
    $('#categoryGrid').innerHTML = cats.map(([name, img]) => `
      <button class="category-card" onclick="selectCategory('${esc(name)}')">
        <img src="${img}" alt="${name}">
        <div><b>${name}</b><small>${categoryCount(name)} ${plural(categoryCount(name))}</small></div>
      </button>
    `).join('');
  }
}

function categoryCount(name) { return allProducts.filter(p => p.category === name).length; }
function plural(n) { return n === 1 ? 'товар' : n >= 2 && n <= 4 ? 'товара' : 'товаров'; }

function selectCategory(cat) {
  activeCategory = cat === 'Все' ? 'Все' : cat;
  $('#catalog')?.scrollIntoView({ behavior: 'smooth' });
  renderFilters();
  renderProducts();
}

function renderFilters() {
  const cats = ['Все', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
  if ($('#filters')) {
    $('#filters').innerHTML = cats.map(c => `<button class="filter ${c === activeCategory ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    document.querySelectorAll('.filter').forEach(b => b.addEventListener('click', () => {
      activeCategory = b.dataset.cat;
      renderFilters();
      renderProducts();
    }));
  }
}

function renderProducts() {
  const query = ($('#searchInput')?.value || '').trim().toLowerCase();
  const products = allProducts.filter(p => (activeCategory === 'Все' || p.category === activeCategory) && (!query || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(query)));
  if ($('#catalogCount')) $('#catalogCount').textContent = `${products.length} ${plural(products.length)}`;
  
  if ($('#productGrid')) {
    if (!products.length) {
      $('#productGrid').innerHTML = '<div class="loading">По вашему запросу ничего не найдено.</div>';
      return;
    }
    $('#productGrid').innerHTML = products.map((p, i) => `
      <article class="product" style="animation-delay:${i * 45}ms">
        <div class="product-photo" onclick="openProduct(${p.id})">
          <img src="${p.image}" alt="${esc(p.name)}" loading="lazy">
          ${i < 2 ? '<span class="product-ribbon">Хит</span>' : ''}
          <div class="product-overlay">
            <span class="quick">Подробнее →</span>
            ${p.available ? `<button class="add-quick" onclick="event.stopPropagation();addToCart(${p.id})">В корзину</button>` : ''}
          </div>
        </div>
        <div class="product-info" onclick="openProduct(${p.id})">
          <div><h3>${esc(p.name)}</h3><small>${esc(p.category)}</small></div>
          <div class="price">${money(p.price)}</div>
        </div>
      </article>
    `).join('');
  }
}

// Исправлено: Относительный путь product.html?id= вместо /product.html?id=
function openProduct(id) { location.href = 'product.html?id=' + encodeURIComponent(id); }

function checkout() {
  if (!cart.length) { toast('Сначала добавьте букет в корзину'); return; }
  const items = cartDetails(), total = items.reduce((s, i) => s + i.qty * i.product.price, 0);
  const lines = items.map(i => `${i.product.name} × ${i.qty}`).join(', ');
  location.href = waUrl(`Здравствуйте! 🌸 Хочу оформить заказ в магазине «Ромашка».\n\n${lines}\nИтого: ${money(total)}\n\nПодскажите, пожалуйста, как оформить доставку?`);
}

function init() {
  // Загрузка товаров из LocalStorage
  let stored = localStorage.getItem('romashka_products');
  if (!stored) {
    // Тестовые товары, если хранилище пустое
    allProducts = [
      { id: 1, name: 'Нежная Ромашка', category: 'Букеты', price: 250, size: 'Средний', description: 'Красивый букет со свежими ромашками', composition: 'Ромашки, упаковка', available: true, image: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=600&q=80' },
      { id: 2, name: 'Букет из 101 розы', category: 'Розы', price: 1200, size: 'Большой', description: 'Роскошный букет из красных роз', composition: '101 красная роза', available: true, image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80' }
    ];
    localStorage.setItem('romashka_products', JSON.stringify(allProducts));
  } else {
    allProducts = JSON.parse(stored);
  }

  const general = waUrl();
  ['phoneLink', 'heroWhatsApp', 'ctaWhatsApp', 'floatingWhatsApp'].forEach(id => {
    const el = $('#' + id);
    if (el) el.href = general;
  });

  renderCategories();
  renderFilters();
  renderProducts();
  renderCart();
}

$('#cartBtn')?.addEventListener('click', openCart);
$('#closeCart')?.addEventListener('click', closeCart);
$('#cartOverlay')?.addEventListener('click', closeCart);
$('#checkoutBtn')?.addEventListener('click', checkout);

$('#searchBtn')?.addEventListener('click', () => {
  $('#searchDrawer')?.classList.add('open');
  $('#searchDrawer')?.setAttribute('aria-hidden', 'false');
  $('#searchInput')?.focus();
});
$('#closeSearch')?.addEventListener('click', () => {
  $('#searchDrawer')?.classList.remove('open');
  $('#searchDrawer')?.setAttribute('aria-hidden', 'true');
});

$('#searchInput')?.addEventListener('input', renderProducts);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCart();
    $('#searchDrawer')?.classList.remove('open');
  }
});

init();
