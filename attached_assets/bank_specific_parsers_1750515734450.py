# bank_specific_parsers.py

import re
from datetime import datetime
import pandas as pd

# Importa as funções auxiliares de parsing de data e valor
# from data_parsing import parse_date_string, parse_financial_value, _identificar_tipo_transacao_simples


def parse_nubank_extrato_pdf(text_content: str, doc_type: str) -> list[dict]:
    """
    Parser específico para extratos do Nubank em PDF (texto extraído via pdfplumber ou OCR).
    Adapta a saída para o formato de transação padrão do sistema.
    """
    transactions = []
    lines = text_content.split('\n')
    current_year = datetime.now().year

    for line in lines:
        line_clean = line.strip()
        # Padrão Nubank: DD/MM - Descrição - R$ VALOR (pode haver saldo no final da linha)
        # Ex: 12/03 - Pix recebido de FULANO - R$ 20.000,00 Saldo R$ 5.851,34
        # Padrão flexível para capturar o valor corretamente, com ou sem "R$"
        padrao_nubank = r'(\d{1,2}/\d{1,2})\s+-\s+(.+?)\s+-\s*R?\$?\s*([-]?[\d\.,]+)(?:\s+Saldo R?\$?\s*[\d\.,]+)?'
        match = re.search(padrao_nubank, line_clean)

        if match:
            data_raw = match.group(1)
            description = match.group(2).strip()
            value_str = match.group(3)

            date_obj = parse_date_string(data_raw, current_year)
            value_num = parse_financial_value(value_str)

            if date_obj is None or value_num is None:
                continue

            # A lógica de sinal já é tratada por _identificar_tipo_transacao_simples no `data_parsing.extract_transactions`
            # mas podemos reforçar aqui para especificidade do Nubank
            if any(term in description.lower() for term in ['pagamento realizado', 'transferencia enviada', 'compra', 'débito', 'saída']):
                value_num = -abs(value_num)
            elif any(term in description.lower() for term in ['transferencia recebida', 'depósito', 'pix recebido', 'entrada', 'salario']):
                value_num = abs(value_num)
            # Caso contrário, o sinal já presente no valor será mantido.

            transactions.append({
                'date': date_obj,
                'description': description,
                'value': value_num,
                'currency': 'BRL',
                'doc_type': doc_type,
                'original_type_op': _identificar_tipo_transacao_simples(description)
            })
    return transactions

def parse_c6_fatura_pdf(text_content: str, doc_type: str) -> list[dict]:
    """
    Parser específico para faturas do C6 Bank em PDF (texto extraído via pdfplumber ou OCR).
    Adapta a saída para o formato de transação padrão do sistema.
    """
    transactions = []
    lines = text_content.split('\n')
    current_year = datetime.now().year
    
    for line in lines:
        line_clean = line.strip()
        
        # Ignorar linhas de cabeçalho, rodapé e resumos que não são transações individuais de compra/crédito
        if any(keyword in line_clean.lower() for keyword in [
            'saldo total', 'limite total', 'vencimento', 'pagamento mínimo',
            'c6 black', 'subtotal', 'total a pagar', 'parcelamento de fatura',
            'juros rotativo', 'cet do financiamento', 'iof do rotativo', 'encargos', 'impostos',
            'compras nacionais', 'compras internacionais', 'valores creditados'
        ]):
            continue
        
        # Padrões para transações de fatura C6:
        # 1. "DD MMM Estabelecimento R$ VALOR" (comum em resumos de fatura)
        # Ex: "01 mai IFD IMPERIO DO CALDO L 102,99"
        # 2. Linhas de tabelas OCR com "Data Tipo Descrição Valor" (do seu extrato C6 como "Débito de Cartão")
        # Ex: "12/03 Débito de Cartão MEEP PA CLUBE NAUTICO SETE LAGOAS BRA R$ 31,00"
        # 3. Inclusão de Pagamento/Estorno: "DD MMM Inclusao de Pagamento R$ VALOR"
        
        padrao_fatura_compra = r'(\d{1,2}\s+[A-Za-z]{3,})\s+(.+?)\s+R?\$?\s*([\d\.,]+)'
        padrao_tabular_extrato_style = r'(\d{2}/\d{2})\s+(Entrada PIX|Saida PIX|Débito de Cartão|Pagamento|Outros gastos)\s+(.+?)\s+(R\$?\s*[-]?[\d\.,]+)'
        
        match_fatura_compra = re.search(padrao_fatura_compra, line_clean, re.IGNORECASE)
        match_tabular_extrato = re.search(padrao_tabular_extrato_style, line_clean, re.IGNORECASE)

        data_raw, description, value_str, original_type_op = None, None, None, None

        if match_tabular_extrato: # Captura transações do extrato C6 (se a fatura for lida como extrato)
            data_raw = match_tabular_extrato.group(1)
            original_type_op = match_tabular_extrato.group(2).strip()
            description = match_tabular_extrato.group(3).strip()
            value_str = match_tabular_extrato.group(4)
        elif match_fatura_compra: # Captura compras/créditos de fatura
            data_raw = match_fatura_compra.group(1)
            description = match_fatura_compra.group(2).strip()
            value_str = match_fatura_compra.group(3)
            original_type_op = 'Débito de Cartão' # Assumir débito para padrão de fatura, será ajustado abaixo
        
        if data_raw and description and value_str:
            date_obj = parse_date_string(data_raw, current_year)
            value_num = parse_financial_value(value_str)
            
            if date_obj is None or value_num is None:
                continue

            # Lógica para fatura: estorno/pagamento é crédito, o resto é débito
            if 'estorno' in description.lower() or 'inclusao de pagamento' in description.lower() or \
               'pagamento efetuado' in description.lower() or 'pgto fat' in description.lower() or \
               'credito' in description.lower():
                value_num = abs(value_num) # Créditos são positivos na fatura
                original_type_op = original_type_op or "Crédito na Fatura"
            else:
                value_num = -abs(value_num) # Compras/débitos são negativos
                original_type_op = original_type_op or "Débito de Cartão"

            transactions.append({
                'date': date_obj,
                'description': description,
                'value': value_num,
                'currency': 'BRL',
                'doc_type': doc_type,
                'original_type_op': original_type_op
            })
    return transactions

# Adicione aqui outros parsers específicos para PDFs de outros bancos
# def parse_bancox_extrato_pdf(text_content: str, doc_type: str) -> list[dict]: ...
# def parse_bancoy_fatura_pdf(text_content: str, doc_type: str) -> list[dict]: ...