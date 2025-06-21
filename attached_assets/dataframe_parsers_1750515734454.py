# dataframe_parsers.py

import pandas as pd
from datetime import datetime

# Importa as funções auxiliares de parsing de data e valor
# from data_parsing import parse_date_string, parse_financial_value, _identificar_tipo_transacao_simples
# from config import MAPPING_COLUNAS_PADRAO_GENERICO # Para o parser genérico


def _mapear_colunas_automaticamente(df: pd.DataFrame) -> dict[str, str]:
    """Mapeia colunas automaticamente baseado nos nomes e no MAPPING_COLUNAS_PADRAO_GENERICO."""
    mapeamento = {}
    colunas_lower_map = {str(col).lower().replace('.', '').replace('_', ' ').strip(): col for col in df.columns}
    
    # Usando o MAPPING_COLUNAS_PADRAO_GENERICO de config.py
    for standard_col, possible_names in MAPPING_COLUNAS_PADRAO_GENERICO.items():
        for name in possible_names:
            if name in colunas_lower_map:
                mapeamento[standard_col] = colunas_lower_map[name]
                break
    
    return mapeamento

def process_dataframe_generic(df: pd.DataFrame, doc_type: str) -> list[dict]:
    """Processa DataFrames genéricos (CSV/XLSX) tentando mapear colunas automaticamente."""
    transacoes = []
    
    mapeamento = _mapear_colunas_automaticamente(df)
    
    for _, row in df.iterrows():
        data_raw = str(row.get(mapeamento.get('data'), '')).strip()
        descricao = str(row.get(mapeamento.get('descricao'), '')).strip()
        valor_str = str(row.get(mapeamento.get('valor'), '0')).strip()
        
        if not data_raw or data_raw == 'nan':
            continue
        
        valor_num = parse_financial_value(valor_str)
        
        # Se não conseguiu parsear o valor principal, tentar colunas separadas para débito e crédito
        if valor_num is None or valor_num == 0: 
            debito_col = mapeamento.get('debito')
            credito_col = mapeamento.get('credito')
            
            debito_val = parse_financial_value(str(row.get(debito_col, '')).strip()) if debito_col else None
            credito_val = parse_financial_value(str(row.get(credito_col, '')).strip()) if credito_col else None
            
            if debito_val is not None and debito_val != 0:
                valor_num = -abs(debito_val)
            elif credito_val is not None and credito_val != 0:
                valor_num = abs(credito_val)
            else:
                continue # Não há valor válido na linha

        eh_entrada = valor_num >= 0
        original_type_op = "Entrada" if eh_entrada else "Saída"
        
        transacoes.append({
            'date': parse_date_string(data_raw),
            'description': descricao,
            'value': valor_num,
            'currency': 'BRL',
            'doc_type': doc_type,
            'original_type_op': original_type_op,
        })
    
    return transacoes

# --- Parsers Específicos para DataFrames de Bancos (Baseados na sua versão `dataframe_parsers.py`) ---

def process_nubank_extrato_csv(df: pd.DataFrame, doc_type: str) -> list[dict]:
    """Processa CSV de extrato do Nubank."""
    transacoes = []
    for _, row in df.iterrows():
        data = str(row.get('Data', '')).strip()
        descricao = str(row.get('Descrição', '')).strip()
        valor_str = str(row.get('Valor', '0')).strip()
        
        if not data or data == 'nan': continue
        
        valor_num = parse_financial_value(valor_str)
        if valor_num is None: continue

        eh_entrada = valor_num >= 0
        original_type_op = "Entrada" if eh_entrada else "Saída"
        
        transacoes.append({
            'date': parse_date_string(data),
            'description': descricao,
            'value': valor_num,
            'currency': 'BRL',
            'doc_type': doc_type,
            'original_type_op': _identificar_tipo_transacao_simples(descricao)
        })
    return transacoes

def process_nubank_fatura_csv(df: pd.DataFrame, doc_type: str) -> list[dict]:
    """Processa CSV de fatura do Nubank."""
    transacoes = []
    for _, row in df.iterrows():
        data = str(row.get('Data da transação', '')).strip()
        estabelecimento = str(row.get('Estabelecimento', '')).strip()
        valor_str = str(row.get('Valor', '0')).strip()
        
        if not data or data == 'nan': continue
        
        valor_num = -abs(parse_financial_value(valor_str) or 0) # Faturas são sempre saídas
        
        transacoes.append({
            'date': parse_date_string(data),
            'description': estabelecimento,
            'value': valor_num,
            'currency': 'BRL',
            'doc_type': doc_type,
            'original_type_op': _identificar_tipo_transacao_simples(estabelecimento)
        })
    return transacoes

