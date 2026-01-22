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
let currentData = []; // Lista de carros atual (pode ser filtrada)
let currentPage = 1;
const itemsPerPage = 6; // Quantidade de carros por página

// ==========================================
// 2. INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Exibe loading
  if (loadingIndicator) loadingIndicator.style.display = 'block';

  // Verifica se o dataset foi carregado corretamente
  if (window.carDatabase && window.carDatabase.length > 0) {
    // ✅ Hidrata as imagens (Wikipedia thumbnails) antes de renderizar
    if (typeof window.hydrateCarImages === 'function') {
      try {
        await window.hydrateCarImages(window.carDatabase);
      } catch (err) {
        console.warn('Falha ao carregar imagens do Wikipedia. Usando fallback.', err);
      }
    } else {
      console.warn(
        'hydrateCarImages não encontrado. Verifique se dataset.js foi carregado antes do main.js',
      );
    }

    currentData = window.carDatabase; // Carrega todos os carros
    renderPage(1); // Renderiza a primeira página
    setupPaginationControls(); // Cria os botões de navegação
  } else {
    carsContainer.innerHTML =
      '<p style="text-align:center; width:100%;">Erro: Banco de dados não encontrado.</p>';
  }

  if (loadingIndicator) loadingIndicator.style.display = 'none';
});

// ==========================================
// 3. LÓGICA DE PAGINAÇÃO E RENDERIZAÇÃO
// ==========================================
function renderPage(page) {
  currentPage = page;
  carsContainer.innerHTML = ''; // Limpa os carros antigos

  // Cálculos de índices para fatiar o array
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = currentData.slice(start, end);

  // Se não houver itens (ex: busca sem resultados)
  if (pageItems.length === 0) {
    carsContainer.innerHTML =
      '<p style="text-align:center; grid-column: 1/-1; padding: 20px;">Nenhum carro encontrado.</p>';
    updatePaginationButtons();
    return;
  }

  // Cria um card para cada carro
  pageItems.forEach((car) => createCard(car));

  // Atualiza o estado dos botões (Habilitado/Desabilitado)
  updatePaginationButtons();

  // Rola suavemente para o topo da lista
  const headerOffset = 100;
  const elementPosition = carsContainer.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

  // Só rola se não for a inicialização
  if (page > 1) {
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  }
}

