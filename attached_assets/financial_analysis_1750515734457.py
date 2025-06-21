# financial_analysis.py

import pandas as pd
import numpy as np
from datetime import datetime
import re

# Importa as configurações globais para detecção de apostas
# from config import SITES_APOSTAS, PROCESSADORAS_PAGAMENTO_NAO_APOSTA
# Importa as funções de parsing
# from data_parsing import parse_financial_value


def calculate_totals(df: pd.DataFrame) -> dict[str, float]:
    """Calcula o total de entradas, saídas e o saldo de um DataFrame de transações."""
    total_entrada = df[df["value"] >= 0]["value"].sum()
    total_saida = df[df["value"] < 0]["value"].sum()
    saldo = total_entrada + total_saida # Saídas já são negativas
    return {
        "entrada": total_entrada,
        "saida": total_saida,
        "saldo": saldo
    }

def calculate_score(df: pd.DataFrame) -> int:
    """Calcula um score financeiro baseado nas entradas e saídas."""
    total_entrada = df[df["value"] >= 0]["value"].sum()
    total_saida = abs(df[df["value"] < 0]["value"].sum()) # Valor absoluto para cálculo

    if total_entrada == 0 and total_saida == 0:
        return 0
    elif total_saida == 0:
        return 1000  # Nenhum gasto
    else:
        razao = total_entrada / (total_saida + 0.01) # Adiciona um pequeno valor para evitar zero
        score = int(500 + 500 * (razao / (razao + 1))) # Normaliza a razão entre 0 e 1, mapeia para 500-1000
        return min(1000, max(0, score)) # Garante que o score fique entre 0 e 1000

def group_by_month(df: pd.DataFrame) -> dict[str, dict[str, float]]:
    """Agrupa transações por mês, calculando entradas e saídas."""
    if df.empty:
        return {}
    df_copy = df.copy()
    df_copy["mes"] = pd.to_datetime(df_copy["date"], errors="coerce").dt.to_period("M").astype(str)
    df_copy.dropna(subset=['mes'], inplace=True) # Remove transações sem data válida
    
    agrupado = df_copy.groupby(["mes", "category"])["value"].sum().reset_index()
    resultado = {}
    for _, row in agrupado.iterrows():
        mes = row["mes"]
        tipo = row["category"]
        valor = row["value"]
        if mes not in resultado:
            resultado[mes] = {"Entrada": 0.0, "Saída": 0.0, "Saldo": 0.0}
        resultado[mes][tipo] += valor
        resultado[mes]["Saldo"] = resultado[mes]["Entrada"] + resultado[mes]["Saída"] # Saídas são negativas
    
    # Ordenar por mês
    return dict(sorted(resultado.items()))

def extrair_maiores_transacoes(transactions_df: pd.DataFrame, type_of_flow: str = 'Saída', limit: int = 10) -> list[dict]:
    """
    Extrai as maiores transações de um DataFrame, seja de entrada ou saída.
    Formato de saída adaptado para exibição.
    """
    if transactions_df.empty:
        return []

    if type_of_flow == 'Entrada':
        filtered_df = transactions_df[transactions_df['value'] >= 0].copy()
        filtered_df.sort_values(by='value', ascending=False, inplace=True)
    else: # Saída
        filtered_df = transactions_df[transactions_df['value'] < 0].copy()
        filtered_df['abs_value'] = abs(filtered_df['value'])
        filtered_df.sort_values(by='abs_value', ascending=False, inplace=True)

    results = []
    for _, row in filtered_df.head(limit).iterrows():
        results.append({
            'DATA': row['date'].strftime('%d/%m/%Y'),
            'TIPO': row['original_type_op'], # Tipo original como PIX, Débito, etc.
            'CATEGORIA_ESPECIFICA': row['specific_category'],
            'DESCRICAO': row['description'],
            'VALOR': f"R$ {abs(row['value']):,.2f}".replace('.', '#').replace(',', '.').replace('#', ','),
        })
    return results

