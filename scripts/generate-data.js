const { faker } = require('@faker-js/faker/locale/pt_BR');
const fs = require('fs');
const path = require('path');
const { format } = require('@fast-csv/format');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const CAMPANHAS = [
  { id: 1, nome: 'Google Ads',    orcamento: 5000 },
  { id: 2, nome: 'Facebook Ads',  orcamento: 3000 },
  { id: 3, nome: 'Instagram Ads', orcamento: 4000 },
];

function gerarMetrica(campanha) {
  const impressoes  = faker.number.int({ min: 10000, max: 100000 });
  const cliques     = faker.number.int({ min: 500,   max: Math.floor(impressoes * 0.1) });
  const conversoes  = faker.number.int({ min: 10,    max: Math.floor(cliques * 0.2) });
  const cpc         = parseFloat((campanha.orcamento / cliques).toFixed(2));

  const taxaConversao = parseFloat(((conversoes / cliques) * 100).toFixed(2));
  const receitaGerada = conversoes * 100;
  const roas          = parseFloat(((receitaGerada / campanha.orcamento) * 100).toFixed(2));

  return {
    campanha_id:      campanha.id,
    campanha_nome:    campanha.nome,
    orcamento:        campanha.orcamento,
    data_metrica:     faker.date.between({ from: '2026-05-01', to: '2026-05-24' }).toISOString().split('T')[0],
    impressoes,
    cliques,
    conversoes,
    custo_por_clique: cpc,
    taxa_conversao:   taxaConversao,
    receita_gerada:   receitaGerada,
    roas,
  };
}

function gerarRelatorio() {
  const metricas = CAMPANHAS.flatMap(c =>
    Array.from({ length: faker.number.int({ min: 3, max: 7 }) }, () => gerarMetrica(c))
  );

  const resumo = CAMPANHAS.map(campanha => {

    const dados             = metricas.filter(m => m.campanha_id === campanha.id);
    const totalImpressoes   = dados.reduce((s, m) => s + m.impressoes,  0);
    const totalCliques      = dados.reduce((s, m) => s + m.cliques,     0);
    const totalConversoes   = dados.reduce((s, m) => s + m.conversoes,  0);
    const totalReceita      = totalConversoes * 100;
    const ctr               = parseFloat(((totalCliques / totalImpressoes) * 100).toFixed(2));
    const cpa               = parseFloat((campanha.orcamento / (totalConversoes || 1)).toFixed(2));
    const taxaConversao     = parseFloat(((totalConversoes / totalCliques) * 100).toFixed(2));
    const roas              = parseFloat(((totalReceita / campanha.orcamento) * 100).toFixed(2));
    const roi               = parseFloat((((totalReceita - campanha.orcamento) / campanha.orcamento) * 100).toFixed(2));

    return {
      campanha_id:       campanha.id,
      campanha_nome:     campanha.nome,
      orcamento:         campanha.orcamento,
      total_impressoes:  totalImpressoes,
      total_cliques:     totalCliques,
      total_conversoes:  totalConversoes,
      receita_estimada:  totalReceita,
      ctr,
      cpa,
      taxa_conversao:    taxaConversao,
      roas,
      roi,
    };
  });

  return { metricas, resumo };
}

function salvarJSON(dados, arquivo) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, arquivo), JSON.stringify(dados, null, 2), 'utf8');
  console.log(`JSON salvo: output/${arquivo}`);
}

function salvarCSV(linhas, arquivo) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  return new Promise((resolve, reject) => {
    const filePath = path.join(OUTPUT_DIR, arquivo);
    const writableStream = fs.createWriteStream(filePath);
    const csvStream = format({ headers: true });

    csvStream.pipe(writableStream);
    linhas.forEach(l => csvStream.write(l));
    csvStream.end();

    writableStream.on('finish', () => {
      console.log(`CSV salvo: output/${arquivo}`);
      resolve();
    });

    writableStream.on('error', reject);
  });
}

async function main() {
  
  console.log('Gerando dados fictícios...\n');
  const { metricas, resumo } = gerarRelatorio();

  salvarJSON({ gerado_em: new Date().toISOString(), metricas, resumo }, 'relatorio.json');
  await salvarCSV(resumo, 'relatorio.csv');

  console.log('\nResumo das campanhas:');
  console.table(resumo.map(r => ({
    Campanha:        r.campanha_nome,
    'Orcamento':     `R$ ${r.orcamento}`,
    CTR:             `${r.ctr}%`,
    CPA:             `R$ ${r.cpa}`,
    'Taxa Conv.':    `${r.taxa_conversao}%`,
    ROAS:            `${r.roas}%`,
    ROI:             `${r.roi}%`,
  })));
}

main().catch(console.error);
