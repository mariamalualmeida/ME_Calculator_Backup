# categorization_logic.py

import pandas as pd

# Importa a lista de processadoras não-aposta de config.py
# from config import PROCESSADORAS_PAGAMENTO_NAO_APOSTA, SITES_APOSTAS


def categorizar_transacao_granular(descricao: str) -> str:
    """Categoriza uma transação baseada na descrição em categorias granulares."""
    categorias = {
        'Alimentação': ['restaurante', 'lanchonete', 'padaria', 'mercado', 'supermercado', 'ifood', 'uber eats', 'rappi', 'food', 'alimentacao', 'cafe', 'bar', 'pizzaria', 'hamburgueria', 'delivery', 'comida', 'chopp sete', 'varejao e padaria uni', 'burger sf', 'doceria mosaico', 'nutrebem', 'spoleto sete lagoas', 'grillus restaurante e', 'casa de bolos'],
        'Transporte': ['uber', '99', 'taxi', 'combustivel', 'posto', 'transporte', 'metro', 'onibus', 'estacionamento', 'pedágio', 'veiculo', 'carro', 'gasolina', 'etanol', 'diesel', 'posto volkssete', 'posto interlagos', '840 bh saida br 040 nova lima', 'expresso tropical'],
        'Saúde': ['farmacia', 'drogaria', 'hospital', 'clinica', 'medico', 'laboratorio', 'exame', 'consulta', 'odontologia', 'fisioterapia', 'saude', 'medicina', 'unimed', 'amil', 'bradesco saude', 'drogaria araujo'],
        'Vestuário e Acessórios': ['loja', 'moda', 'roupa', 'calcado', 'sapato', 'magazine', 'shopping', 'vestuario', 'boutique', 'acessorios', 'oticas', 'joias', 'relojoaria', 'shein', 'clube melissa', 'pgz rosamake', 'silvania kids'],
        'Lazer e Entretenimento': ['cinema', 'streaming', 'netflix', 'spotify', 'parque', 'diversao', 'show', 'teatro', 'concerto', 'evento', 'balada', 'hospedagem', 'clube', 'ingresso', 'games', 'jogos', 'lazer', 'entretenimento', 'turismo', 'hotéis', 'pousadas', 'resorts', 'parque tematico', 'boate', 'exposicao', 'museu', 'disney plus', 'grupo cine 7 lagoas', 'meep pa clube nautico', 'baladapp'],
        'Tecnologia e Eletrônicos': ['apple', 'google', 'microsoft', 'eletrônicos', 'celular', 'software', 'internet', 'hardware', 'tecnologia', 'recarga celular', 'eletronico', 'info', 'telefonia', 'informatica', 'servicos online', 'aplicativos', 'eletrodomesticos', 'assistencia tecnica', 'tim 5 a'],
        'Serviços Essenciais e Contas': ['banco', 'cartorio', 'correios', 'telefonia', 'internet', 'serviços', 'consultoria', 'advocacia', 'contabilidade', 'reparos', 'manutenção', 'conta', 'boleto', 'pagamento', 'agua', 'luz', 'energia', 'gas', 'condominio', 'aluguel', 'assinatura', 'iptu', 'taxas', 'saneamento', 'tv por assinatura', 'mensalidade', 'seguros', 'protecao veicular', 'consorcio', 'credito consignado', 'pgto fat cartao c6', 'pagarme pagamentos sa', 'nu pagamentos sa', 'receita federal', 'cooperlider associacao de protecao dev', 'sociedade educacional leonardo', 'nucleo de psicanalise e evolucao existen', 'carpecas', 'randon', 'banco pan sa', 'travesia securitizadora', 'shpp brasil instituicao de pag', 'easy food pagamentos', 'nuvi servicos administrativos'], # Expandido
        'Casa e Moradia': ['casa', 'construcao', 'eletrica', 'hidraulica', 'reforma', 'moveis', 'decoracao', 'eletrodomesticos', 'utilidades', 'imobiliaria', 'material de construção', 'ferramentas', 'limpeza', 'jardinagem', 'lar', 'mudanca', 'helena casa & construcao', 'com mat eletri norte', 'supermercados bh', 'agro mar rações'],
        'Educação': ['escola', 'universidade', 'curso', 'livro', 'educacao', 'ensino', 'faculdade', 'pos-graduacao', 'mestrado', 'doutorado', 'certificacao', 'treinamento', 'workshop', 'palestra', 'seminario', 'congresso', 'colegio elite master', 'rrpm cursos preparatorios ltda', 'uniasselvi'],
        'Investimentos e Poupança': ['investimento', 'poupanca', 'aplicacao', 'renda fixa', 'renda variavel', 'acao', 'fundo', 'tesouro', 'cdb', 'lci', 'lca', 'debenture', 'cri', 'cra', 'fidc', 'fii', 'etf', 'previdencia', 'tesouro nacional'],
        'Taxas e Juros (Extrato/Fatura)': ['taxa', 'tarifa', 'juro', 'multa', 'encargo', 'iof', 'anuidade', 'manutencao conta', 'saque', 'ted', 'doc', 'pix'], # PIX/TED/DOC podem gerar tarifas
        'Apostas e Jogos de Azar': SITES_APOSTAS + ['aposta', 'jogo', 'cassino', 'loteria', 'bingo', 'poker', 'blaze', 'stake', 'gaming', 'sorte online'],
        'Animais de Estimação': ['pet shop', 'veterinario', 'racao', 'pata sem dono', 'associacao protetora dos animais', 'patinhas do cipo', 'instituto de protecao de animais jose paulo alves-pro-anima'],
        'Salário/Renda Principal': ['salario', 'pagamento de salario', 'remuneração', 'pro-labore', 'renda'],
        'Outros/Diversos': ['outros gastos', 'diversos', 'variados', 'sem categoria', 'receita federal', 'transferencia', 'pix'] # Catch-all para o que sobrar
    }

    descricao_lower = descricao.lower()

    # Prevenir que processadoras legítimas sejam classificadas como aposta por acidente
    if any(proc in descricao_lower for proc in PROCESSADORAS_PAGAMENTO_NAO_APOSTA):
        # Se contiver um termo de processadora E NÃO for um termo de aposta explícito
        if not any(site in descricao_lower for site in SITES_APOSTAS):
            # Prioriza outras categorias se houver termos de outras categorias
            for categoria, termos in categorias.items():
                if categoria != 'Apostas e Jogos de Azar' and any(termo in descricao_lower for termo in termos):
                    return categoria
            return 'Serviços Essenciais e Contas' # Fallback comum para processadoras sem outra categoria clara

    for categoria, termos in categorias.items():
        if any(termo in descricao_lower for termo in termos):
            return categoria

    return 'Outros/Diversos'

