# data_parsing.py

import pandas as pd
import re
from datetime import datetime

# Importações de módulos que serão definidos em outras células
# Para que o Code Interpreter reconheça, eles precisam ter sido colados antes
# from config import SITES_APOSTAS, PROCESSADORAS_PAGAMENTO_NAO_APOSTA
# from file_io_utils import detect_bank_from_filename, detect_file_type_by_filename
# from bank_specific_parsers import parse_nubank_extrato_pdf, parse_c6_fatura_pdf # Exemplo
# from dataframe_parsers import process_dataframe_generic, process_nubank_extrato_csv # Exemplo


def parse_date_string(date_str: str, current_year: int = None) -> datetime | None:
    """Tenta parsear uma string de data em vários formatos."""
    if current_year is None:
        current_year = datetime.now().year

    date_str = date_str.strip()
    if not date_str:
        return None

    # Normalizar meses abreviados em português para inglês, se necessário
    meses_abreviados_pt_en = {
        'jan': 'Jan', 'fev': 'Feb', 'mar': 'Mar', 'abr': 'Apr', 'mai': 'May', 'jun': 'Jun',
        'jul': 'Jul', 'ago': 'Aug', 'set': 'Sep', 'out': 'Oct', 'nov': 'Nov', 'dez': 'Dec'
    }
    
    # Manter original para tentar parsear formatos textuais
    original_date_str = date_str 
    for pt_abbr, en_abbr in meses_abreviados_pt_en.items():
        date_str = date_str.lower().replace(pt_abbr, en_abbr)

    date_formats = [
        '%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%d.%m.%Y', # Completos
        '%d/%m', # DD/MM (assume ano atual)
        '%d %b %Y', # DD Mon YYYY (para formatos como '10 May 2024')
        '%d %b' # DD Mon (assume ano atual)
    ]
    
    for fmt in date_formats:
        try:
            if fmt == '%d/%m':
                return datetime.strptime(f"{date_str}/{current_year}", '%d/%m/%Y')
            elif fmt == '%d %b':
                return datetime.strptime(f"{date_str} {current_year}", '%d %b %Y')
            return datetime.strptime(date_str, fmt)
        except ValueError:
            pass

    # Tentar formato textual em português "DD de Mês de AAAA"
    meses_pt = {
        'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4, 'maio': 5, 'junho': 6,
        'julho': 7, 'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
    }
    match = re.match(r'(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})', original_date_str.lower())
    if match:
        day = int(match.group(1))
        month_name = match.group(2)
        year = int(match.group(3))
        month_num = meses_pt.get(month_name)
        if month_num:
            return datetime(year, month_num, day)
    
    # Fallback para pd.to_datetime (mais flexível, mas pode ser mais lento ou menos preciso em alguns casos)
    try:
        parsed_date = pd.to_datetime(original_date_str, errors='coerce', dayfirst=True)
        if pd.notna(parsed_date): return parsed_date
    except Exception:
        pass

    return None

def parse_financial_value(value_str: str | int | float) -> float | None:
    """
    Limpa e converte uma string de valor financeiro para float.
    Lida com R$, US$, pontos e vírgulas como separadores de milhar/decimal.
    """
    if isinstance(value_str, (int, float)):
        return float(value_str)
    if not isinstance(value_str, str):
        return None

    value_str = value_str.strip().replace('R$', '').replace('US$', '').replace('%', '').strip()
    value_str = value_str.replace("–", "-").replace("−", "-") # Normaliza traço de menos
    
    # Remove qualquer caracter que não seja número, ponto, vírgula ou sinal de menos
    value_str = re.sub(r'[^\d\.,-]', '', value_str)

    # Lida com o padrão brasileiro (1.234,56)
    if ',' in value_str and '.' in value_str:
        if value_str.rfind(',') > value_str.rfind('.'): # Ex: 1.234,56
            value_str = value_str.replace('.', '').replace(',', '.')
        else: # Ex: 1,234.56
            value_str = value_str.replace(',', '')
    elif ',' in value_str: # Apenas vírgula, assume decimal (123,45)
        value_str = value_str.replace(',', '.')
    
    try:
        return float(value_str)
    except ValueError:
        return None