def detectar_apostas_aprimorado(transactions_df: pd.DataFrame) -> list[dict]:
    """Detecta transações relacionadas a apostas com base em palavras-chave e valores."""
    apostas_detectadas = []

    # Certificar que SITES_APOSTAS e PROCESSADORAS_PAGAMENTO_NAO_APOSTA estão acessíveis
    # Eles devem ser importados do módulo config.py
    try:
        from config import SITES_APOSTAS, PROCESSADORAS_PAGAMENTO_NAO_APOSTA
    except ImportError:
        print("Erro: config.py não carregado ou variáveis não acessíveis para detecção de apostas.")
        return apostas_detectadas

    for _, t in transactions_df.iterrows():
        if pd.isna(t['description']):
            continue
        descricao_lower = t['description'].lower()
        
        # Ignorar processadoras legítimas
        if any(proc in descricao_lower for proc in PROCESSADORAS_PAGAMENTO_NAO_APOSTA):
            continue

        # Verificar sites de apostas
        if any(site in descricao_lower for site in SITES_APOSTAS):
            transaction_info = {
                'DATA': t['date'].strftime('%d/%m/%Y') if pd.notna(t['date']) else 'N/I',
                'DESCRICAO': t['description'],
                'VALOR': f"R$ {abs(t['value']):,.2f}".replace('.', '#').replace(',', '.').replace('#', ','),
                'ALERTA': ''
            }
            if t['value'] < 0:
                transaction_info['TIPO'] = 'Saída - Aposta Online'
                transaction_info['ALERTA'] = 'Detectada transação de SAÍDA para site de aposta.'
            else:
                transaction_info['TIPO'] = 'Entrada - Retorno de Aposta/Ganho'
                transaction_info['ALERTA'] = 'Detectada transação de ENTRADA de site de aposta.'
            
            apostas_detectadas.append(transaction_info)

    return apostas_detectadas

def detectar_movimentacoes_suspeitas(transactions_df: pd.DataFrame) -> list[dict]:
    """Detecta padrões suspeitos de movimentação."""
    suspeitas = []
    if transactions_df.empty: return suspeitas

    transactions_df['date'] = pd.to_datetime(transactions_df['date'], errors='coerce')
    transactions_df.dropna(subset=['date', 'value'], inplace=True)
    if transactions_df.empty: return suspeitas # Pode ficar vazio após dropna
    
    # 1. Padrão Circular: Recebe e repassa a maior parte no mesmo dia (apenas extrato)
    extrato_df = transactions_df[transactions_df['doc_type'] == 'extrato_bancario'].copy()
    if not extrato_df.empty:
        daily_transactions = extrato_df.groupby(extrato_df['date'].dt.date)
        for date, group in daily_transactions:
            total_entrada_dia = group[group['value'] >= 0]['value'].sum()
            total_saida_dia = abs(group[group['value'] < 0]['value'].sum())

            if total_entrada_dia > 500 and total_saida_dia >= total_entrada_dia * 0.85 and total_saida_dia > 0: # Alto volume e quase tudo sai
                suspeitas.append({
                    'DATA': date.strftime('%d/%m/%Y'),
                    'TIPO': 'Movimentação Circular (Pass-through)',
                    'DESCRICAO': f'Recebeu R$ {total_entrada_dia:,.2f} e repassou R$ {total_saida_dia:,.2f} no mesmo dia.',
                    'VALOR': f"R$ {total_entrada_dia:,.2f}".replace('.', '#').replace(',', '.').replace('#', ','),
                    'ALERTA': 'Padrão circular pode indicar "pass-through" de recursos. Verificar origem/destino.'
                })

        # 2. Múltiplas transações pequenas e sequenciais (possível estruturação)
        for date, group in daily_transactions:
            saidas_dia = group[group['value'] < 0].copy().sort_values(by='date')
            pequenas_saidas = saidas_dia[abs(saidas_dia['value']) < 1000] # Limite para "pequenas"

            if len(pequenas_saidas) >= 5 and abs(pequenas_saidas['value'].sum()) > 1500: # 5+ pequenas saídas somando mais de R$1500
                suspeitas.append({
                    'DATA': date.strftime('%d/%m/%Y'),
                    'TIPO': 'Possível Estruturação (Pequenas Saídas)',
                    'DESCRICAO': f'{len(pequenas_saidas)} transações de baixo valor totalizando R$ {abs(pequenas_saidas["value"].sum()):,.2f}.',
                    'VALOR': f"R$ {abs(pequenas_saidas['value'].sum()):,.2f}".replace('.', '#').replace(',', '.').replace('#', ','),
                    'ALERTA': 'Múltiplas pequenas saídas no mesmo dia. Pode ser tentativa de disfarçar transações maiores.'
                })
    
    # 3. Transações em horários atípicos (madrugada)
    for _, t in transactions_df.iterrows():
        if pd.notna(t['date']) and pd.notna(t['value']):
            hora = t['date'].hour
            if 0 <= hora <= 5 and abs(t['value']) > 500: # Valor considerável
                suspeitas.append({
                    'DATA': t['date'].strftime('%d/%m/%Y %H:%M'),
                    'TIPO': 'Horário Atípico (Madrugada)',
                    'DESCRICAO': t['description'],
                    'VALOR': f"R$ {abs(t['value']):,.2f}".replace('.', '#').replace(',', '.').replace('#', ','),
                    'ALERTA': 'Transação de valor considerável em horário incomum. Verificar legitimidade.'
                })

    return suspeitas

