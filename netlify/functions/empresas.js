// netlify/functions/empresas.js
// SEM axios - usando fetch nativo do Node.js

exports.handler = async function(event, context) {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const TABELA_EMPRESAS = 'Empresas';

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABELA_EMPRESAS}`;
    
    const resposta = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`
      }
    });

    if (!resposta.ok) {
      throw new Error(`Erro na API: ${resposta.status}`);
    }

    const dados = await resposta.json();

    const empresas = dados.records.map(record => ({
      id: record.id,
      slug: record.fields.slug || record.id,
      nome: record.fields.nome || '',
      foto: record.fields.foto || '',
      cidade: record.fields.cidade || '',
      avaliacao: record.fields.avaliacao || 0,
      avaliacoes: record.fields.avaliacoes || 0,
      preco: record.fields.preco || 0,
      drone: record.fields.drone || '',
      area_max: record.fields.area_max || 0,
      culturas: Array.isArray(record.fields.culturas) ? record.fields.culturas : [],
      disponivel: !!record.fields.disponivel,
      destaque: !!record.fields.destaque,
      servicos: record.fields.servicos || 0,
      bio: record.fields.bio || '',
      avaliacoes_texto: record.fields.avaliacoes_texto || '',
      orcamento: record.fields.orcamento || '',
      link_perfil: record.fields.link_perfil || '',
      experiencia: record.fields.experiencia || 0,
      whatsapp: record.fields.whatsapp || '',
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        empresas,
        total: empresas.length,
        pagina: 1,
        temMais: false
      })
    };

  } catch (erro) {
    console.error('Erro:', erro);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        erro: 'Erro ao buscar empresas',
        detalhe: erro.message
      })
    };
  }
};
