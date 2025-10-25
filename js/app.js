const APP = (() => {
    const menuUrl = 'menu.json';
    let state = {
      data: null,
      currentRestaurant: null,
      currentCategory: null,
    };
  
    // DOM
    const restaurantsGrid = document.getElementById('restaurantsGrid');
    const restaurantsView = document.getElementById('restaurantsView');
    const menuView = document.getElementById('menuView');
    const aboutView = document.getElementById('aboutView');
    const backBtn = document.getElementById('backBtn');
    const restName = document.getElementById('restName');
    const restDesc = document.getElementById('restDesc');
    const categoriesList = document.getElementById('categoriesList');
    const categorySelect = document.getElementById('categorySelect');
    const productsGrid = document.getElementById('productsGrid');
  
    // Header / nav
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    const navRestaurants = document.getElementById('nav-restaurants');
    const navAbout = document.getElementById('nav-about');
  
    async function init() {
      bindUi();
      try {
        const res = await fetch(menuUrl);
        if (!res.ok) throw new Error('menu.json yüklenemedi');
        state.data = await res.json();
        renderRestaurants();
      } catch (err) {
        restaurantsGrid.innerHTML = `<p class="muted">Veri yüklenemedi: ${err.message}</p>`;
        console.error(err);
      }
    }
  
    function bindUi() {
      navToggle.addEventListener('click', toggleNav);
      navRestaurants.addEventListener('click', (e) => { e.preventDefault(); showView('restaurants'); closeNav(); });
      navAbout.addEventListener('click', (e) => { e.preventDefault(); showView('about'); closeNav(); });
      backBtn.addEventListener('click', () => showView('restaurants'));
      categorySelect.addEventListener('change', (e) => {
        const cat = e.target.value;
        selectCategory(cat);
      });
      window.addEventListener('click', (e) => {
        // keyboard-friendly: close nav on outside click (mobile)
        if (!mainNav.contains(e.target) && !navToggle.contains(e.target)) closeNav();
      });
    }
  
    function toggleNav() {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      const hidden = mainNav.getAttribute('aria-hidden') === 'true';
      mainNav.style.display = hidden ? 'block' : 'none';
      mainNav.setAttribute('aria-hidden', String(!hidden));
    }
    function closeNav() {
      navToggle.setAttribute('aria-expanded', 'false');
      mainNav.style.display = '';
      mainNav.setAttribute('aria-hidden', 'true');
    }
  
    function showView(viewName) {
      restaurantsView.classList.add('hidden');
      menuView.classList.add('hidden');
      aboutView.classList.add('hidden');
      if (viewName === 'restaurants') restaurantsView.classList.remove('hidden');
      if (viewName === 'menu') menuView.classList.remove('hidden');
      if (viewName === 'about') aboutView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  
    function renderRestaurants() {
      const list = state.data.restaurants || [];
      restaurantsGrid.innerHTML = '';
      list.forEach(r => {
        const card = document.createElement('article');
        card.className = 'restaurant-card';
        card.tabIndex = 0;
        card.innerHTML = `
          <img loading="lazy" src="img/${r.image || 'default.svg'}" alt="${r.name}" onerror="this.onerror=null;this.src='img/default.svg'"/>
          <div>
            <h3>${r.name}</h3>
            <p class="muted">${r.description || ''}</p>
          </div>
        `;
        card.addEventListener('click', () => openRestaurant(r.id));
        card.addEventListener('keypress', (e) => { if (e.key === 'Enter') openRestaurant(r.id); });
        restaurantsGrid.appendChild(card);
      });
    }
  
    function openRestaurant(id) {
      const rest = state.data.restaurants.find(r => r.id === id);
      if (!rest) return;
      state.currentRestaurant = rest;
      restName.textContent = rest.name;
      restDesc.textContent = rest.description || '';
      // categories
      const cats = rest.categories || [];
      categorySelect.innerHTML = '';
      categoriesList.innerHTML = '';
      cats.forEach((c, idx) => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        categorySelect.appendChild(opt);
  
        const tab = document.createElement('button');
        tab.className = 'category-tab';
        tab.textContent = c.name;
        tab.setAttribute('role', 'tab');
        tab.dataset.name = c.name;
        tab.setAttribute('aria-selected', 'false');
        tab.addEventListener('click', () => {
          selectCategory(c.name);
          categorySelect.value = c.name;
        });
        categoriesList.appendChild(tab);
      });
  
      // initially select first category
      if (cats.length) {
        selectCategory(cats[0].name);
        categorySelect.value = cats[0].name;
      } else {
        productsGrid.innerHTML = '<p class="muted">Kategori yok.</p>';
      }
  
      showView('menu');
    }
  
    function selectCategory(catName) {
      state.currentCategory = catName;
      // highlight tab
      Array.from(categoriesList.children).forEach(btn => {
        btn.setAttribute('aria-selected', btn.dataset.name === catName ? 'true' : 'false');
      });
  
      const rest = state.currentRestaurant;
      if (!rest) return;
      const cat = rest.categories.find(c => c.name === catName);
      if (!cat) {
        productsGrid.innerHTML = '<p class="muted">Ürün yok.</p>';
        return;
      }
      renderProducts(cat.products || []);
    }
  
    function renderProducts(products) {
      productsGrid.innerHTML = '';
      if (!products.length) {
        productsGrid.innerHTML = '<p class="muted">Bu kategoride ürün bulunmuyor.</p>';
        return;
      }
      products.forEach(p => {
        const el = document.createElement('article');
        el.className = 'product';
        const imgSrc = p.image ? `img/${p.image}` : 'img/default.svg';
        el.innerHTML = `
          <img class="product-img" loading="lazy" src="${imgSrc}" alt="${p.name}" onerror="this.onerror=null;this.src='img/default.svg'"/>
          <div class="meta">
            <h4>${p.name} <span class="price">${formatPrice(p.price, p.currency)}</span></h4>
            <p class="muted">${p.description || ''}</p>
            ${p.tags && p.tags.length ? `<div class="tags">${p.tags.map(t=>`<small class="muted">${t}</small>`).join(' • ')}</div>` : ''}
          </div>
        `;
        productsGrid.appendChild(el);
      });
    }
  
    function formatPrice(val, currency = '₺') {
      if (val == null) return '';
      // simple formatting
      return `${val.toFixed(2).replace('.',',')} ${currency}`;
    }
  
    return { init };
  })();
  
  document.addEventListener('DOMContentLoaded', () => APP.init());