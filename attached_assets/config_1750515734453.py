# config.py

# Lista completa de sites e termos relacionados a apostas
SITES_APOSTAS = [
    'bet365', 'betano', 'sportingbet', '1xbet', 'rivalo', 'betfair', 'betway', 'bodog',
    'betnacional', 'pixbet', 'parimatch', 'bet7k', 'esportes da sorte', 'casa de apostas',
    'aposta ganha', 'blaze', 'stake', 'bc.game', 'betmotion', 'bet7', 'onabet', 'mr.bet',
    'brazino777', 'betboo', 'netbet', 'sportsbet.io', 'dafabet', 'pinnacle', 'betsson',
    'bet77', 'bet8', 'bet9', 'betnow', 'betplay', 'betpix365', 'betwinner', '22bet',
    'leon bet', 'megapari', 'melbet', 'royal panda', 'spin palace', 'jackpot city',
    'betclic', 'bwin', 'pokerstars', 'partypoker', 'ggpoker', '888poker',
    'casino', 'cassino', 'slots', 'bingo', 'loteria', 'rifa', 'sorte',
    'gambling', 'poker', 'blackjack', 'roleta', 'bacará'
]

# Processadoras legítimas que NÃO são apostas (para evitar falsos positivos na detecção de apostas)
PROCESSADORAS_PAGAMENTO_NAO_APOSTA = [
    'mercado pago', 'pag seguro', 'stone', 'cielo', 'rede', 'getnet', 'bin',
    'paypal', 'nubank', 'c6 bank', 'inter', 'banco do brasil', 'bradesco',
    'itau', 'santander', 'caixa', 'sicredi', 'sicoob', 'original', 'neon',
    'nu financeira s.a.', 'nu pagamentos s.a.', 'will financeira s.a.', 
    'caixa economica federal', 'banco inter', 'banco bradesco', 'itaú unibanco', 
    'picpay', 'pagseguro internet ip s.a.', 'banco mercantil do brasil s.a.', 
    'efi s.a.', 'ston ip s.a.', 'silium infraestrutura tecnolog', 
    'nuoro pay instituicao de pagam', 'stark bank s.a. ip', 'cartos scd s.a.',
    'moeda smart', 'moeda plus', 'moeda one', 'real trade', 'real house',
    'delta casch', 'delta money', 'aveiropay', 'safrapay', 'cielo', 'redecard', 'getnet',
    'credito', 'seguros', 'previdencia', 'educacional', 'universidade', 
    'psicanalise', 'terapia', 'contabilidade', 'gestao', 'investimento', 'faculdade'
]

# Mapeamento de Colunas Padrão para DataFrames (se necessário para parsers genéricos)
MAPPING_COLUNAS_PADRAO_GENERICO = {
    "data": ['data', 'date', 'data mov', 'data da transacao', 'dt transacao'],
    "descricao": ['descricao', 'descrição', 'historico', 'histórico', 'estabelecimento', 'detalhes', 'item'],
    "valor": ['valor', 'value', 'montante', 'quantia'],
    "debito": ['débito', 'debito', 'saída', 'saida'],
    "credito": ['crédito', 'credito', 'entrada']
}