import json
import os
import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
import datetime

import numpy as np
from sklearn.linear_model import LinearRegression

ROOT = Path(__file__).parent.parent
RELATORIO_PATH = ROOT / "output" / "relatorio.json"
PREVISAO_PATH  = ROOT / "output" / "previsao.json"


def carregar_dados():
    if not RELATORIO_PATH.exists():
        print(f"Arquivo nao encontrado: {RELATORIO_PATH}")
        print("Execute primeiro: npm run generate")
        sys.exit(1)

    with open(RELATORIO_PATH, encoding="utf-8") as f:
        return json.load(f)


def prever_conversoes(metricas: list) -> list:
    campanhas = {}
    for m in metricas:
        cid = m["campanha_id"]
        campanhas.setdefault(cid, {"nome": m["campanha_nome"], "cliques": [], "conversoes": []})
        campanhas[cid]["cliques"].append(m["cliques"])
        campanhas[cid]["conversoes"].append(m["conversoes"])

    previsoes = []
    for cid, dados in campanhas.items():
        X = np.array(dados["cliques"]).reshape(-1, 1)
        y = np.array(dados["conversoes"])

        modelo = LinearRegression()
        modelo.fit(X, y)

        cliques_futuros = np.mean(dados["cliques"]) * 1.1
        conversoes_previstas = max(0, round(float(modelo.predict([[cliques_futuros]])[0]), 2))
        r2 = round(float(modelo.score(X, y)), 4)

        previsoes.append({
            "campanha_id":          cid,
            "campanha_nome":        dados["nome"],
            "amostras":             len(dados["cliques"]),
            "cliques_futuros":      round(cliques_futuros, 0),
            "conversoes_previstas": conversoes_previstas,
            "coef_angular":         round(float(modelo.coef_[0]), 6),
            "intercepto":           round(float(modelo.intercept_), 4),
            "r2_score":             r2,
        })

    return previsoes


def gerar_html_relatorio(previsoes: list) -> str:
    linhas = "".join(
        f"<tr><td>{p['campanha_nome']}</td><td>{int(p['cliques_futuros'])}</td>"
        f"<td>{p['conversoes_previstas']}</td><td>{p['r2_score']}</td></tr>"
        for p in previsoes
    )
    agora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    return (
        "<html><body>"
        "<h2>Previsão de Conversões - Regressão Linear</h2>"
        "<table border='1' cellpadding='6' cellspacing='0'>"
        "<tr><th>Campanha</th><th>Cliques Futuros</th>"
        "<th>Conversões Previstas</th><th>R2 Score</th></tr>"
        f"{linhas}"
        "</table>"
        f"<p style='color:gray;font-size:12px'>Gerado em {agora}</p>"
        "</body></html>"
    )


def enviar_email(html: str):
    remetente    = os.getenv("EMAIL_REMETENTE")
    senha        = os.getenv("EMAIL_SENHA")
    destinatario = os.getenv("EMAIL_DESTINATARIO")
    host         = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    porta        = int(os.getenv("EMAIL_PORT", "587"))

    if not all([remetente, senha, destinatario]):
        print("Variaveis EMAIL_REMETENTE, EMAIL_SENHA e EMAIL_DESTINATARIO nao configuradas.")
        print("E-mail nao enviado (relatorio salvo em output/previsao.json).")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Relatorio de Previsação de Conversões - Marketing SVN"
    msg["From"]    = remetente
    msg["To"]      = destinatario
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(host, porta) as server:
        server.ehlo()
        server.starttls()
        server.login(remetente, senha)
        server.sendmail(remetente, destinatario, msg.as_string())

    print(f"E-mail enviado para {destinatario}")


def main():
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

    print("Carregando dados historicos...")
    dados = carregar_dados()
    metricas = dados.get("metricas", [])

    print(f"Treinando modelos com {len(metricas)} registros...")
    previsoes = prever_conversoes(metricas)

    PREVISAO_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(PREVISAO_PATH, "w", encoding="utf-8") as f:
        json.dump({"previsoes": previsoes}, f, indent=2, ensure_ascii=False)
    print(f"Previsao salva: {PREVISAO_PATH}")

    print("\nResultados:")
    for p in previsoes:
        print(
            f"  {p['campanha_nome']:15s} -> "
            f"{p['conversoes_previstas']:.0f} conversões previstas "
            f"(R2={p['r2_score']})"
        )

    html = gerar_html_relatorio(previsoes)
    enviar_email(html)


if __name__ == "__main__":
    main()