def extrair_dados_cadastrais(texto: str) -> dict[str, str]:
    """Extrai dados cadastrais de documentos financeiros."""
    dados = {
        'nome': 'Não informado', 'cpf_cnpj': 'Não informado', 'endereco': 'Não informado',
        'telefone': 'Não informado', 'cep': 'Não informado', 'renda_declarada': 'Não informado',
        'agencia': 'Não informado', 'conta': 'Não informado'
    }

    padrao_cpf = r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b'
    padrao_cnpj = r'\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b'
    padrao_nome = r'(?:Nome|Titular|Cliente|Sr\.|Sra\.|Nome Completo)[:\s]*([A-ZÀÁÂÃÄÉÊËÍÎÏÓÔÕÖÚÛÜ][a-zàáâãäéêëíîïóôõöúûü\s]+)'
    padrao_endereco = r'(?:Endereço|Rua|Av|Avenida)[:\s]*([^,\n]+(?:,\s*\d+)?(?:\s*-\s*[^\n,]+)?)'
    padrao_telefone = r'\(?\d{2}\)?\s?\d{4,5}-?\d{4}'
    padrao_cep = r'\b\d{5}-?\d{3}\b'
    padrao_agencia = r'(?:Agência|Ag)[:\s]*(\d{1,5}-?\d?)'
    padrao_conta = r'(?:Conta|C/C|Cta)[:\s]*(\d+[-\s]?\d*)'

    cpf_match = re.search(padrao_cpf, texto)
    if cpf_match: dados['cpf_cnpj'] = cpf_match.group(0)
    else:
        cnpj_match = re.search(padrao_cnpj, texto)
        if cnpj_match: dados['cpf_cnpj'] = cnpj_match.group(0)

    nome_match = re.search(padrao_nome, texto, re.IGNORECASE)
    if nome_match: dados['nome'] = nome_match.group(1).strip()

    endereco_match = re.search(padrao_endereco, texto, re.IGNORECASE)
    if endereco_match: dados['endereco'] = endereco_match.group(1).strip()

    telefone_match = re.search(padrao_telefone, texto)
    if telefone_match: dados['telefone'] = telefone_match.group(0)

    cep_match = re.search(padrao_cep, texto)
    if cep_match: dados['cep'] = cep_match.group(0)

    agencia_match = re.search(padrao_agencia, texto, re.IGNORECASE)
    if agencia_match: dados['agencia'] = agencia_match.group(1)

    conta_match = re.search(padrao_conta, texto, re.IGNORECASE)
    if conta_match: dados['conta'] = conta_match.group(1)

    return dados

def processar_contracheque(texto: str) -> dict[str, str]:
    """Processa dados de contracheque."""
    dados = {
        'renda_declarada_contracheque': 'Não informado',
        'empresa': 'Não informado',
        'cargo': 'Não informado',
        'salario_bruto': 'Não informado',
        'salario_liquido': 'Não informado'
    }

    padrao_salario_bruto = r'(?:Salário Bruto|Vencimento Base|Remuneração Bruta)[:\s]*R?\$?\s*([\d\.,]+)'
    padrao_salario_liquido = r'(?:Salário Líquido|Líquido a Receber|Valor Líquido)[:\s]*R?\$?\s*([\d\.,]+)'
    padrao_empresa = r'(?:Empresa|Empregador|Razão Social)[:\s]*([^\n\r]+)'
    padrao_cargo = r'(?:Cargo|Função|Ocupação)[:\s]*([^\n\r]+)'

    salario_bruto_match = re.search(padrao_salario_bruto, texto, re.IGNORECASE)
    if salario_bruto_match: dados['salario_bruto'] = f"R$ {parse_financial_value(salario_bruto_match.group(1)):,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')
    
    salario_liquido_match = re.search(padrao_salario_liquido, texto, re.IGNORECASE)
    if salario_liquido_match: dados['salario_liquido'] = f"R$ {parse_financial_value(salario_liquido_match.group(1)):,.2f}".replace('.', '#').replace(',', '.').replace('#', ',')

    if dados['salario_liquido'] != 'Não informado':
        dados['renda_declarada_contracheque'] = dados['salario_liquido']
    elif dados['salario_bruto'] != 'Não informado':
        dados['renda_declarada_contracheque'] = dados['salario_bruto']


    empresa_match = re.search(padrao_empresa, texto, re.IGNORECASE)
    if empresa_match: dados['empresa'] = empresa_match.group(1).strip()

    cargo_match = re.search(padrao_cargo, texto, re.IGNORECASE)
    if cargo_match: dados['cargo'] = cargo_match.group(1).strip()

    return dados

def _identificar_tipo_transacao_simples(descricao: str) -> str:
    """Identifica o tipo de transação básico (PIX, Transferência, Pagamento, etc.) para uso interno dos parsers."""
    descricao_lower = descricao.lower()
    if 'pix' in descricao_lower: return 'PIX'
    elif any(term in descricao_lower for term in ['ted', 'transferencia', 'transf']): return 'Transferência'
    elif any(term in descricao_lower for term in ['boleto', 'pagamento', 'pgto']): return 'Pagamento'
    elif 'saque' in descricao_lower: return 'Saque'
    elif any(term in descricao_lower for term in ['compra', 'débito', 'debito', 'cartão', 'cartao']): return 'Compra/Débito'
    elif 'deposito' in descricao_lower: return 'Depósito'
    elif any(term in descricao_lower for term in ['rendimento', 'resgate', 'investimento']): return 'Investimento/Resgate'
    elif any(term in descricao_lower for term in ['tarifa', 'encargo', 'juro', 'multa']): return 'Taxas/Encargos'
    return 'Outros'

# A função `extract_transactions` será definida mais abaixo, pois precisa dos parsers específicos.
# Por enquanto, esta parte do módulo está completa.