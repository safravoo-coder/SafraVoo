// build.js — Gerador de site estático (SSG) para SafraVoo
const fs = require('fs');
const path = require('path');

// ════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ════════════════════════════════════════════════════════

const ORIGEM = __dirname;
const DESTINO = path.join(__dirname, 'dist');
const EMPRESAS_API = 'https://safravoo.com.br/.netlify/functions/empresas';

// Arquivos estáticos que serão copiados para a pasta dist
const ARQUIVOS_ESTATICOS = [
  'style.css',
  'script.js',
  'layout.png',
  'banner-produtor.png',
];

// ════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ════════════════════════════════════════════════════════

function limparPastas() {
  if (fs.existsSync(DESTINO)) {
    fs.rmSync(DESTINO, { recursive: true, force: true });
    console.log('🧹 Pasta dist/ removida');
  }
  fs.mkdirSync(DESTINO, { recursive: true });
  console.log('📁 Pasta dist/ criada');
}

function copiarArquivosEstaticos() {
  console.log('📄 Copiando arquivos estáticos...');
  ARQUIVOS_ESTATICOS.forEach((arquivo) => {
    const origem = path.join(ORIGEM, arquivo);
    const destino = path.join(DESTINO, arquivo);
    if (fs.existsSync(origem)) {
      fs.copyFileSync(origem, destino);
      console.log(`  ✅ ${arquivo} → dist/${arquivo}`);
    } else {
      console.warn(`  ⚠️ Arquivo não encontrado: ${arquivo}`);
    }
  });
}

function criarPastasEmpresas(empresas) {
  console.log('📁 Criando pastas para empresas...');
  empresas.forEach((empresa) => {
    const slug = empresa.slug || empresa.id;
    const pasta = path.join(DESTINO, 'empresa', slug);
    fs.mkdirSync(pasta, { recursive: true });
    console.log(`  ✅ empresa/${slug}/`);
  });
}

// ════════════════════════════════════════════════════════
// GERAR SITEMAP.XML
// ════════════════════════════════════════════════════════

function gerarSitemap(empresas) {
  const baseUrl = 'https://safravoo.com.br';
  const urls = [
    { loc: '/', priority: '1.0' },
  ];

  empresas.forEach((empresa) => {
    const slug = empresa.slug || empresa.id;
    urls.push({
      loc: `/empresa/${slug}`,
      priority: '0.8',
      lastmod: new Date().toISOString().split('T')[0],
    });
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <priority>${u.priority}</priority>
    ${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(DESTINO, 'sitemap.xml'), sitemap);
  console.log('✅ sitemap.xml gerado com ' + urls.length + ' URLs');
}

// ════════════════════════════════════════════════════════
// GERAR PERFIL.HTML PARA CADA EMPRESA
// ════════════════════════════════════════════════════════

function gerarPerfil(empresa) {
  const slug = empresa.slug || empresa.id;

  // Meta tags dinâmicas
  const titulo = `${empresa.nome} — SafraVoo`;
  const descricao = `${empresa.nome} em ${empresa.cidade || 'sua região'}. ${empresa.avaliacao || 0} estrelas em ${empresa.avaliacoes || 0} avaliações. ${empresa.servicos || 0} serviços realizados. ${empresa.bio || 'Solicite um orçamento agora.'}`;

  // Geração das culturas (mesma lógica do perfil.html)
  let culturasHtml = '';
  if (empresa.culturas && empresa.culturas.length > 0) {
    culturasHtml = empresa.culturas.map(c => 
      `<span class="cult-tag" style="background:#16A34A18;color:#16A34A;display:inline-block;margin:4px 6px 4px 0;padding:5px 14px;border-radius:50px;font-size:12px;font-weight:600;">${c}</span>`
    ).join(' ');
  } else {
    culturasHtml = '<span style="color:#A8A29E;font-size:13px;">Nenhuma cultura cadastrada</span>';
  }

  // Geração das estrelas
  let estrelasHtml = '';
  const nota = empresa.avaliacao || 0;
  for (let i = 1; i <= 5; i++) {
    if (nota >= i) {
      estrelasHtml += `<svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    } else {
      estrelasHtml += `<svg width="12" height="12" viewBox="0 0 24 24" fill="#E5E7EB" stroke="#E5E7EB" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-7GR2ZW1K2X"></script>
  <script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date()); gtag('config', 'G-7GR2ZW1K2X');
  </script>

  <!-- Meta tags dinâmicas (geradas pelo build) -->
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="theme-color" content="#16A34A"/>
  <title>${titulo}</title>
  <meta name="description" content="${descricao}">

  <!-- Open Graph (compartilhamento) -->
  <meta property="og:title" content="${titulo}">
  <meta property="og:description" content="${descricao}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://safravoo.com.br/empresa/${slug}">
  <meta property="og:image" content="${empresa.foto || 'https://safravoo.com.br/layout.png'}">

  <!-- Schema.org (dados estruturados) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "${empresa.nome}",
    "description": "${(empresa.bio || 'Especialista em drones agrícolas.').replace(/"/g, '\\"')}",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "${empresa.cidade || ''}"
    },
    "ratingValue": ${empresa.avaliacao || 0},
    "reviewCount": ${empresa.avaliacoes || 0},
    "image": "${empresa.foto || 'https://safravoo.com.br/layout.png'}"
  }
  </script>

  <link rel="stylesheet" href="/style.css">
