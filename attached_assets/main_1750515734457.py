# main.py - Arquivo Principal e Orquestrador

import pandas as pd
import io
import os
import re
from datetime import datetime
import numpy as np

# --- Bloco de Instalação de Bibliotecas para o Code Interpreter ---
# Este bloco garantirá que as dependências sejam instaladas no ambiente da sessão.
try:
    import pdfplumber
except ImportError:
    print("pdfplumber não encontrado. Tentando instalar...")
    !pip install pdfplumber
    import pdfplumber

try:
    import openpyxl
except ImportError:
    print("openpyxl não encontrado. Tentando instalar...")
    !pip install openpyxl
    import openpyxl

try:
    from docx import Document
except ImportError:
    print("python-docx não encontrado. Tentando instalar...")
    !pip install python-docx
    from docx import Document

try:
    import pytesseract
    from PIL import Image
except ImportError:
    print("pytesseract ou Pillow não encontrados. Tentando instalar...")
    !pip install pytesseract Pillow
    import pytesseract
    from PIL import Image

try:
    import fitz # PyMuPDF
except ImportError:
    print("PyMuPDF (fitz) não encontrado. Tentando instalar...")
    !pip install PyMuPDF
    import fitz

try:
    from tabula import read_pdf
except ImportError:
    print("tabula-py não encontrado. Tentando instalar...")
    !pip install tabula-py
    from tabula import read_pdf

# --- Fim: Bloco de Instalação de Bibliotecas ---


# --- Importação dos Módulos Separados (definidos nas células anteriores) ---
# Essas importações assumem que os outros arquivos/módulos foram colados antes
# na mesma sessão do Code Interpreter, tornando suas funções acessíveis.

from config import SITES_APOSTAS, PROCESSADORAS_PAGAMENTO_NAO_APOSTA, MAPPING_COLUNAS_PADRAO_GENERICO
from file_io_utils import detect_file_type_by_filename, detect_bank_from_filename, handle_uploaded_file, perform_ocr
from data_parsing import parse_date_string, parse_financial_value, extrair_dados_cadastrais, processar_contracheque, detect_document_type, extract_transactions, _identificar_tipo_transacao_simples
from bank_specific_parsers import parse_nubank_extrato_pdf, parse_c6_fatura_pdf
from dataframe_parsers import process_dataframe_generic, process_nubank_extrato_csv, process_nubank_fatura_csv, process_inter_extrato_csv, process_inter_fatura_csv, process_caixa_extrato_csv, process_picpay_fatura_csv, _mapear_colunas_automaticamente
from categorization_logic import categorizar_transacao_granular, categorize_transactions_detailed
from financial_analysis import calculate_totals, calculate_score, group_by_month, extrair_maiores_transacoes, detectar_apostas_aprimorado, detectar_movimentacoes_suspeitas, analyze_risk
from report_generation import generate_extrato_summary, generate_fatura_summary, generate_general_financial_summary