def categorize_transactions_detailed(transactions_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Classifica transações em 'Entradas'/'Saídas' e categorias específicas granulares,
    separando DataFrames para extrato e fatura.
    """
    if transactions_df.empty:
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

    transactions_df['value'] = pd.to_numeric(transactions_df['value'], errors='coerce')
    transactions_df.dropna(subset=['value'], inplace=True)
    
    # Adiciona a coluna 'category' (Entrada/Saída) e 'specific_category' (granular)
    transactions_df['category'] = transactions_df['value'].apply(lambda x: 'Entrada' if x >= 0 else 'Saída')
    transactions_df['specific_category'] = transactions_df['description'].apply(categorizar_transacao_granular)

    # Divisão dos DataFrames finais
    inputs_extrato_df = transactions_df[
        (transactions_df['doc_type'] == 'extrato_bancario') &
        (transactions_df['category'] == 'Entrada')
    ].copy()

    outputs_extrato_df = transactions_df[
        (transactions_df['doc_type'] == 'extrato_bancario') &
        (transactions_df['category'] == 'Saída')
    ].copy()

    # Fatura de Cartão: Compras/Débitos (valores negativos na fatura)
    card_transactions_df = transactions_df[
        (transactions_df['doc_type'] == 'fatura_cartao') &
        (transactions_df['value'] < 0)
    ].copy()
    # Para compras de cartão, a specific_category já foi atribuída por categorizar_transacao_granular

    # Fatura de Cartão: Créditos/Pagamentos (valores positivos na fatura)
    card_credits_df = transactions_df[
        (transactions_df['doc_type'] == 'fatura_cartao') &
        (transactions_df['value'] >= 0)
    ].copy()
    # Refinar categorias para créditos na fatura
    card_credits_df.loc[card_credits_df['description'].str.contains('estorno', case=False, na=False), 'specific_category'] = 'Estorno na Fatura'
    card_credits_df.loc[card_credits_df['description'].str.contains('pagamento|inclusao de pagamento|pgto fat', case=False, na=False), 'specific_category'] = 'Pagamento de Fatura (Crédito)'
    card_credits_df.loc[card_credits_df['specific_category'] == 'Outros/Diversos', 'specific_category'] = 'Crédito Diverso na Fatura' # Para o que sobrar e for positivo


    return inputs_extrato_df, outputs_extrato_df, card_transactions_df, card_credits_df