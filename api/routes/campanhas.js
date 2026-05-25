const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Simula consumo de API externa de anúncios!
async function buscarDadosExternos(campanhaId) {
  try {
    const { data } = await axios.get(`https://api.ads-fake.com/data?campanha=${campanhaId}`, {
      timeout: 3000,
    });
    console.log(data);
    return data;
  } catch {
    // console.log('errro aquii');
    return {
      fonte: 'simulado',
      campanha_id: campanhaId,
      impressoes_externas: Math.floor(Math.random() * 5000) + 1000,
      cliques_externos: Math.floor(Math.random() * 500) + 100,
    };
  }
}

// Rota para receber métricas via webhook!
router.post('/webhook', async (req, res) => {

  try {

    const {
        campanha_id,
        impressoes,
        cliques,
        conversoes,
        custo_por_clique
    } = req.body;

    await db.query (
      `INSERT INTO metricas ( campanha_id, data_metrica, impressoes, cliques, 
      conversoes, custo_por_clique) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)`,
      [campanha_id, impressoes, cliques, conversoes, custo_por_clique]
    );

    res.json({
      success: true
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Erro ao cadastrar métrica!'
    });
  }
});

// Rota para obter métricas consolidadas de uma campanha!
router.get('/campanhas/:id/metricas', async (req, res) => {

  try {

    const { id } = req.params;

    const result = await db.query (
      `SELECT
          campanhas.nome AS Nome,
          SUM(metricas.impressoes) AS Impressoes,
          SUM(metricas.cliques) AS Cliques,
          SUM(metricas.conversoes) AS Conversoes,
          ROUND((SUM(metricas.cliques)::decimal / NULLIF(SUM(metricas.impressoes), 0)) * 100, 2) AS CTR,
          ROUND((campanhas.orcamento / NULLIF(SUM(metricas.conversoes), 0)), 2 ) AS CPA
      FROM campanhas
          INNER JOIN metricas ON metricas.campanha_id = campanhas.id
      WHERE 
        campanhas.id = $1
      GROUP BY campanhas.id`, [id]
    );

    if (!result.rows[0]) return res.status(404).json(null);
    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Erro ao realizar a consulta!'
    });
  }
});

// Rota para listar todas as campanhas!
router.get('/campanhas', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM campanhas ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar campanhas!' });
  }
});

// Rota para obter relatório consolidado e previsão de desempenho!
router.get('/relatorio', (req, res) => {
  const filePath = path.join(__dirname, '../../output/relatorio.json');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Relatório não encontrado. Execute: npm run generate' });
  }
});

// Rota para obter previsão de desempenho futuro!
router.get('/previsao', (req, res) => {
  const filePath = path.join(__dirname, '../../output/previsao.json');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Previsão não encontrada. Execute: python scripts/predict.py' });
  }
});

// Rota para obter dados consolidados do banco e de fonte externa!
router.get('/campanhas/:id/externos', async (req, res) => {
  try {
    const { id } = req.params;

    const [dbResult, externo] = await Promise.all([
      db.query(
        `SELECT
            campanhas.nome AS Nome,
            SUM(metricas.impressoes) AS Impressoes,
            SUM(metricas.cliques) AS Cliques,
            SUM(metricas.conversoes) AS Conversoes,
            ROUND((SUM(metricas.cliques)::decimal / NULLIF(SUM(metricas.impressoes), 0)) * 100, 2) AS CTR,
            ROUND((campanhas.orcamento / NULLIF(SUM(metricas.conversoes), 0)), 2) AS CPA
        FROM campanhas
        INNER JOIN metricas ON metricas.campanha_id = campanhas.id
        WHERE campanhas.id = $1
        GROUP BY campanhas.id`, [id]
      ),
      buscarDadosExternos(id),
    ]);

    res.json({
      banco_de_dados: dbResult.rows[0] || null,
      fonte_externa: externo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao consolidar dados externos!' });
  }
});

module.exports = router;