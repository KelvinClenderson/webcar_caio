// js/main.js

// ==========================================
// 1. CONFIGURAÇÃO E ELEMENTOS DO DOM
// ==========================================
const carsContainer = document.getElementById('cars-container');
const loadingIndicator = document.getElementById('loading');
const searchInput = document.querySelector('.search-box input');

// Elementos do Modal
const modal = document.getElementById('car-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalEls = {
  img: document.getElementById('m-img'),
  make: document.getElementById('m-brand'),
  model: document.getElementById('m-model'),
  engine: document.getElementById('m-engine'),
  trans: document.getElementById('m-trans'),
  drive: document.getElementById('m-drive'),
  mpg: document.getElementById('m-mpg'),
  fuel: document.getElementById('m-fuel'),
  year: document.getElementById('m-year'),
  price: document.getElementById('m-price'),
};

// Estado da Aplicação
let currentData = [];
let currentPage = 1;
const itemsPerPage = 6;

// ==========================================
// 2. INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  if (loadingIndicator) loadingIndicator.style.display = 'block';

  if (window.carDatabase && window.carDatabase.length > 0) {
    // Hidrata imagens se necessário
    if (typeof window.hydrateCarImages === 'function') {
      try {
        await window.hydrateCarImages(window.carDatabase);
      } catch (err) {
        console.warn('Fallback nas imagens ativado.', err);
      }
    }

    currentData = window.carDatabase;
    renderPage(1);
    setupPaginationControls();
  } else {
    carsContainer.innerHTML =
      '<p style="text-align:center; width:100%;">Erro: Banco de dados não encontrado.</p>';
  }

  if (loadingIndicator) loadingIndicator.style.display = 'none';
});

// ==========================================
// 3. RENDERIZAÇÃO
// ==========================================
function renderPage(page) {
  currentPage = page;
  carsContainer.innerHTML = '';

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = currentData.slice(start, end);

  if (pageItems.length === 0) {
    carsContainer.innerHTML =
      '<p style="text-align:center; grid-column: 1/-1; padding: 20px;">Nenhum carro encontrado.</p>';
    updatePaginationButtons();
    return;
  }

  pageItems.forEach((car) => createCard(car));
  updatePaginationButtons();

  // Scroll suave para o topo da seção de carros ao mudar de página
  if (page > 1) {
    const sectionTop = document.getElementById('cars').offsetTop - 100;
    window.scrollTo({ top: sectionTop, behavior: 'smooth' });
  }
}

function createCard(car) {
  const card = document.createElement('div');
  card.classList.add('box');

  const imgHtml = `
        <img src="${car.image}"
             alt="${car.model}"
             onerror="this.onerror=null;this.src='https://via.placeholder.com/400x300?text=Indispon%C3%ADvel';"
             loading="lazy">
    `;

  const categoryTag = car.class || 'Premium';

  card.innerHTML = `
        <div class="box-img-wrapper">
            ${imgHtml}
            <span class="category-tag">${categoryTag}</span>
        </div>

        <div class="box-content">
            <div>
                <h2>${car.make}</h2>
                <h3>${car.model}</h3>

                <div class="specs-grid">
                    <div class="spec-item" title="Ano">
                        <i class='bx bxs-calendar'></i> ${car.year}
                    </div>
                    <div class="spec-item" title="Motor">
                        <i class='bx bxs-car-mechanic'></i> ${car.engine.split(' ')[0]}
                    </div>
                    <div class="spec-item" title="Câmbio">
                        <i class='bx bx-cog'></i> ${car.transmission.split(' ')[0]}
                    </div>
                </div>
            </div>

            <div class="price-row">
                <span class="price">${car.price}</span>
                <button class="details-btn">
                    Ver <i class='bx bx-right-arrow-alt'></i>
                </button>
            </div>
        </div>
    `;

  card.querySelector('.details-btn').onclick = () => openModal(car);
  carsContainer.appendChild(card);
}