# --- Classe Principal do Sistema ---
class FinancialAnalysisSystem:
    def __init__(self):
        # DataFrames de transações consolidadas de todos os arquivos processados
        self.all_transactions_raw_df = pd.DataFrame()
        self.inputs_extrato_consolidated_df = pd.DataFrame()
        self.outputs_extrato_consolidated_df = pd.DataFrame()
        self.card_transactions_consolidated_df = pd.DataFrame()
        self.card_credits_consolidated_df = pd.DataFrame()

        # Resumos e indicadores
        self.extrato_summary_consolidated = pd.DataFrame()
        self.fatura_summary_consolidated = pd.DataFrame()
        self.general_financial_summary_consolidated = pd.DataFrame()
        self.risk_indicators_consolidated = {}
        self.cadastral_data_consolidated = {}
        self.contracheque_data_consolidated = {}
        self.gambling_transactions_consolidated = []
        self.suspicious_transactions_consolidated = []
        self.financial_score = 0
        self.all_extracted_text = "" # Armazena texto de todos os documentos

    def process_document(self, file_path: str, file_type: str, file_name: str) -> bool:
        """
        Processa um único documento financeiro, extraindo, categorizando e contribuindo para os totais consolidados.
        :param file_path: Caminho para o arquivo.
        :param file_type: Tipo do arquivo (inferido ou passado explicitamente).
        :param file_name: Nome original do arquivo, útil para detecção de banco/tipo.
        """
        print(f"Iniciando processamento para: {file_name} (Tipo: {file_type.upper()})")

        extracted_data = handle_uploaded_file(file_path, file_type)
        current_extracted_text = extracted_data['text']
        current_extracted_tables = extracted_data['tables']
        self.all_extracted_text += current_extracted_text + "\n" # Acumula todo o texto

        # Se for PDF ou imagem e a extração inicial não encontrou texto ou tabelas, tentar OCR/Tabula
        if (not current_extracted_text.strip() and not current_extracted_tables) and (file_type in ['pdf', 'jpg', 'png', 'jpeg']):
            print("Conteúdo vazio. Tentando OCR/Tabula para extrair conteúdo do documento.")
            if file_type == 'pdf':
                try:
                    import tabula
                    temp_dfs = tabula.read_pdf(file_path, pages='all', multiple_tables=True, pandas_options={'header': None})
                    for df in temp_dfs:
                        if not df.empty:
                            current_extracted_tables.append(df)
                    current_extracted_text += perform_ocr(file_path)
                except ImportError:
                    print("tabula-py não está instalado. Pulando extração de tabela via tabula.")
                    current_extracted_text += perform_ocr(file_path)
                except Exception as e:
                    print(f"Erro ao usar tabula-py ou OCR em PDF: {e}. Tentando OCR bruto.")
                    current_extracted_text += perform_ocr(file_path)
            else: # Imagem
                current_extracted_text += perform_ocr(file_path)

        if not current_extracted_text.strip() and not current_extracted_tables:
            print(f"Não foi possível extrair conteúdo de {file_name}. Pulando este arquivo.")
            return False
        
        # Extrair dados cadastrais e de contracheque do texto atual
        current_cadastral_data = extrair_dados_cadastrais(current_extracted_text)
        self.cadastral_data_consolidated.update(current_cadastral_data) # Acumula/atualiza (pode sobrescrever se houver mais info)

        doc_type = detect_document_type(current_extracted_text, current_extracted_tables, file_type, file_name)

        if doc_type == 'contracheque':
            current_contracheque_data = processar_contracheque(current_extracted_text)
            self.contracheque_data_consolidated.update(current_contracheque_data)
            print(f"Documento identificado como Contracracheque. Dados extraídos: {self.contracheque_data_consolidated}")
            return True # Contracracheque não tem transações para análise de fluxo de caixa

        # Extrair transações (aplica parsers específicos ou genéricos)
        transactions = self._extract_transactions_orchestrator(current_extracted_text, current_extracted_tables, doc_type, file_type, file_name)
        
        if transactions.empty:
            print(f"Nenhuma transação financeira significativa encontrada em {file_name}.")
            return False

        # Acumular transações (evitando duplicatas se a mesma transação aparecer em múltiplos documentos ou extrações)
        initial_transactions_count = len(self.all_transactions_raw_df)
        self.all_transactions_raw_df = pd.concat([self.all_transactions_raw_df, transactions], ignore_index=True)
        self.all_transactions_raw_df.drop_duplicates(subset=['date', 'description', 'value'], inplace=True)
        
        print(f"Transações extraídas de {file_name}: {len(self.all_transactions_raw_df) - initial_transactions_count} novas transações adicionadas.")
        return True

    def _extract_transactions_orchestrator(self, text_content: str, extracted_tables: list[pd.DataFrame], doc_type: str, file_type: str, file_name: str) -> pd.DataFrame:
        """
        Orquestra a extração de transações, priorizando parsers específicos e usando fallbacks.
        Esta função substitui a `extract_transactions` do `data_parsing.py`
        e a integra chamando os parsers específicos de `bank_specific_parsers.py` e `dataframe_parsers.py`.
        """
        transactions = []
        
        # 1. Tentar parsers específicos de Banco/Formato (Prioridade Máxima)
        bank_name = detect_bank_from_filename(file_name)
        
        if file_type == 'pdf':
            if doc_type == 'extrato_bancario' and bank_name == 'Nubank':
                print("Chamando parser específico: Nubank Extrato PDF")
                transactions.extend(parse_nubank_extrato_pdf(text_content, doc_type))
            elif doc_type == 'fatura_cartao' and bank_name == 'C6 Bank':
                print("Chamando parser específico: C6 Fatura PDF")
                transactions.extend(parse_c6_fatura_pdf(text_content, doc_type))
            # Adicionar mais condições para outros bancos/tipos de PDF
            
        elif file_type in ['csv', 'xlsx']:
            if doc_type == 'extrato_bancario' and bank_name == 'Nubank':
                for df_table in extracted_tables:
                    transactions.extend(process_nubank_extrato_csv(df_table, doc_type))
            elif doc_type == 'fatura_cartao' and bank_name == 'Nubank':
                for df_table in extracted_tables:
                    transactions.extend(process_nubank_fatura_csv(df_table, doc_type))
            elif doc_type == 'extrato_bancario' and bank_name == 'Banco Inter':
                for df_table in extracted_tables:
                    transactions.extend(process_inter_extrato_csv(df_table, doc_type))
            elif doc_type == 'fatura_cartao' and bank_name == 'Banco Inter':
                for df_table in extracted_tables:
                    transactions.extend(process_inter_fatura_csv(df_table, doc_type))
            elif doc_type == 'extrato_bancario' and bank_name == 'Caixa Econômica Federal':
                for df_table in extracted_tables:
                    transactions.extend(process_caixa_extrato_csv(df_table, doc_type))
            elif doc_type == 'fatura_cartao' and bank_name == 'PicPay':
                for df_table in extracted_tables:
                    transactions.extend(process_picpay_fatura_csv(df_table, doc_type))
            else: # CSV/XLSX genérico
                print("Chamando parser genérico de DataFrame para CSV/XLSX.")
                for df_table in extracted_tables:
                    transactions.extend(process_dataframe_generic(df_table, doc_type))

        # 2. Fallback para extração de texto bruto via regex se nada foi encontrado ou se for complementar
        # (Este é o `extract_transactions` original do `data_parsing.py` com a lógica de regex)
        if not transactions and text_content.strip():
            print("Nenhum parser específico ou de DataFrame encontrou transações. Tentando extração via regex em texto bruto.")
            # Chamada da função original de extração por regex que estava em data_parsing.py
            # Reimplementada aqui ou chamada de data_parsing.extract_transactions diretamente se não houvesse o orquestrador
            transactions.extend(self._extract_transactions_from_text_fallback(text_content, doc_type))

        return pd.DataFrame(transactions)

    def _extract_transactions_from_text_fallback(self, text_content: str, doc_type: str) -> list[dict]:
        """
        Função de fallback para extrair transações de texto bruto via regex.
        Copypaste da lógica original de data_parsing.extract_transactions, focada em regex.
        """
        fallback_transactions = []
        current_year = datetime.now().year
        lines = text_content.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line: continue

            found_date = None
            date_patterns = [
                r'\b\d{2}/\d{2}/\d{4}\b', r'\b\d{2}/\d{2}\b', r'\b\d{4}-\d{2}-\d{2}\b', # DD/MM/YYYY, DD/MM, YYYY-MM-DD
                r'\b\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\b', # DD de Mes de AAAA
                r'\b\d{1,2}\s+[A-Za-z]{3}\b' # DD Mon
            ]
            for pattern in date_patterns:
                match_date = re.search(pattern, line)
                if match_date:
                    found_date = parse_date_string(match_date.group(0), current_year)
                    if found_date: break

            found_value = None
            value_patterns = [
                r'R\$?\s*-?\d{1,3}(?:\.?\d{3})*,\d{2}', # R$ 1.234,56
                r'R\$?\s*-?\d{1,3}(?:,\d{3})*\.\d{2}', # R$ 1,234.56
                r'-?\d{1,3}(?:\.?\d{3})*,\d{2}',       # 1.234,56
                r'-?\d{1,3}(?:,\d{3})*\.\d{2}',       # 1,234.56
                r'-?\d+\.\d{2}',                      # 123.45
                r'-?\d+,\d{2}'                        # 123,45
            ]
            for pattern in value_patterns:
                match_value = re.search(pattern, line)
                if match_value:
                    found_value = parse_financial_value(match_value.group(0))
                    if found_value is not None: break

            if found_date and found_value is not None:
                temp_line = line
                if match_date: temp_line = temp_line.replace(match_date.group(0), '', 1)
                if match_value: temp_line = temp_line.replace(match_value.group(0), '', 1)
                description = temp_line.strip()

                is_input_keyword = re.search(r'(recebido|deposito|crédito|estorno|salario|rendimento|inclusao de pagamento)', description.lower())
                is_output_keyword = re.search(r'(enviado|pagamento|compra|débito|tarifa|encargo|saque|pgto fat)', description.lower())

                if is_input_keyword and not is_output_keyword:
                    found_value = abs(found_value)
                    type_op_inferred = "Entrada"
                elif is_output_keyword and not is_input_keyword:
                    found_value = -abs(found_value)
                    type_op_inferred = "Saída"
                else:
                    type_op_inferred = "Entrada" if found_value >= 0 else "Saída"
                
                fallback_transactions.append({
                    'date': found_date,
                    'description': description,
                    'value': found_value,
                    'currency': 'BRL',
                    'doc_type': doc_type,
                    'original_type_op': type_op_inferred
                })
        return fallback_transactions


    def perform_full_analysis(self):
        """
        Executa a análise completa após todos os documentos serem processados e as transações consolidadas.
        """
        if self.all_transactions_raw_df.empty:
            print("Nenhum dado de transação disponível para análise completa.")
            return False

        print("\n--- Realizando Análise Financeira Completa ---")

        # 1. Categorizar todas as transações consolidadas
        self.inputs_extrato_consolidated_df, self.outputs_extrato_consolidated_df, \
        self.card_transactions_consolidated_df, self.card_credits_consolidated_df = \
            categorize_transactions_detailed(self.all_transactions_raw_df)

        print(f"Total de Transações Categorizadas: {len(self.all_transactions_raw_df)}")

        # 2. Gerar resumos e métricas
        self.extrato_summary_consolidated = generate_extrato_summary(
            self.inputs_extrato_consolidated_df, self.outputs_extrato_consolidated_df
        )
        # Para a fatura, precisamos do texto consolidado ou do texto da última fatura processada
        self.fatura_summary_consolidated = generate_fatura_summary(
            self.card_transactions_consolidated_df, self.card_credits_consolidated_df, self.all_extracted_text
        )
        self.general_financial_summary_consolidated = generate_general_financial_summary(
            self.inputs_extrato_consolidated_df, self.outputs_extrato_consolidated_df,
            self.card_transactions_consolidated_df, self.card_credits_consolidated_df
        )
        
        # 3. Análise de Risco
        self.risk_indicators_consolidated = analyze_risk(self.all_transactions_raw_df, self.all_extracted_text)

        # 4. Detecção de Apostas e Movimentações Suspeitas
        self.gambling_transactions_consolidated = detectar_apostas_aprimorado(self.all_transactions_raw_df)
        self.suspicious_transactions_consolidated = detectar_movimentacoes_suspeitas(self.all_transactions_raw_df)

        # 5. Cálculo do Score Financeiro Geral (do extrato principalmente)
        # Concatenar extrato de entrada e saída para cálculo de score
        df_for_score = pd.concat([self.inputs_extrato_consolidated_df, self.outputs_extrato_consolidated_df], ignore_index=True)
        self.financial_score = calculate_score(df_for_score)

        print("\n--- Análise Financeira Completa Gerada ---")
        return True

    def get_analysis_results(self):
        """
        Retorna os resultados consolidados da análise.
        """
        return {
            "cadastral_data": self.cadastral_data_consolidated,
            "contracheque_data": self.contracheque_data_consolidated,
            "inputs_extrato": self.inputs_extrato_consolidated_df,
            "outputs_extrato": self.outputs_extrato_consolidated_df,
            "card_transactions": self.card_transactions_consolidated_df,
            "card_credits": self.card_credits_consolidated_df,
            "extrato_summary": self.extrato_summary_consolidated,
            "fatura_summary": self.fatura_summary_consolidated,
            "general_financial_summary": self.general_financial_summary_consolidated,
            "risk_indicators": self.risk_indicators_consolidated,
            "gambling_transactions": self.gambling_transactions_consolidated,
            "suspicious_transactions": self.suspicious_transactions_consolidated,
            "financial_score": self.financial_score
        }

