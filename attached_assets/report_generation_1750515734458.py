# report_generation.py

import pandas as pd
import numpy as np
from datetime import datetime

# Importa as funções auxiliares de parsing para formatação (ex: parse_financial_value)
# from data_parsing import parse_financial_value


def generate_extrato_summary(inputs_df: pd.DataFrame, outputs_df: pd.DataFrame) -> pd.DataFrame:
    """
    Gera um resumo consolidado das entradas e saídas do extrato por categoria específica,
    incluindo totais e percentuais.
    """
    summary_data = []

    if not inputs_df.empty:
        inputs_by_specific_category = inputs_df.groupby('specific_category')['value'].sum().reset_index()
        inputs_by_specific_category.rename(columns={'value': 'Total'}, inplace=True)
        inputs_by_specific_category['Tipo'] = 'Entrada'
        summary_data.append(inputs_by_specific_category)

    if not outputs_df.empty:
        outputs_by_specific_category = outputs_df.groupby('specific_category')['value'].sum().reset_index()
        outputs_by_specific_category.rename(columns={'value': 'Total'}, inplace=True)
        outputs_by_specific_category['Tipo'] = 'Saída'
        summary_data.append(outputs_by_specific_category)

    if not summary_data:
        return pd.DataFrame({"Categoria": [], "Entrada": [], "Saída": [], "Total": [], "% do Total de Entrada": [], "% do Total de Saída": []})
    
    full_summary = pd.concat(summary_data, ignore_index=True)
    pivot_summary = full_summary.pivot_table(index='specific_category', columns='Tipo', values='Total', aggfunc='sum', fill_value=0)
    pivot_summary.columns.name = None
    pivot_summary.index.name = 'Categoria'

    total_inputs_overall = pivot_summary['Entrada'].sum()
    total_outputs_overall = pivot_summary['Saída'].sum()

    pivot_summary['% do Total de Entrada'] = (pivot_summary['Entrada'] / total_inputs_overall * 100).replace([np.inf, -np.inf], 0).fillna(0).apply(lambda x: f"{x:.2f}%") if total_inputs_overall != 0 else '0.00%'
    pivot_summary['% do Total de Saída'] = (abs(pivot_summary['Saída']) / abs(total_outputs_overall) * 100).replace([np.inf, -np.inf], 0).fillna(0).apply(lambda x: f"{x:.2f}%") if total_outputs_overall != 0 else '0.00%'

    pivot_summary.loc['Total Geral'] = [
        total_inputs_overall,
        total_outputs_overall,
        '100.00%',
        '100.00%'
    ]
    # Formatar os totais gerais da linha 'Total Geral'
    pivot_summary.loc['Total Geral', 'Entrada'] = f"R$ {total_inputs_overall:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')
    pivot_summary.loc['Total Geral', 'Saída'] = f"R$ {total_outputs_overall:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')

    # Formatar os valores monetários nas colunas 'Entrada' e 'Saída'
    for col in ['Entrada', 'Saída']:
        if col in pivot_summary.columns:
            # Não formatar a linha 'Total Geral' novamente se já formatada
            pivot_summary[col] = pivot_summary[col].apply(lambda x: f"R$ {x:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',') if isinstance(x, (float, int)) else x)
    
    return pivot_summary

def generate_fatura_summary(card_transactions_df: pd.DataFrame, card_credits_df: pd.DataFrame, text_content: str) -> pd.DataFrame:
    """
    Gera um resumo da fatura de cartão de crédito, incluindo valores principais,
    limites e agrupamento de compras por categoria de gasto.
    """
    summary_list = []

    # Importa a função de parsing de valor
    # from data_parsing import parse_financial_value, parse_date_string # Certifique-se de que estão acessíveis
    
    # Extrair valores principais da fatura do texto completo
    total_fatura_match = re.search(r'Valor da fatura:\s*R\$?\s*([\d\.,]+)', text_content, re.IGNORECASE)
    vencimento_fatura_match = re.search(r'Vencimento:\s*(\d{2}/\d{2}/\d{4}|\d{1,2}\s+de\s+\w+)', text_content, re.IGNORECASE)
    limite_total_match = re.search(r'Limite total:\s*R\$?\s*([\d\.,]+)', text_content, re.IGNORECASE)
    limite_disponivel_match = re.search(r'Disponível\s*R\$?\s*([\d\.,]+)', text_content, re.IGNORECASE)
    parcelamento_info_match = re.search(r'(?:Parcelamento em \dx|Entrada \+ \dx de R\$?\s*[\d\.,]+).*?(?:R\$?\s*([\d\.,]+))', text_content, re.IGNORECASE | re.DOTALL) # Tenta pegar o valor do parcelamento


    total_fatura_value = parse_financial_value(total_fatura_match.group(1)) if total_fatura_match else None
    vencimento_fatura_date = parse_date_string(vencimento_fatura_match.group(1)) if vencimento_fatura_match else "Não Identificado"
    
    # Se a data de vencimento for datetime, formatar
    vencimento_fatura_display = vencimento_fatura_date.strftime('%d/%m/%Y') if isinstance(vencimento_fatura_date, datetime) else "Não Identificado"

    limite_total_value = parse_financial_value(limite_total_match.group(1)) if limite_total_match else None
    limite_disponivel_value = parse_financial_value(limite_disponivel_match.group(1)) if limite_disponivel_match else None
    
    parcelamento_val = parse_financial_value(parcelamento_info_match.group(1)) if parcelamento_info_match else None
    parcelamento_info_display = f"Entrada + parcelas (aprox. R$ {parcelamento_val:,.2f})".replace('.', '#').replace(',', '.').replace('#', ',') if parcelamento_val is not None else "Não detectado"


    summary_list.append({"Métrica": "Valor Total da Fatura (Vencimento)", "Valor": f"R$ {total_fatura_value:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',') if total_fatura_value is not None else "Não Identificado"})
    summary_list.append({"Métrica": "Data de Vencimento", "Valor": vencimento_fatura_display})
    summary_list.append({"Métrica": "Limite Total do Cartão", "Valor": f"R$ {limite_total_value:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',') if limite_total_value is not None else "Não Identificado"})
    summary_list.append({"Métrica": "Limite Disponível do Cartão", "Valor": f"R$ {limite_disponivel_value:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',') if limite_disponivel_value is not None else "Não Identificado"})
    summary_list.append({"Métrica": "Informações de Parcelamento/Rotativo", "Valor": parcelamento_info_display})


    total_card_purchases = card_transactions_df['value'].sum() if not card_transactions_df.empty else 0
    total_card_credits_sum = card_credits_df['value'].sum() if not card_credits_df.empty else 0
    
    summary_list.append({"Métrica": "Total de Compras/Débitos (Fatura)", "Valor": f"R$ {total_card_purchases:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')})
    summary_list.append({"Métrica": "Total de Créditos/Pagamentos (Fatura)", "Valor": f"R$ {total_card_credits_sum:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')})

    if not card_transactions_df.empty:
        purchases_by_category = card_transactions_df.groupby('specific_category')['value'].sum().reset_index()
        total_purchases_abs = abs(purchases_by_category['value'].sum())

        summary_list.append({"Métrica": "#### Gastos por Categoria (Cartão)", "Valor": ""})
        for _, row in purchases_by_category.iterrows():
            percent = (abs(row['value']) / total_purchases_abs * 100) if total_purchases_abs != 0 else 0
            summary_list.append({
                "Métrica": f"- {row['specific_category']}",
                "Valor": f"R$ {row['value']:,.2f} ({percent:.2f}%)".replace('.', '#').replace(',', '.').replace('#', ',')
            })
            
    return pd.DataFrame(summary_list)

def generate_general_financial_summary(inputs_extrato_df: pd.DataFrame, outputs_extrato_df: pd.DataFrame, card_transactions_df: pd.DataFrame, card_credits_df: pd.DataFrame) -> pd.DataFrame:
    """
    Gera um resumo financeiro geral consolidando dados do extrato e do cartão,
    com comparativos e percentuais.
    """
    total_extrato_inputs = inputs_extrato_df['value'].sum() if not inputs_extrato_df.empty else 0
    total_extrato_outputs = outputs_extrato_df['value'].sum() if not outputs_extrato_df.empty else 0
    
    total_card_expenditures = card_transactions_df['value'].sum() if not card_transactions_df.empty else 0
    total_card_credits_sum = card_credits_df['value'].sum() if not card_credits_df.empty else 0

    net_extrato_balance = total_extrato_inputs + total_extrato_outputs

    total_overall_outputs = total_extrato_outputs + total_card_expenditures

    summary_list = [
        {"Métrica": "Total de Entradas (Extrato)", "Valor": f"R$ {total_extrato_inputs:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')},
        {"Métrica": "Total de Saídas (Extrato)", "Valor": f"R$ {total_extrato_outputs:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')},
        {"Métrica": "Saldo Líquido da Conta (Extrato)", "Valor": f"R$ {net_extrato_balance:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')},
        {"Métrica": "Total de Compras/Débitos (Fatura Cartão)", "Valor": f"R$ {total_card_expenditures:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')},
        {"Métrica": "Total de Créditos/Pagamentos (Fatura Cartão)", "Valor": f"R$ {total_card_credits_sum:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')},
        {"Métrica": "Total Consolidado de Saídas (Extrato + Cartão)", "Valor": f"R$ {total_overall_outputs:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')},
        {"Métrica": "Saldo Geral Consolidado (Entradas Extrato - Saídas Consolidadas)", "Valor": f"R$ {(total_extrato_inputs + total_overall_outputs):,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')}
    ]

    df_summary = pd.DataFrame(summary_list)

    if total_extrato_inputs > 0:
        outputs_vs_inputs_percent = (abs(total_extrato_outputs) / total_extrato_inputs * 100)
        df_summary.loc[len(df_summary)] = {"Métrica": "Saídas (Extrato) em % das Entradas (Extrato)", "Valor": f"{outputs_vs_inputs_percent:.2f}%"}
        
        card_exp_vs_inputs_percent = (abs(total_card_expenditures) / total_extrato_inputs * 100)
        df_summary.loc[len(df_summary)] = {"Métrica": "Compras de Cartão em % das Entradas (Extrato)", "Valor": f"{card_exp_vs_inputs_percent:.2f}%"}

        overall_outputs_vs_inputs_percent = (abs(total_overall_outputs) / total_extrato_inputs * 100)
        df_summary.loc[len(df_summary)] = {"Métrica": "Saídas Consolidadas em % das Entradas (Extrato)", "Valor": f"{overall_outputs_vs_inputs_percent:.2f}%"}
    else:
        df_summary.loc[len(df_summary)] = {"Métrica": "Saídas (Extrato) em % das Entradas (Extrato)", "Valor": "N/A (Sem Entradas)"}
        df_summary.loc[len(df_summary)] = {"Métrica": "Compras de Cartão em % das Entradas (Extrato)", "Valor": "N/A (Sem Entradas)"}
        df_summary.loc[len(df_summary)] = {"Métrica": "Saídas Consolidadas em % das Entradas (Extrato)", "Valor": "N/A (Sem Entradas)"}

    total_pix_recebido = inputs_extrato_df[inputs_extrato_df['specific_category'] == 'PIX Recebido']['value'].sum() if not inputs_extrato_df.empty else 0
    total_pix_enviado = outputs_extrato_df[outputs_extrato_df['specific_category'] == 'PIX Enviado']['value'].sum() if not outputs_extrato_df.empty else 0

    df_summary.loc[len(df_summary)] = {"Métrica": "Total PIX Recebido", "Valor": f"R$ {total_pix_recebido:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')}
    df_summary.loc[len(df_summary)] = {"Métrica": "Total PIX Enviado", "Valor": f"R$ {total_pix_enviado:,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')}
    df_summary.loc[len(df_summary)] = {"Métrica": "Saldo Líquido de PIX", "Valor": f"R$ {(total_pix_recebido + total_pix_enviado):,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')}

    return df_summary