</head>
<body>

<div id="tela-perfil">

  <!-- Cabeçalho com botão voltar -->
  <div class="perfil-header">
    <button class="back-btn" onclick="window.location.href='/'">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#57534E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 18-6-6 6-6"/>
      </svg>
    </button>
    <span class="perfil-title">Perfil da Empresa</span>
  </div>

  <!-- ===== CONTEÚDO ESTÁTICO (gerado no build) ===== -->
  <div class="perfil-hero-top">
    <div class="perfil-avatar">
      ${empresa.foto ? `<img src="${empresa.foto}" alt="${empresa.nome}">` : ''}
    </div>
    <div class="perfil-nome">${empresa.nome}</div>
    <div class="perfil-loc">📍 ${empresa.cidade || 'Localização não informada'}</div>
    <div class="perfil-badges">
      <div class="disp-badge" style="background:${empresa.disponivel ? '#DCFCE7' : '#FEE2E2'}">
        <div class="disp-dot" style="background:${empresa.disponivel ? '#16A34A' : '#DC2626'}"></div>
        <span class="disp-txt" style="color:${empresa.disponivel ? '#16A34A' : '#DC2626'}">
          ${empresa.disponivel ? 'Disponível agora' : 'Indisponível'}
        </span>
      </div>
      ${empresa.link_perfil ? `<a class="ver-perfil-btn" href="${empresa.link_perfil}" target="_blank" rel="noopener">Ver perfil completo ›</a>` : ''}
    </div>
  </div>

  <!-- Estatísticas -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon-svg"><svg width="26" height="26" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
      <div class="stat-val">${empresa.avaliacao || 0}</div>
      <div class="stat-stars">${estrelasHtml}</div>
      <div class="stat-lbl">Avaliação</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-svg"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="1.8"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/></svg></div>
      <div class="stat-val">${empresa.servicos || 0}</div>
      <div class="stat-lbl">Serviços realizados</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-svg"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>
      <div class="stat-val">${empresa.experiencia || '—'}${empresa.experiencia ? ' anos' : ''}</div>
      <div class="stat-lbl">Experiência</div>
    </div>
  </div>

  <!-- Corpo do perfil -->
  <div class="perfil-body">
    <div class="info-card">
      <h3>Sobre</h3>
      <p>${empresa.bio || 'Empresa especializada em serviços agrícolas com drones.'}</p>
    </div>
    <div class="info-card">
      <h3>Equipamento</h3>
      <div class="equip-row">
        <div>
          <div class="equip-lbl">Drone</div>
          <div class="equip-val">${empresa.drone || '—'}</div>
        </div>
        <div>
          <div class="equip-lbl">Área máx/dia</div>
          <div class="equip-val">${empresa.area_max || '—'} ha</div>
        </div>
      </div>
    </div>
    <div class="info-card">
      <h3>Culturas atendidas</h3>
      <div class="cult-tags" style="display:flex;flex-wrap:wrap;gap:4px;">${culturasHtml}</div>
    </div>
    <div class="info-card">
      <h3>Avaliações</h3>
      <div id="lista-avaliacoes"><p style="color:#A8A29E;font-size:13px;">Carregando avaliações...</p></div>
      <button onclick="window.location.href='/avaliar/${slug}'" style="margin-top:12px;background:#F0EBE3;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;color:#57534E;cursor:pointer;">➕ Adicionar avaliação</button>
    </div>
  </div>

  <!-- Botão de ação fixo -->
  <div class="cta-fixo">
    <div class="cta-btns">
      ${empresa.orcamento ? `<a href="${empresa.orcamento}" target="_blank" class="btn-orc">💰 Solicitar orçamento</a>` : ''}
      ${empresa.whatsapp ? `<a href="https://wa.me/${empresa.whatsapp}" target="_blank" class="btn-wpp">💬 WhatsApp</a>` : ''}
    </div>
  </div>