# --- Bloco de Exemplo de Uso para o Code Interpreter ---
# Este bloco é o ponto de entrada quando você cola e executa o código.
# Ele simula a detecção de arquivos que o usuário fez upload.

# Instanciar o sistema
financial_system = FinancialAnalysisSystem()

# Simular a detecção de arquivos no ambiente do Code Interpreter
uploaded_files_info = []
_base_path = '/mnt/data/' # Caminho padrão para arquivos carregados no Code Interpreter
if os.path.exists(_base_path):
    for filename in os.listdir(_base_path):
        full_path = os.path.join(_base_path, filename)
        if os.path.isfile(full_path):
            file_extension = os.path.splitext(filename)[1].lower().replace('.', '')
            # Adicionar apenas tipos de arquivo que sabemos processar
            if file_extension in ['pdf', 'csv', 'xlsx', 'docx', 'jpg', 'png', 'jpeg']:
                uploaded_files_info.append({
                    'path': full_path,
                    'type': file_extension,
                    'name': filename
                })

if not uploaded_files_info:
    print("Nenhum arquivo compatível encontrado para processamento em /mnt/data/. Por favor, faça o upload dos seus documentos financeiros (PDF, CSV, XLSX, DOCX, JPG, PNG).")
else:
    print(f"Arquivos detectados para processamento: {[f['name'] for f in uploaded_files_info]}")
    
    all_processed_successfully = True
    for file_info in uploaded_files_info:
        # Passa o nome original do arquivo para a função process_document
        success = financial_system.process_document(file_info['path'], file_info['type'], file_info['name'])
        if not success:
            all_processed_successfully = False
            print(f"Aviso: Falha ao processar {file_info['name']}.")

    # Após processar todos os documentos, realizar a análise completa consolidada
    if not financial_system.all_transactions_raw_df.empty:
        analysis_performed = financial_system.perform_full_analysis()
        
        if analysis_performed:
            # A GPT agora acessaria financial_system.get_analysis_results() para formatar a resposta.
            results = financial_system.get_analysis_results()

            print("\n--- Resultados Detalhados da Análise Financeira ---")
            
            # Formatar e imprimir os resultados
            if results['cadastral_data'] and results['cadastral_data']['nome'] != 'Não informado':
                print("\n**1. Dados Cadastrais Identificados:**")
                for key, value in results['cadastral_data'].items():
                    if value and value != 'Não informado':
                        print(f"- {key.replace('_', ' ').title()}: {value}")
            
            if results['contracheque_data'] and results['contracheque_data']['renda_declarada_contracheque'] != 'Não informado':
                print("\n**2. Dados de Contratacheque (se aplicável):**")
                for key, value in results['contracheque_data'].items():
                    if value and value != 'Não informado':
                        print(f"- {key.replace('_', ' ').title()}: {value}")

            print("\n**3. Detalhamento das Transações:**")

            if not results['inputs_extrato'].empty:
                print("\n### Extrato Bancário - Entradas:")
                for cat, group in results['inputs_extrato'].sort_values(by='date').groupby('specific_category', sort=False):
                    print(f"\n**{cat}:**")
                    for _, row in group.iterrows():
                        print(f"- {row['date'].strftime('%d/%m/%Y')}: {row['description']} - R$ {row['value']:.2f}")

            if not results['outputs_extrato'].empty:
                print("\n### Extrato Bancário - Saídas:")
                for cat, group in results['outputs_extrato'].sort_values(by='date').groupby('specific_category', sort=False):
                    print(f"\n**{cat}:**")
                    for _, row in group.iterrows():
                        print(f"- {row['date'].strftime('%d/%m/%Y')}: {row['description']} - R$ {row['value']:.2f}")
            
            if not results['card_credits'].empty:
                print("\n### Fatura de Cartão - Créditos/Pagamentos:")
                for cat, group in results['card_credits'].sort_values(by='date').groupby('specific_category', sort=False):
                    print(f"\n**{cat}:**")
                    for _, row in group.iterrows():
                        print(f"- {row['date'].strftime('%d/%m/%Y')}: {row['description']} - R$ {row['value']:.2f}")

            if not results['card_transactions'].empty:
                print("\n### Fatura de Cartão - Compras/Débitos:")
                for cat, group in results['card_transactions'].sort_values(by='date').groupby('specific_category', sort=False):
                    print(f"\n**{cat}:**")
                    for _, row in group.iterrows():
                        print(f"- {row['date'].strftime('%d/%m/%Y')}: {row['description']} - R$ {row['value']:.2f}")

            print("\n**4. Resumos Consolidados:**")
            
            if not results['extrato_summary'].empty:
                print("\n### Resumo do Extrato Bancário por Categoria:")
                print(results['extrato_summary'].to_markdown(index=True))

            if not results['fatura_summary'].empty:
                print("\n### Resumo da Fatura de Cartão de Crédito:")
                print(results['fatura_summary'].to_markdown(index=False))

            if not results['general_financial_summary'].empty:
                print("\n### Resumo Financeiro Geral Consolidado:")
                print(results['general_financial_summary'].to_markdown(index=False))

            print("\n**5. Análises de Risco e Comportamento:**")

            if results['risk_indicators']:
                print("\n### Indicadores de Risco:")
                for k, v in results['risk_indicators'].items():
                    print(f"- **{k}**: {v}")

            if results['gambling_transactions']:
                print("\n### Transações de Apostas Detectadas:")
                gambling_df = pd.DataFrame(results['gambling_transactions'])
                print(gambling_df.to_markdown(index=False))
            else:
                print("\n### Transações de Apostas Detectadas: Nenhuma transação de aposta significativa identificada.")

            if results['suspicious_transactions']:
                print("\n### Movimentações Suspeitas Detectadas:")
                suspicious_df = pd.DataFrame(results['suspicious_transactions'])
                print(suspicious_df.to_markdown(index=False))
            else:
                print("\n### Movimentações Suspeitas Detectadas: Nenhuma movimentação suspeita identificada.")

            print(f"\n**6. Score Financeiro Geral**: {results['financial_score']}/1000")

            print("\nAnálise concluída. Posso fornecer insights detalhados ou recomendações com base nesses dados.")

        else:
            print("A análise completa não pôde ser gerada devido a falhas no processamento ou falta de transações.")
    else:
        print("Nenhuma transação foi processada com sucesso em nenhum dos arquivos. Não é possível gerar análise.")