// ==========================================
// 4. PAGINAÇÃO (MODERNIZADA)
// ==========================================
function setupPaginationControls() {
  const existingNav = document.getElementById('pagination-nav');
  if (existingNav) existingNav.remove();

  const nav = document.createElement('div');
  nav.id = 'pagination-nav';

  // Botão Anterior (Só ícone)
  const btnPrev = document.createElement('button');
  btnPrev.id = 'btn-prev';
  btnPrev.title = 'Página Anterior';
  btnPrev.innerHTML = "<i class='bx bx-chevron-left'></i>"; // Apenas ícone para ficar redondo
  btnPrev.onclick = () => {
    if (currentPage > 1) renderPage(currentPage - 1);
  };

  // Indicador de Página
  const pageInfo = document.createElement('span');
  pageInfo.id = 'page-info';

  // Botão Próximo (Só ícone)
  const btnNext = document.createElement('button');
  btnNext.id = 'btn-next';
  btnNext.title = 'Próxima Página';
  btnNext.innerHTML = "<i class='bx bx-chevron-right'></i>"; // Apenas ícone
  btnNext.onclick = () => {
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    if (currentPage < totalPages) renderPage(currentPage + 1);
  };

  nav.appendChild(btnPrev);
  nav.appendChild(pageInfo);
  nav.appendChild(btnNext);

  // Insere APÓS o container de carros
  carsContainer.parentNode.insertBefore(nav, carsContainer.nextSibling);

  updatePaginationButtons();
}

function updatePaginationButtons() {
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const pageInfo = document.getElementById('page-info');

  if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;

  if (btnPrev) btnPrev.disabled = currentPage === 1;
  if (btnNext) btnNext.disabled = currentPage >= totalPages;
}

// ==========================================
// 5. PESQUISA
// ==========================================
function handleSearch(event) {
  const term = event.target.value.toLowerCase();
  currentData = window.carDatabase.filter(
    (car) => car.make.toLowerCase().includes(term) || car.model.toLowerCase().includes(term),
  );
  renderPage(1);
}

const searchInputDesktop = document.getElementById('search-input');
if (searchInputDesktop) searchInputDesktop.addEventListener('input', handleSearch);

const searchInputMobile = document.getElementById('search-input-mobile');
if (searchInputMobile) searchInputMobile.addEventListener('input', handleSearch);

// ==========================================
// 6. MODAL
// ==========================================
function openModal(car) {
  if (!modal) return;
  if (modalEls.img) modalEls.img.src = car.image;

  const setText = (el, text) => {
    if (el) el.textContent = text || '-';
  };

  setText(modalEls.make, car.make);
  setText(modalEls.model, car.model);
  setText(modalEls.engine, car.engine);
  setText(modalEls.trans, car.transmission);
  setText(modalEls.drive, car.drive);
  setText(modalEls.mpg, car.city_mpg);
  setText(modalEls.fuel, car.fuel);
  setText(modalEls.year, car.year);
  setText(modalEls.price, car.price);

  modal.classList.add('open');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
  document.body.style.overflow = 'auto';
}

if (closeModalBtn) closeModalBtn.onclick = closeModal;
window.onclick = (e) => {
  if (e.target === modal) closeModal();
};

// ==========================================
// 7. MENU MOBILE
// ==========================================
const menuIcon = document.getElementById('menu-icon');
const navbar = document.querySelector('.navbar');
const searchIconMobile = document.getElementById('search-icon-mobile');
const searchBoxMobile = document.querySelector('.search-box-mobile');

if (menuIcon) {
  menuIcon.onclick = () => {
    navbar.classList.toggle('active');
    if (searchBoxMobile) searchBoxMobile.classList.remove('active');
  };
}

if (searchIconMobile) {
  searchIconMobile.onclick = () => {
    searchBoxMobile.classList.toggle('active');
    navbar.classList.remove('active');
    if (searchBoxMobile.classList.contains('active')) {
      setTimeout(() => document.getElementById('search-input-mobile').focus(), 100);
    }
  };
}

window.onscroll = () => {
  if (navbar) navbar.classList.remove('active');
  if (searchBoxMobile) searchBoxMobile.classList.remove('active');
};
