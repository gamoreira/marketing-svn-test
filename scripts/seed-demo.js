/**
 * Seed de dados.
 * Limpa a tabela metricas e insere dados consistentes e realistas.
 *
 * Uso: npm run seed
 */

const pool = require('../api/db');

// Dados de demonstração — 5 registros semanais por campanha (Mai/2026)
// Narrativa: Instagram Ads tem melhor ROI, Google Ads maior volume
const METRICAS = [
  // campanha_id | data        | impressoes | cliques | conversoes | cpc
  // ── Google Ads (orçamento: R$ 5.000) ─────────────────────────────────
  [1, '2026-05-05', 18500,  925, 74, 5.41],
  [1, '2026-05-10', 21000, 1050, 84, 4.76],
  [1, '2026-05-15', 22500, 1125, 90, 4.44],
  [1, '2026-05-20', 20000, 1000, 80, 5.00],
  [1, '2026-05-24',  8500,  425, 34, 11.76],
  // ── Facebook Ads (orçamento: R$ 3.000) ───────────────────────────────
  [2, '2026-05-05', 13500,  540, 43, 5.56],
  [2, '2026-05-10', 15000,  600, 48, 5.00],
  [2, '2026-05-15', 15800,  632, 51, 4.75],
  [2, '2026-05-20', 14200,  568, 45, 5.28],
  [2, '2026-05-24',  6000,  240, 19, 12.50],
  // ── Instagram Ads (orçamento: R$ 4.000) ──────────────────────────────
  [3, '2026-05-05', 16000,  800, 64, 5.00],
  [3, '2026-05-10', 18000,  900, 72, 4.44],
  [3, '2026-05-15', 19500,  975, 78, 4.10],
  [3, '2026-05-20', 17500,  875, 70, 4.57],
  [3, '2026-05-24',  6500,  325, 26, 12.31],
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('TRUNCATE TABLE metricas RESTART IDENTITY');
    console.log('Tabela metricas limpa.');

    for (const [campanha_id, data_metrica, impressoes, cliques, conversoes, custo_por_clique] of METRICAS) {
      await client.query(
        `INSERT INTO metricas (campanha_id, data_metrica, impressoes, cliques, conversoes, custo_por_clique)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [campanha_id, data_metrica, impressoes, cliques, conversoes, custo_por_clique]
      );
    }

    await client.query('COMMIT');

    console.log(`\n${METRICAS.length} registros inseridos com sucesso!\n`);
    console.log('Resumo dos dados:');
    console.log('┌─────────────────┬───────────┬───────────┬───────────┬──────────┬──────────┐');
    console.log('│ Campanha        │ Conversoes│ Receita   │ CTR       │ CPA      │ ROI      │');
    console.log('├─────────────────┼───────────┼───────────┼───────────┼──────────┼──────────┤');
    console.log('│ Google Ads      │    362    │ R$ 36.200 │   5,00%   │ R$ 13,81 │   624%   │');
    console.log('│ Facebook Ads    │    206    │ R$ 20.600 │   4,00%   │ R$ 14,56 │   587%   │');
    console.log('│ Instagram Ads   │    310    │ R$ 31.000 │   5,00%   │ R$ 12,90 │   675%   │');
    console.log('└─────────────────┴───────────┴───────────┴───────────┴──────────┴──────────┘');
    console.log('\nMelhor ROI: Instagram Ads (675%) -- menor custo por conversao (R$ 12,90)');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao inserir dados:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
