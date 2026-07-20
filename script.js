// ════════════════════════════════════════════════════════
// CONFIGURAÇÕES GERAIS
// ════════════════════════════════════════════════════════

const LOC_ICON = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`;

// ════════════════════════════════════════════════════════
// DADOS DOS SERVIÇOS (NOVO)
// ════════════════════════════════════════════════════════

const SERVICOS = [
  {
    id: 'pulverizacao',
    nome: 'Pulverização',
    sub: ['Café', 'Soja', 'Milho', 'Cana', 'Pastagem', 'Feijão', 'Trigo', 'Algodão']
  },
  {
    id: 'mapeamento',
    nome: 'Mapeamento',
    sub: ['NDVI', 'Topografia', 'Área plantada', 'Drenagem']
  },
  {
    id: 'monitoramento',
    nome: 'Monitoramento',
    sub: ['Pragas', 'Umidade do solo', 'Crescimento da lavoura']
  },
  {
    id: 'dispersao',
    nome: 'Dispersão de Sólidos',
    sub: ['Sementes', 'Fertilizantes granulados', 'Inoculantes']
  }
];

// ════════════════════════════════════════════════════════
// ESTADO GLOBAL
// ════════════════════════════════════════════════════════

let EMPRESAS = [];
let apenasDisp = false;
let filtrosAtivos = {}; // { servicoId: [sub1, sub2, ...] }
let estadosAtivos = []; // lista de estados selecionados no filtro (ex: ["Minas Gerais"]), [] = sem filtro
let buscaSugestaoIndex = -1;

// ════════════════════════════════════════════════════════
// CARREGAR EMPRESAS (via Netlify Function)
// ════════════════════════════════════════════════════════

async function carregarEmpresas() {
  document.getElementById("lista-empresas").innerHTML =
    '<div class="vazio"><div class="vazio-icon">⏳</div><div class="vazio-title">Carregando...</div></div>';

  try {
    const res = await fetch("/.netlify/functions/empresas");
    if (!res.ok) throw new Error("Erro " + res.status);
    const json = await res.json();

    EMPRESAS = json.empresas.map(p => ({
      id: p.id,
      slug: p.slug || p.id,
      nome: p.nome || "",
      foto: p.foto || "",
      cidade: p.cidade || "",
      estado: p.estado || "",
      avaliacao: p.avaliacao || 0,
      avaliacoes: p.avaliacoes || 0,
      preco: p.preco || 0,
      drone: p.drone || "",
      area_max: p.area_max || 0,
      culturas: Array.isArray(p.culturas) ? p.culturas : [],
      disponivel: !!p.disponivel,
      destaque: !!p.destaque,
      servicos: p.servicos || 0,
      bio: p.bio || "",
      avaliacoes_texto: p.avaliacoes_texto || "",
      orcamento: p.orcamento || "",
      link_perfil: p.link_perfil || "",
      experiencia: p.experiencia || 0,
      whatsapp: p.whatsapp || "",
    }));

    renderDestaques();
    renderServicos();
    filtrar();

  } catch (err) {
    console.error(err);
    document.getElementById("lista-empresas").innerHTML =
      '<div class="vazio"><div class="vazio-icon">⚠️</div><div class="vazio-title">Erro ao carregar</div><div>Verifique a conexão e recarregue</div></div>';
  }
}

// ─────────────────────────────────────
// AVATAR
// ─────────────────────────────────────

function avatarHtml(p, cssClass, style) {
  const img = p.foto ? '<img src="' + p.foto + '" alt="' + p.nome + '">' : '';
  return '<div class="' + cssClass + '" style="' + style + '">' + img + '</div>';
}

function orcamentoUrl(empresa) {
  return (empresa && empresa.orcamento) ? empresa.orcamento : "";
}

function navShow(show) {
  const nav = document.getElementById("bottom-nav");
  if (nav) nav.style.display = show ? "flex" : "none";
}

// ─────────────────────────────────────
// RENDERIZAR CARDS DE SERVIÇO (NOVO)
// ─────────────────────────────────────

function renderServicos() {
  const container = document.getElementById('servicos-container');
  if (!container) return;

  container.innerHTML = SERVICOS.map(s => {
    const selecionados = filtrosAtivos[s.id] || [];
    const badge = selecionados.length > 0 ? `<span class="badge visivel">${selecionados.length}</span>` : `<span class="badge"></span>`;
    return `
      <div class="servico-card" data-servico="${s.id}" onclick="abrirModal('${s.id}')">
        <span class="nome">${s.nome}</span>
        ${badge}
        <span class="seta">▼</span>
      </div>
    `;
  }).join('');
}

// ─────────────────────────────────────
// MODAL (NOVO)
// ─────────────────────────────────────

let modalServicoId = null;
let modalTipo = 'servico'; // 'servico' | 'estado' — define qual lógica o modal genérico aplica

function abrirModal(servicoId) {
  const servico = SERVICOS.find(s => s.id === servicoId);
  if (!servico) return;

  modalServicoId = servicoId;
  modalTipo = 'servico';
  const selecionados = filtrosAtivos[servicoId] || [];

  document.getElementById('modal-titulo').textContent = servico.nome;
  document.getElementById('modal-sub').textContent = servicoId === 'pulverizacao' 
    ? 'Selecione a cultura desejada:' 
    : 'Selecione as opções desejadas:';

  const opcoesContainer = document.getElementById('modal-opcoes');
  opcoesContainer.innerHTML = servico.sub.map(op => `
    <label class="${selecionados.includes(op) ? 'selecionado' : ''}">
      <input type="checkbox" value="${op}" ${selecionados.includes(op) ? 'checked' : ''}>
      ${op}
    </label>
  `).join('');

  opcoesContainer.querySelectorAll('label').forEach(label => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', function() {
      label.classList.toggle('selecionado', this.checked);
    });
  });

  document.getElementById('modal-overlay').classList.add('aberto');
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('aberto');
}

function aplicarFiltro() {
  const opcoes = document.querySelectorAll('#modal-opcoes input[type="checkbox"]:checked');
  const selecionados = Array.from(opcoes).map(el => el.value);

  if (modalTipo === 'estado') {
    estadosAtivos = selecionados;
    fecharModal();
    atualizarBotaoEstado();
    filtrar();
    return;
  }

  if (selecionados.length > 0) {
    filtrosAtivos[modalServicoId] = selecionados;
  } else {
    delete filtrosAtivos[modalServicoId];
  }

  fecharModal();
  renderServicos();
  filtrar();
}

// ════════════════════════════════════════════════════════
// EVENTOS DO MODAL
// ════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  const fecharBtn = document.getElementById('modal-fechar');
  const cancelarBtn = document.getElementById('modal-cancelar');
  const aplicarBtn = document.getElementById('modal-aplicar');
  const overlay = document.getElementById('modal-overlay');

  if (fecharBtn) fecharBtn.addEventListener('click', fecharModal);
  if (cancelarBtn) cancelarBtn.addEventListener('click', fecharModal);
  if (aplicarBtn) aplicarBtn.addEventListener('click', aplicarFiltro);
  if (overlay) overlay.addEventListener('click', function(e) {
    if (e.target === this) fecharModal();
  });
});

// ─────────────────────────────────────
// TOGGLE DISPONIBILIDADE
// ─────────────────────────────────────

function toggleDisp() {
  apenasDisp = !apenasDisp;
  document.getElementById("dot-disp").className = "dot" + (apenasDisp ? " ativo" : "");
  document.getElementById("toggle-txt").textContent = apenasDisp ? "Mostrando disponíveis" : "Mostrar só disponíveis";
  filtrar();
}

// ─────────────────────────────────────
// AUTOCOMPLETE DE CIDADE (NOVO)
// ─────────────────────────────────────

function cidadesDisponiveis() {
  return [...new Set(EMPRESAS.map(p => p.cidade).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function onBuscaInput() {
  filtrar(); // mantém o comportamento de busca em tempo real já existente
  renderSugestoesBusca();
}

function renderSugestoesBusca() {
  const input = document.getElementById('busca');
  const box = document.getElementById('busca-sugestoes');
  if (!input || !box) return;

  const valor = input.value.trim().toLowerCase();
  buscaSugestaoIndex = -1;

  if (valor.length === 0) {
    box.classList.remove('aberto');
    box.innerHTML = '';
    return;
  }

  const opcoes = cidadesDisponiveis().filter(c => c.toLowerCase().includes(valor));

  if (opcoes.length === 0) {
    box.innerHTML = '<div class="vazio">Nenhuma cidade encontrada</div>';
    box.classList.add('aberto');
    return;
  }

  box.innerHTML = opcoes.map(c => '<div>' + c + '</div>').join('');
  box.classList.add('aberto');

  box.querySelectorAll('div:not(.vazio)').forEach((el, i) => {
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      input.value = opcoes[i];
      box.classList.remove('aberto');
      filtrar();
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('busca');
  const box = document.getElementById('busca-sugestoes');
  if (!input || !box) return;

  input.addEventListener('focus', renderSugestoesBusca);

  input.addEventListener('keydown', (e) => {
    const opcoes = box.querySelectorAll('div:not(.vazio)');
    if (!box.classList.contains('aberto') || opcoes.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      buscaSugestaoIndex = (buscaSugestaoIndex + 1) % opcoes.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      buscaSugestaoIndex = (buscaSugestaoIndex - 1 + opcoes.length) % opcoes.length;
    } else if (e.key === 'Enter' && buscaSugestaoIndex >= 0) {
      e.preventDefault();
      opcoes[buscaSugestaoIndex].dispatchEvent(new Event('mousedown'));
      return;
    } else if (e.key === 'Escape') {
      box.classList.remove('aberto');
      return;
    } else {
      return;
    }
    opcoes.forEach(o => o.classList.remove('ativo'));
    opcoes[buscaSugestaoIndex].classList.add('ativo');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) box.classList.remove('aberto');
  });
});

// ─────────────────────────────────────
// FILTRO POR ESTADO (NOVO — aguardando campo 'estado' na API)
// ─────────────────────────────────────

function estadosDisponiveis() {
  return [...new Set(EMPRESAS.map(p => p.estado).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function abrirFiltroEstado() {
  const estados = estadosDisponiveis();

  modalTipo = 'estado';

  document.getElementById('modal-titulo').textContent = 'Estado';
  document.getElementById('modal-sub').textContent = 'Selecione os estados desejados:';

  const opcoesContainer = document.getElementById('modal-opcoes');

  if (estados.length === 0) {
    opcoesContainer.innerHTML = '<div class="vazio" style="width:100%; padding:24px 0;">Nenhum estado disponível ainda</div>';
  } else {
    opcoesContainer.innerHTML = estados.map(uf => `
      <label class="${estadosAtivos.includes(uf) ? 'selecionado' : ''}">
        <input type="checkbox" value="${uf}" ${estadosAtivos.includes(uf) ? 'checked' : ''}>
        ${uf}
      </label>
    `).join('');

    opcoesContainer.querySelectorAll('label').forEach(label => {
      const checkbox = label.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', function() {
        label.classList.toggle('selecionado', this.checked);
      });
    });
  }

  document.getElementById('modal-overlay').classList.add('aberto');
}

function atualizarBotaoEstado() {
  const label = document.getElementById('filtro-estado-label');
  const btn = document.getElementById('filtro-estado-btn');
  if (!label || !btn) return;

  if (estadosAtivos.length === 0) {
    label.textContent = 'Filtrar por Estado...';
    btn.classList.remove('ativo');
  } else if (estadosAtivos.length === 1) {
    label.textContent = estadosAtivos[0];
    btn.classList.add('ativo');
  } else {
    label.textContent = estadosAtivos.length + ' estados';
    btn.classList.add('ativo');
  }
}

// ─────────────────────────────────────
// LISTA DE EMPRESAS (ATUALIZADO)
// ─────────────────────────────────────

function filtrar() {
  const busca = document.getElementById("busca").value.toLowerCase();

  const filtrados = EMPRESAS.filter(p => {
    // Filtro por serviço + sub-itens (via modal)
    let okS = true;
    if (Object.keys(filtrosAtivos).length > 0) {
      okS = Object.entries(filtrosAtivos).some(([servicoId, subs]) => {
        return p.culturas && p.culturas.some(cultura => subs.includes(cultura));
      });
    }

    // Filtro por busca (nome ou cidade)
    const okB = p.nome.toLowerCase().includes(busca) || p.cidade.toLowerCase().includes(busca);

    // Filtro por disponibilidade
    const okDisp = !apenasDisp || p.disponivel;

    // Filtro por estado (via botão "Filtrar por Estado")
    const okE = estadosAtivos.length === 0 || estadosAtivos.includes(p.estado);

    return okS && okB && okDisp && okE;
  });

  document.getElementById("count-txt").textContent = filtrados.length + " empresas";

  // Atualiza o título da lista
  const titulo = document.getElementById("lista-title");
  if (titulo) {
    const servicosSelecionados = Object.keys(filtrosAtivos);
    if (servicosSelecionados.length > 0) {
      const nomes = servicosSelecionados.map(id => {
        const s = SERVICOS.find(serv => serv.id === id);
        return s ? s.nome : id;
      }).join(' + ');
      titulo.textContent = `Empresas com ${nomes}`;
    } else {
      titulo.textContent = "Especialistas para sua lavoura:";
    }
  }

  // Esconde a seção de destaques quando há filtro ativo
  const destaqueSection = document.getElementById("destaques-section");
  if (destaqueSection) {
    const temFiltro = Object.keys(filtrosAtivos).length > 0;
    const temBusca = busca.length > 0;
    destaqueSection.style.display = (temFiltro || temBusca) ? "none" : "";
  }

  const ordem = document.getElementById("ordenar").value;
  if (ordem === "avaliacao") filtrados.sort((a,b) => b.avaliacao - a.avaliacao);
  else if (ordem === "az") filtrados.sort((a,b) => a.nome.localeCompare(b.nome));

  const lista = document.getElementById("lista-empresas");
  if (!filtrados.length) {
    lista.innerHTML = '<div class="vazio"><div class="vazio-icon">🔍</div><div class="vazio-title">Nenhum resultado</div><div>Tente outros filtros ou região</div></div>';
    return;
  }

  lista.innerHTML = filtrados.map(p =>
    '<div class="card-empresa" onclick="abrirPerfil(\'' + p.slug + '\')">' +
      avatarHtml(p, "avatar-sq", "") +
      '<div class="empresa-info">' +
        '<div class="empresa-top"><div class="empresa-nome">' + p.nome + '</div></div>' +
        '<div class="empresa-loc">' + LOC_ICON + ' ' + p.cidade + ' ' + '</div>' +
        '<div class="empresa-mid">' +
          '<div class="empresa-rating">⭐ ' + p.avaliacao + ' <span>(' + p.avaliacoes + ') · ' + (p.drone ? p.drone.split(" ")[1] : '') + '</span></div>' +
          '<div class="status"><div class="status-dot" style="background:' + (p.disponivel ? "#16A34A" : "#D6D3D1") + '"></div>' +
          '<span class="status-txt" style="color:' + (p.disponivel ? "#16A34A" : "#A8A29E") + '">' + (p.disponivel ? "Disponível" : "Indisponível") + '</span></div>' +
        '</div>' +
        '<div class="tags">' + p.culturas.slice(0,3).map(c => '<span class="tag">' + c + '</span>').join("") + (p.culturas.length > 3 ? '<span class="tag">+' + (p.culturas.length-3) + '</span>' : '') + '</div>' +
      '</div>' +
    '</div>'
  ).join("");
}

// ─────────────────────────────────────
// SVG e FUNÇÕES AUXILIARES
// ─────────────────────────────────────

const SVG_DRONE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 5.5h4"/><path d="M16.5 5.5h4"/><path d="M5.5 5.5v2"/><path d="M18.5 5.5v2"/><path d="M5.5 7.5h4"/><path d="M14.5 7.5h4"/><path d="M9.5 7.5l1.8 2.5"/><path d="M14.5 7.5L12.7 10"/><rect x="9" y="10" width="6" height="4" rx="1.6"/><rect x="10.5" y="8" width="3" height="1.3" rx=".4"/><path d="M10 14l-1 3"/><path d="M14 14l1 3"/><path d="M8.7 17h2"/><path d="M13.3 17h2"/><path d="M5.5 9.2v2"/><path d="M18.5 9.2v2"/><path d="M4.8 12.2l-.5 1"/><path d="M5.5 12.2v1.6"/><path d="M6.2 12.2l.5 1"/><path d="M17.8 12.2l-.5 1"/><path d="M18.5 12.2v1.6"/><path d="M19.2 12.2l.5 1"/></svg>`;

