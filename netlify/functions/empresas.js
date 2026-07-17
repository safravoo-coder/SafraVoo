// netlify/functions/empresas.js
const axios = require('axios');

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
    const resposta = await axios.get(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TABELA_EMPRESAS}`,
      {
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
      }
    );

    const empresas = resposta.data.records.map(record => ({
      id: record.id,
      slug: record.fields.slug || record.id, // ← NOVO: campo slug
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
      body: JSON.stringify({ erro: 'Erro ao buscar empresas' })
    };
  }
};