def process_inter_extrato_csv(df: pd.DataFrame, doc_type: str) -> list[dict]:
    """Processa CSV de extrato do Inter."""
    transacoes = []
    for _, row in df.iterrows():
        data = str(row.get('Data', '')).strip()
        historico = str(row.get('Histórico', '')).strip()
        valor_str = str(row.get('Valor', '0')).strip()
        
        if not data or data == 'nan': continue
        
        valor_num = parse_financial_value(valor_str)
        if valor_num is None: continue

        eh_entrada = valor_num >= 0
        original_type_op = "Entrada" if eh_entrada else "Saída"
        
        transacoes.append({
            'date': parse_date_string(data),
            'description': historico,
            'value': valor_num,
            'currency': 'BRL',
            'doc_type': doc_type,
            'original_type_op': _identificar_tipo_transacao_simples(historico)
        })
    return transacoes

def process_inter_fatura_csv(df: pd.DataFrame, doc_type: str) -> list[dict]:
    """Processa CSV de fatura do Inter."""
    transacoes = []
    for _, row in df.iterrows():
        data = str(row.get('Data', '')).strip()
        descricao = str(row.get('Descrição', '')).strip()
        valor_str = str(row.get('Valor', '0')).strip()
        
        if not data or data == 'nan': continue
        
        valor_num = -abs(parse_financial_value(valor_str) or 0) # Faturas são sempre saídas
        
        transacoes.append({
            'date': parse_date_string(data),
            'description': descricao,
            'value': valor_num,
            'currency': 'BRL',
            'doc_type': doc_type,
            'original_type_op': _identificar_tipo_transacao_simples(descricao)
        })
    return transacoes

def process_caixa_extrato_csv(df: pd.DataFrame, doc_type: str) -> list[dict]:
    """Processa CSV/Excel de extrato da Caixa."""
    transacoes = []
    for _, row in df.iterrows():
        data = str(row.get('Data Mov.', '')).strip()
        historico = str(row.get('Histórico', '')).strip()
        
        if not data or data == 'nan': continue
        
        # A Caixa pode ter colunas separadas para débito e crédito
        debito_val = parse_financial_value(str(row.get('Débito', '')).strip())
        credito_val = parse_financial_value(str(row.get('Crédito', '')).strip())
        
        valor_num = None
        original_type_op = 'Outros'

        if debito_val is not None and debito_val != 0:
            valor_num = -abs(debito_val)
            original_type_op = 'Saída (Débito)'
        elif credito_val is not None and credito_val != 0:
            valor_num = abs(credito_val)
            original_type_op = 'Entrada (Crédito)'
        else: # Fallback para coluna 'Valor' se D/C não for usado
            valor_num = parse_financial_value(str(row.get('Valor', '0')).strip())
            if valor_num is None: continue
            original_type_op = "Entrada" if valor_num >= 0 else "Saída"

        transacoes.append({
            'date': parse_date_string(data),
            'description': historico,
            'value': valor_num,
            'currency': 'BRL',
            'doc_type': doc_type,
            'original_type_op': _identificar_tipo_transacao_simples(historico) # Reavalia com descrição
        })
    return transacoes

def process_picpay_fatura_csv(df: pd.DataFrame, doc_type: str) -> list[dict]:
    """Processa CSV de fatura do PicPay."""
    transacoes = []
    for _, row in df.iterrows():
        data = str(row.get('Data', '')).strip()
        descricao = str(row.get('Descrição', '')).strip()
        valor_str = str(row.get('Valor', '0')).strip()
        tipo_col = str(row.get('Tipo', '')).strip().lower() # Tipo na coluna (recebido/pago)
        
        if not data or data == 'nan': continue
        
        valor_num = parse_financial_value(valor_str)
        if valor_num is None: continue

        # Determinar entrada/saída pelo tipo da coluna ou valor
        if 'recebido' in tipo_col or 'entrada' in tipo_col:
            valor_num = abs(valor_num)
            original_type_op = 'Entrada'
        elif 'pago' in tipo_col or 'saida' in tipo_col:
            valor_num = -abs(valor_num)
            original_type_op = 'Saída'
        else:
            original_type_op = "Entrada" if valor_num >= 0 else "Saída"

        transacoes.append({
            'date': parse_date_string(data),
            'description': descricao,
            'value': valor_num,
            'currency': 'BRL',
            'doc_type': doc_type,
            'original_type_op': _identificar_tipo_transacao_simples(descricao)
        })
    return transacoes