// Cria o HTML de um único Card (Design Moderno)
function createCard(car) {
  const card = document.createElement('div');
  card.classList.add('box');

  // Imagem com Fallback (caso a URL falhe)
  const imgHtml = `
        <img src="${car.image}"
             alt="${car.model}"
             onerror="this.onerror=null;this.src='https://via.placeholder.com/400x300?text=Indispon%C3%ADvel';"
             loading="lazy">
    `;

  // Categoria para a etiqueta (Sport, Sedan, etc)
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
                    <div class="spec-item" title="Combustível">
                        <i class='bx bxs-gas-pump'></i> ${car.fuel}
                    </div>
                </div>
            </div>

            <div class="price-row">
                <span class="price">${car.price}</span>
                <button class="details-btn">
                    Detalhes <i class='bx bx-right-arrow-alt'></i>
                </button>
            </div>
        </div>
    `;

  // Adiciona evento de clique no botão
  card.querySelector('.details-btn').onclick = () => openModal(car);

  // Adiciona o card na tela
  carsContainer.appendChild(card);
}

// ==========================================
// 4. CONTROLES DE NAVEGAÇÃO (Paginação)
// ==========================================
function setupPaginationControls() {
  // Remove paginação existente se houver (para não duplicar)
  const existingNav = document.getElementById('pagination-nav');
  if (existingNav) existingNav.remove();

  // Cria a div de navegação
  const nav = document.createElement('div');
  nav.id = 'pagination-nav';

  // Botão Anterior
  const btnPrev = document.createElement('button');
  btnPrev.id = 'btn-prev';
  btnPrev.innerHTML = "<i class='bx bx-chevron-left'></i> Anterior";
  btnPrev.onclick = () => {
    if (currentPage > 1) renderPage(currentPage - 1);
  };

  // Indicador de Página
  const pageInfo = document.createElement('span');
  pageInfo.id = 'page-info';
  pageInfo.style.alignSelf = 'center';
  pageInfo.style.fontWeight = '600';
  pageInfo.style.color = '#555';

  // Botão Próximo
  const btnNext = document.createElement('button');
  btnNext.id = 'btn-next';
  btnNext.innerHTML = "Próximo <i class='bx bx-chevron-right'></i>";
  btnNext.onclick = () => {
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    if (currentPage < totalPages) renderPage(currentPage + 1);
  };

  nav.appendChild(btnPrev);
  nav.appendChild(pageInfo);
  nav.appendChild(btnNext);

  // Insere após o container de carros
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
// 5. PESQUISA (Filtro em Tempo Real)
// ==========================================
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();

    // Filtra o banco de dados original
    currentData = window.carDatabase.filter(
      (car) => car.make.toLowerCase().includes(term) || car.model.toLowerCase().includes(term),
    );

    // Reinicia para a página 1 e renderiza
    renderPage(1);
  });
}

// ==========================================
// 6. LÓGICA DO MODAL (Pop-up)
// ==========================================
function openModal(car) {
  if (!modal) return;

  // Preenche Imagem
  if (modalEls.img) modalEls.img.src = car.image;

  // Função auxiliar para preencher texto
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

  // Abre o modal
  modal.classList.add('open');
  modal.style.display = 'flex'; // Garante display flex
  document.body.style.overflow = 'hidden'; // Trava scroll do fundo
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300); // Espera a animação do CSS
  document.body.style.overflow = 'auto'; // Destrava scroll
}

// Eventos de Fechamento
if (closeModalBtn) closeModalBtn.onclick = closeModal;
window.onclick = (e) => {
  if (e.target === modal) closeModal();
};

// ==========================================
// 7. MENU MOBILE
// ==========================================
const menuIcon = document.getElementById('menu-icon');
const navbar = document.querySelector('.navbar');
const searchBox = document.querySelector('.search-box');
const searchIcon = document.getElementById('search-icon');

if (menuIcon) {
  menuIcon.onclick = () => {
    navbar.classList.toggle('active');
    if (searchBox) searchBox.classList.remove('active');
  };
}

if (searchIcon) {
  searchIcon.onclick = () => {
    searchBox.classList.toggle('active');
    if (navbar) navbar.classList.remove('active');
    // Foca no input ao abrir
    if (searchBox.classList.contains('active')) {
      setTimeout(() => searchInput.focus(), 100);
    }
  };
}

// Fecha menu ao rolar a página
window.onscroll = () => {
  if (navbar) navbar.classList.remove('active');
  if (searchBox) searchBox.classList.remove('active');
};

// ==========================================
// 5. PESQUISA (DESKTOP E MOBILE)
// ==========================================
// Função unificada de busca
function handleSearch(event) {
  const term = event.target.value.toLowerCase();

  // Filtra o banco de dados original
  currentData = window.carDatabase.filter(
    (car) => car.make.toLowerCase().includes(term) || car.model.toLowerCase().includes(term),
  );

  renderPage(1);

  // Se estiver no mobile e rolar, fecha o teclado/busca
  if (currentData.length > 0) {
    document.getElementById('cars').scrollIntoView({ behavior: 'smooth' });
  }
}

// Input Desktop
const searchInputDesktop = document.getElementById('search-input');
if (searchInputDesktop) {
  searchInputDesktop.addEventListener('input', handleSearch);
}

// Input Mobile
const searchInputMobile = document.getElementById('search-input-mobile');
if (searchInputMobile) {
  searchInputMobile.addEventListener('input', handleSearch);
}

// ==========================================
// 6. MENU & UI MOBILE
// ==========================================
const searchIconMobile = document.getElementById('search-icon-mobile');
const searchBoxMobile = document.querySelector('.search-box-mobile');

// Toggle Menu Hamburguer
if (menuIcon) {
  menuIcon.onclick = () => {
    navbar.classList.toggle('active');
    // Fecha busca se abrir menu
    if (searchBoxMobile) searchBoxMobile.classList.remove('active');
  };
}

// Toggle Busca Mobile
if (searchIconMobile) {
  searchIconMobile.onclick = () => {
    searchBoxMobile.classList.toggle('active');
    navbar.classList.remove('active');

    // Foca no input se abrir
    if (searchBoxMobile.classList.contains('active')) {
      setTimeout(() => searchInputMobile.focus(), 100);
    }
  };
}

// Fechar tudo ao rolar
window.onscroll = () => {
  if (navbar) navbar.classList.remove('active');
  if (searchBoxMobile) searchBoxMobile.classList.remove('active');
};
