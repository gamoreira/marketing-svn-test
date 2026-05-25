SELECT 
    campanhas.nome,
    ROUND((SUM(metricas.cliques)::DECIMAL / NULLIF(SUM(metricas.impressoes), 0)) * 100, 2) AS CTR,
    ROUND(campanhas.orcamento / NULLIF(SUM(metricas.conversoes), 0), 2) AS CPA
FROM campanhas
    INNER JOIN metricas ON metricas.campanha_id = campanhas.id
GROUP BY 
    campanhas.id, campanhas.nome, campanhas.orcamento
ORDER BY ctr DESC;

SELECT 
    campanhas.nome, 
    SUM(metricas.conversoes) * 100 AS Receita,
    ROUND(((SUM(metricas.conversoes) * 100 - campanhas.orcamento) / NULLIF(campanhas.orcamento, 0)) * 100, 2) AS ROI_PCT, 
    RANK() 
    OVER (ORDER BY (SUM(metricas.conversoes)*100-campanhas.orcamento) / NULLIF(campanhas.orcamento,0) DESC ) AS ranking
FROM campanhas
    INNER JOIN metricas ON metricas.campanha_id = campanhas.id
GROUP BY campanhas.id ORDER BY ranking;

