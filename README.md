# Marketing SVN — Sistema de Análise de Campanhas Digitais

Teste técnico para desenvolvedor. Sistema completo que consolida dados de campanhas em PostgreSQL, calcula métricas de desempenho, expõe uma API REST e realiza previsões com Regressão Linear.

---

## Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Banco de Dados | PostgreSQL 16 (Docker) |
| API | Node.js + Express |
| Geração de Dados | @faker-js/faker (pt_BR) + fast-csv |
| HTTP Client | Axios |
| Machine Learning | Python + scikit-learn + numpy |
| Envio de E-mail | Python smtplib |
| Dashboard | HTML + Chart.js (CDN) |
| Infraestrutura | Docker Compose |

---

## Estrutura do Projeto

```
marketing-svn-test/
├── api/
│   ├── db.js               # Conexão com PostgreSQL (dotenv)
│   ├── server.js           # Servidor Express + static
│   └── routes/
│       └── campanhas.js    # Todas as rotas da API
├── database/
│   ├── schema.sql          # CREATE TABLE + dados iniciais
│   └── queries.sql         # Queries analíticas (CTR, CPA, ROI)
├── scripts/
│   ├── seed-demo.js        # Popula o banco com dados
│   ├── generate-data.js    # Gera dados fictícios (Faker) + JSON/CSV
│   └── predict.py          # Regressão Linear + envio de e-mail
├── public/
│   ├── index.html          # Dashboard
│   └── favicon.svg
├── output/                 # Gerado automaticamente
│   ├── relatorio.json
│   ├── relatorio.csv
│   └── previsao.json
├── .env
├── docker-compose.yml
├── package.json
└── requirements.txt
```

---

## Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org) 18+
- [Python](https://python.org) 3.10+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Passo a Passo Completo

```powershell
# 1. Subir o banco de dados PostgreSQL
docker-compose up -d

# 2. Instalar dependências JavaScript
npm install

# 3. Instalar dependências Python
python -m pip install -r requirements.txt

# 4. Popular o banco com dados
npm run seed

# 5. Gerar relatório com Faker.js (JSON + CSV)
npm run generate

# 6. Executar previsão com Regressão Linear
python scripts/predict.py

# 7. Subir a API e o dashboard
npm start
# Acesse: http://localhost:3000
```

---

## Parte 1 — Gestão de Banco de Dados (SQL)

**Arquivos:** `database/schema.sql` e `database/queries.sql`

Duas tabelas relacionais:

```sql
campanhas (id, nome, data_inicio, data_fim, orcamento)
metricas  (id, campanha_id FK, data_metrica, impressoes, cliques, conversoes, custo_por_clique)
```

### Queries Analíticas

**CTR e CPA por campanha:**
```sql
  SELECT 
    campanhas.nome,
    ROUND((SUM(metricas.cliques)::DECIMAL / 
    NULLIF(SUM(metricas.impressoes), 0)) * 100, 2) AS CTR,
    ROUND(campanhas.orcamento / 
    NULLIF(SUM(metricas.conversoes), 0), 2) AS CPA
  FROM campanhas
      INNER JOIN metricas ON metricas.campanha_id = campanhas.id
  GROUP BY 
    campanhas.id, campanhas.nome, campanhas.orcamento
  ORDER BY ctr DESC;
```

**Campanha com melhor ROI:**
```sql
  SELECT 
    campanhas.nome, 
    SUM(metricas.conversoes) * 100 AS Receita,
    ROUND(((SUM(metricas.conversoes) * 100 - campanhas.orcamento) / 
    NULLIF(campanhas.orcamento, 0)) * 100, 2) AS ROI_PCT, 
    RANK() 
    OVER (
      ORDER BY (SUM(metricas.conversoes)*100-campanhas.orcamento) / 
      NULLIF(campanhas.orcamento,0) DESC
    ) AS ranking
  FROM campanhas
    INNER JOIN metricas ON metricas.campanha_id = campanhas.id
  GROUP BY campanhas.id ORDER BY ranking;
```

### Resultados dos Dados

| Campanha | CTR | CPA | ROI |
|----------|-----|-----|-----|
| Google Ads | 5,00% | R$ 13,81 | 624% |
| Facebook Ads | 4,00% | R$ 14,56 | 587% |
| **Instagram Ads** | **5,00%** | **R$ 12,90** | **675% 🏆** |

---

## Parte 2 — Dados e Mensuração

**Arquivo:** `scripts/generate-data.js`

Gera dados fictícios com `@faker-js/faker` para as 3 campanhas e calcula:

| Métrica | Fórmula |
|---------|---------|
| Taxa de Conversão | `(conversoes / cliques) * 100` |
| ROAS | `(receita_gerada / orcamento) * 100` |
| Receita Estimada | `conversoes * 100` |
| ROI | `((receita - orcamento) / orcamento) * 100` |

```powershell
npm run generate
# Saída: output/relatorio.json e output/relatorio.csv
```

---

## Parte 3 — Integração de Sistemas (API REST)

**Arquivos:** `api/server.js` e `api/routes/campanhas.js`

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/webhook` | Recebe dados de campanha e salva na tabela `metricas` |
| `GET` | `/campanhas` | Lista todas as campanhas do banco |
| `GET` | `/campanhas/:id/metricas` | Retorna CTR e CPA consolidados por campanha |
| `GET` | `/campanhas/:id/externos` | Bônus Axios — consolida banco + fonte externa simulada |
| `GET` | `/relatorio` | Serve `output/relatorio.json` |
| `GET` | `/previsao` | Serve `output/previsao.json` |

### Exemplo — POST /webhook

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"campanha_id":1,"impressoes":50000,"cliques":2500,"conversoes":200,"custo_por_clique":2.00}'
```

### Exemplo — GET /campanhas/3/metricas

```json
{
  "Nome": "Instagram Ads",
  "Impressoes": "77500",
  "Cliques": "3875",
  "Conversoes": "310",
  "CTR": "5.00",
  "CPA": "12.90"
}
```

### Bônus Axios — GET /campanhas/:id/externos

Tenta buscar `https://api.ads-fake.com`. Como não existe, retorna payload simulado automaticamente:

```json
{
  "banco_de_dados": { "Nome": "Instagram Ads", "CTR": "5.00", "CPA": "12.90" },
  "fonte_externa":  { "fonte": "simulado", "impressoes_externas": 3240, "cliques_externos": 280 }
}
```

---

## Bônus — Regressão Linear + E-mail (Python)

**Arquivo:** `scripts/predict.py`

### O que faz

1. Lê `output/relatorio.json`
2. Treina `LinearRegression` por campanha (X = cliques, y = conversões)
3. Prevê conversões para cliques médios × 1,1 (+10%)
4. Salva `output/previsao.json`
5. Envia relatório HTML por e-mail (se configurado no `.env`)

```powershell
python scripts/predict.py
```

### Configuração de E-mail (opcional)

```env
EMAIL_REMETENTE=seu@gmail.com
EMAIL_SENHA=xxxx xxxx xxxx xxxx   # App Password — Conta Google > Segurança > Senhas de app
EMAIL_DESTINATARIO=destino@email.com
```

---

## Dashboard

Acesse **http://localhost:3000** com a API rodando.

Funciona também **offline** — carrega dados de demonstração se a API estiver fora do ar.

---

## Comandos de Referência Rápida

```powershell
docker-compose up -d          # Sobe o PostgreSQL
npm run seed                  # Limpa banco e insere dados
npm run generate              # Gera relatorio.json e relatorio.csv com Faker
python scripts/predict.py     # Treina modelo e salva previsao.json
npm start                     # Inicia API + dashboard (porta 3000)
docker-compose down           # Para o banco
```