const SVG_SHIELD = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`;

const SVG_STAR_FULL = `<svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

const SVG_STAR_HALF = `<svg width="12" height="12" viewBox="0 0 24 24"><defs><linearGradient id="half"><stop offset="50%" stop-color="#F59E0B"/><stop offset="50%" stop-color="#E5E7EB"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#half)" stroke="#F59E0B" stroke-width="1"/></svg>`;

const SVG_STAR_EMPTY = `<svg width="12" height="12" viewBox="0 0 24 24" fill="#E5E7EB" stroke="#E5E7EB" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

function starsHtml(nota) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (nota >= i) html += SVG_STAR_FULL;
    else if (nota >= i - 0.5) html += SVG_STAR_HALF;
    else html += SVG_STAR_EMPTY;
  }
  return html;
}

function renderDestaques() {
  document.getElementById("destaques").innerHTML = EMPRESAS
    .filter(p => p.destaque && p.disponivel)
    .map(p =>
      '<div class="card-dest" onclick="abrirPerfil(\'' + p.slug + '\')">' +
        '<div class="card-dest-top">' +
          (p.foto ? '<img src="' + p.foto + '" alt="' + p.nome + '">' : '') +
        '</div>' +
        '<div class="card-dest-bottom">' +
          '<div class="card-dest-main">' +
            '<div class="card-dest-texto">' +
              '<div class="card-dest-nome">' + p.nome + '</div>' +
              '<div class="card-dest-cidad"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#78716C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' + p.cidade + '</div>' +
            '</div>' +
            '<div class="card-dest-avaliacao">' +
              '<div class="card-dest-star-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>' +
              '<div class="card-dest-nota">' + p.avaliacao + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="card-dest-info">' + SVG_DRONE + '<span class="card-dest-info-txt">' + (p.drone || '—') + '</span></div>' +
          '<div class="card-dest-info" style="margin-top:4px">' + SVG_SHIELD + '<span class="card-dest-info-txt">Empresa verificada</span></div>' +
        '</div>' +
      '</div>'
    ).join("");
}

// ════════════════════════════════════════════════════════
// FUNÇÃO ABRIR PERFIL (URL AMIGÁVEL)
// ════════════════════════════════════════════════════════

function abrirPerfil(slug) {
  window.location.href = '/empresa/' + slug;
}

// ─────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────

carregarEmpresas();