</div>

<script src="/script.js"></script>
</body>
</html>`;

  const caminho = path.join(DESTINO, 'empresa', slug, 'index.html');
  fs.writeFileSync(caminho, html);
  console.log(`  ✅ empresa/${slug}/index.html`);
}

// ════════════════════════════════════════════════════════
// GERAR INDEX.HTML (HOME)
// ════════════════════════════════════════════════════════

function gerarIndex() {
  const origem = path.join(ORIGEM, 'index.html');
  const destino = path.join(DESTINO, 'index.html');
  if (fs.existsSync(origem)) {
    let conteudo = fs.readFileSync(origem, 'utf-8');
    // Ajusta caminhos para produção (se necessário)
    fs.writeFileSync(destino, conteudo);
    console.log(`  ✅ index.html`);
  } else {
    console.warn('  ⚠️ index.html não encontrado');
  }
}

// ════════════════════════════════════════════════════════
// DADOS DE FALLBACK (caso a API não esteja disponível)
// ════════════════════════════════════════════════════════

function carregarEmpresasFallback() {
  return [
    {
      id: '1',
      slug: 'pulveriza-drones',
      nome: 'Pulveriza Drones',
      foto: '',
      cidade: 'Lavras, MG',
      avaliacao: 4.9,
      avaliacoes: 100,
      drone: 'DJI T70P',
      culturas: ['Café', 'Soja', 'Cana'],
      disponivel: true,
      destaque: true,
      servicos: 400,
      bio: 'Há 4 anos no mercado, a Pulveriza Drones já realizou mais de 10.000 hectares de operações em Minas Gerais.',
      orcamento: '/orcamento/pulveriza-drones',
      experiencia: 4,
      whatsapp: '5535999999999',
      email: 'contato@pulverizadrones.com',
      servicos_lista: 'Pulverização Aérea\nMapeamento de Lavoura',
      culturas_lista: 'Café\nSoja\nCana\nMilho',
      link_perfil: '',
      servicos_ids: ['pulverizacao', 'mapeamento']
    },
    {
      id: '2',
      slug: 'entre-tech-drones',
      nome: 'Entre Tech Drones',
      foto: '',
      cidade: 'Entre Rios, MG',
      avaliacao: 4.9,
      avaliacoes: 100,
      drone: 'DJI T20P',
      culturas: ['Pastagem', 'Milho', 'Soja'],
      disponivel: true,
      destaque: true,
      servicos: 600,
      bio: 'A Entre Tech Drones é uma empresa especializada em pulverização de grãos com tecnologia de ponta.',
      orcamento: '/orcamento/entre-tech-drones',
      experiencia: 3,
      whatsapp: '5535888888888',
      email: 'contato@entretechdrones.com',
      servicos_lista: 'Pulverização Aérea',
      culturas_lista: 'Pastagem\nMilho\nSoja\nFeijão',
      link_perfil: '',
      servicos_ids: ['pulverizacao']
    },
    {
      id: '3',
      slug: 'safra-aerea',
      nome: 'Safra Aérea',
      foto: '',
      cidade: 'Araxá, MG',
      avaliacao: 4.7,
      avaliacoes: 27,
      drone: 'DJI T50',
      culturas: ['Cana', 'Café'],
      disponivel: true,
      destaque: true,
      servicos: 180,
      bio: 'Especialistas em grandes áreas.',
      orcamento: '/orcamento/safra-aerea',
      experiencia: 5,
      whatsapp: '',
      email: '',
      servicos_lista: 'Monitoramento de Lavoura',
      culturas_lista: 'Cana\nCafé',
      link_perfil: '',
      servicos_ids: ['monitoramento']
    },
    {
      id: '4',
      slug: 'campo-drone',
      nome: 'Campo Drone',
      foto: '',
      cidade: 'Frutal, MG',
      avaliacao: 4.6,
      avaliacoes: 19,
      drone: 'DJI T25',
      culturas: ['Limão', 'Laranja'],
      disponivel: true,
      destaque: true,
      servicos: 90,
      bio: 'Tecnologia para fruticultura.',
      orcamento: '/orcamento/campo-drone',
      experiencia: 2,
      whatsapp: '',
      email: '',
      servicos_lista: 'Pulverização\nMapeamento\nMonitoramento',
      culturas_lista: 'Limão\nLaranja',
      link_perfil: '',
      servicos_ids: ['pulverizacao', 'mapeamento', 'monitoramento']
    },
    {
      id: '5',
      slug: 'verde-voo',
      nome: 'Verde Voo',
      foto: '',
      cidade: 'Lavras, MG',
      avaliacao: 5.0,
      avaliacoes: 61,
      drone: 'DJI T70P',
      culturas: ['Feijão', 'Trigo'],
      disponivel: true,
      destaque: true,
      servicos: 500,
      bio: 'Referência em grãos e cereais.',
      orcamento: '/orcamento/verde-voo',
      experiencia: 6,
      whatsapp: '',
      email: '',
      servicos_lista: 'Mapeamento\nMonitoramento',
      culturas_lista: 'Feijão\nTrigo',
      link_perfil: '',
      servicos_ids: ['mapeamento', 'monitoramento']
    }
  ];
}

// ════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL
// ════════════════════════════════════════════════════════

async function build() {
  console.log('\n🚀 Iniciando build do SafraVoo...\n');

  // 1. Limpar pasta dist
  limparPastas();

  // 2. Copiar arquivos estáticos
  copiarArquivosEstaticos();

  // 3. Gerar index.html
  gerarIndex();

  // 4. Buscar empresas do Airtable
  console.log('📡 Buscando dados do Airtable...');
  let empresas = [];

  try {
    const resposta = await fetch(EMPRESAS_API);
    if (resposta.ok) {
      const dados = await resposta.json();
      empresas = dados.empresas || [];
      console.log(`  ✅ ${empresas.length} empresas encontradas via API`);
    } else {
      console.warn(`  ⚠️ API retornou status ${resposta.status}, usando fallback`);
      empresas = carregarEmpresasFallback();
    }
  } catch (erro) {
    console.warn('  ⚠️ Erro ao buscar API:', erro.message);
    console.log('  📦 Usando dados de fallback (mock)');
    empresas = carregarEmpresasFallback();
  }

  // 5. Criar pastas
  criarPastasEmpresas(empresas);

  // 6. Gerar páginas para cada empresa
  console.log('📄 Gerando páginas de perfil...');
  empresas.forEach((empresa) => {
    gerarPerfil(empresa);
  });

  // 7. Gerar sitemap
  gerarSitemap(empresas);

  console.log('\n✅ Build concluído com sucesso!\n');
  console.log(`📁 Pasta dist/ pronta para publicação`);
  console.log(`📄 ${empresas.length} empresas processadas`);
  console.log(`📍 ${empresas.length} perfis criados`);
}

// ════════════════════════════════════════════════════════
// EXECUTAR BUILD
// ════════════════════════════════════════════════════════

build();