def analyze_risk(transactions_df: pd.DataFrame, text_content: str = "") -> dict[str, str]:
    """
    Analisa comportamentos de risco ou inadimplência,
    incluindo saldo negativo persistente, alto volume de pequenas saídas
    e uso do limite de crédito.
    """
    risk_indicators = {}
    if transactions_df.empty: return risk_indicators

    transactions_df['date'] = pd.to_datetime(transactions_df['date'], errors='coerce')
    transactions_df.dropna(subset=['date', 'value'], inplace=True)

    if transactions_df.empty: return risk_indicators

    # --- Análise do Extrato Bancário ---
    extrato_df = transactions_df[transactions_df['doc_type'] == 'extrato_bancario'].copy()
    if not extrato_df.empty:
        extrato_df = extrato_df.sort_values(by='date').reset_index(drop=True)
        extrato_df['running_balance'] = extrato_df['value'].cumsum()

        # Saldo negativo persistente
        negative_balances = extrato_df[extrato_df['running_balance'] < 0]
        if not negative_balances.empty:
            num_negative_days = negative_balances['date'].dt.date.nunique()
            min_negative_balance = negative_balances['running_balance'].min()
            risk_indicators['Saldo Negativo (Cheque Especial/Descoberto)'] = f"{num_negative_days} dias com saldo negativo (Mínimo: R$ {min_negative_balance:.2f})"
            if num_negative_days > 7 or abs(min_negative_balance) > 1000:
                risk_indicators['Alerta de Endividamento (Uso Recorrente de Descoberto)'] = "Alto: Uso frequente ou elevado do limite, indicando dependência de crédito."
            elif num_negative_days > 2:
                risk_indicators['Alerta de Endividamento (Uso Ocasional de Descoberto)'] = "Moderado: Saldo negativo ocasional. Monitorar."
        else:
            risk_indicators['Saldo Negativo (Cheque Especial/Descoberto)'] = "Nenhum período de saldo negativo identificado."

        # Inconsistência na renda vs. despesas (extrato)
        total_inputs_extrato = extrato_df[extrato_df['category'] == 'Entrada']['value'].sum()
        total_outputs_extrato = abs(extrato_df[extrato_df['category'] == 'Saída']['value'].sum())

        if total_inputs_extrato > 0:
            expenditure_ratio = total_outputs_extrato / total_inputs_extrato
            if expenditure_ratio > 1.1:
                risk_indicators['Risco: Despesas Superiores à Renda (Extrato)'] = f"Suas saídas (R$ {total_outputs_extrato:.2f}) excedem suas entradas (R$ {total_inputs_extrato:.2f}) em {(expenditure_ratio*100 - 100):.2f}%. Isso pode levar a endividamento."
            elif expenditure_ratio > 0.9:
                risk_indicators['Alerta: Margem Financeira Baixa (Extrato)'] = f"Suas despesas (R$ {total_outputs_extrato:.2f}) consomem {(expenditure_ratio*100):.2f}% de sua renda (R$ {total_inputs_extrato:.2f}). Baixa margem para imprevistos."
        else:
            risk_indicators['Inconsistência Renda/Despesas (Extrato)'] = "Sem entradas registradas para comparação ou entradas muito baixas."

    # --- Análise da Fatura de Cartão de Crédito ---
    fatura_df = transactions_df[transactions_df['doc_type'] == 'fatura_cartao'].copy()
    if not fatura_df.empty:
        total_card_expenses = abs(fatura_df[fatura_df['value'] < 0]['value'].sum())
        
        limite_total = None
        # Extrair limite total da fatura a partir do texto (passado do main_orchestrator)
        limite_total_match = re.search(r'Limite total:\s*R\$?\s*([\d\.,]+)', text_content, re.IGNORECASE)
        if limite_total_match:
            limite_total = parse_financial_value(limite_total_match.group(1))

        if limite_total is not None and limite_total > 0:
            utilization_rate = total_card_expenses / limite_total
            if utilization_rate > 0.8:
                risk_indicators['Risco: Alto Uso do Limite de Cartão'] = f"Utilização de {(utilization_rate*100):.2f}% do limite (R$ {total_card_expenses:.2f} de R$ {limite_total:.2f}). Indica alta dependência do cartão de crédito."
            elif utilization_rate > 0.5:
                risk_indicators['Alerta: Uso Moderado do Limite de Cartão'] = f"Utilização de {(utilization_rate*100):.2f}% do limite. Monitorar gastos."
        else:
            risk_indicators['Uso do Limite de Cartão'] = "Não foi possível determinar o limite total do cartão."

        # Padrão de Compra por Impulso (Cartão) - usando specific_category
        # As categorias de impulso devem ser as mesmas definidas em categorization_logic
        impulse_categories = ['Lazer e Entretenimento', 'Alimentação', 'Saúde', 'Vestuário e Acessórios', 'Tecnologia e Eletrônicos', 'Casa e Moradia']
        
        impulse_transactions_card = fatura_df[
            (fatura_df['value'] < 0) & # Saídas
            (fatura_df['specific_category'].isin(impulse_categories)) &
            (abs(fatura_df['value']) < 150) # Compras "pequenas" até R$150
        ].copy()

        if not impulse_transactions_card.empty:
            num_impulse_tx = len(impulse_transactions_card)
            total_impulse_value = abs(impulse_transactions_card['value'].sum())

            if num_impulse_tx > 15 and total_impulse_value > 300: # Mais de 15 pequenas compras totalizando mais de R$300
                risk_indicators['Risco: Padrão de Compra por Impulso (Cartão)'] = f"{num_impulse_tx} pequenas compras totalizando R$ {total_impulse_value:.2f}. Sugere análise de gastos discricionários."
            elif num_impulse_tx > 7 and total_impulse_value > 100:
                risk_indicators['Alerta: Padrão de Compra por Impulso (Cartão)'] = f"{num_impulse_tx} pequenas compras totalizando R$ {total_impulse_value:.2f}. Monitorar gastos impulsivos."
        else:
            risk_indicators['Padrão de Compra por Impulso (Cartão)'] = "Nenhum padrão significativo de compras por impulso no cartão identificado neste período."

        # Alerta de Pagamento Mínimo/Atraso (se presente na fatura)
        if re.search(r'Pagamento mínimo ou parcial', text_content, re.IGNORECASE) or \
           re.search(r'Atrasar ou pagar menos que o mínimo da fatura', text_content, re.IGNORECASE):
            risk_indicators['Alerta: Menção a Pagamento Mínimo/Atraso na Fatura'] = "A fatura contém menções a pagamento mínimo ou atraso, o que pode indicar dificuldades financeiras se for uma prática regular."

    return risk_indicators