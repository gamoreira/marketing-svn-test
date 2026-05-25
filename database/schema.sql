CREATE TABLE campanhas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    data_inicio DATE,
    data_fim DATE,
    orcamento DECIMAL(10, 2)
);

CREATE TABLE metricas (
    id SERIAL PRIMARY KEY,
    campanha_id INTEGER REFERENCES campanhas(id),
    data_metrica DATE,
    impressoes INTEGER,
    cliques INTEGER,
    conversoes INTEGER,
    custo_por_clique DECIMAL(10, 2)
);