package com.simulador.emprestimos

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.pow

data class ResultadoCalculo(
    val parcelaNormal: Double,
    val primeiraParcela: Double,
    val jurosDiasExtras: Double,
    val diasExtra: Int,
    val metodo: String = "primeira",
    val diasExtrasData: Int = 0,
    val diasCompensacao: Int = 0,
    val diasMeses31: Int = 0
)

data class SimuladorUiState(
    val valorEmprestimo: String = "",
    val numeroParcelas: String = "",
    val taxaJuros: String = "",
    val dataInicial: String = "",
    val nomeCliente: String = "",
    val cpfCliente: String = "",
    val metodoDiasExtras: String = "primeira",
    val resultado: ResultadoCalculo? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val showResult: Boolean = false,
    val showError: Boolean = false
)

data class Configuracoes(
    val nomeUsuario: String = "",
    val themeMode: String = "light",
    val colorTheme: String = "default",
    val igpmAnual: Double = 0.0,
    val mostrarJurosRelatorio: Boolean = false,
    val isAdmin: Boolean = false,
    val adminUser: String = "Migueis",
    val adminPassword: String = "Laila@1004",
    val limitesPersonalizados: Map<Int, LimiteJuros>? = mapOf(
        1 to LimiteJuros(15.00, 100.00),
        2 to LimiteJuros(15.00, 100.00),
        3 to LimiteJuros(15.00, 30.00),
        4 to LimiteJuros(15.00, 24.00),
        5 to LimiteJuros(15.00, 22.00),
        6 to LimiteJuros(15.00, 20.00),
        7 to LimiteJuros(14.75, 18.00),
        8 to LimiteJuros(14.36, 17.00),
        9 to LimiteJuros(13.92, 16.00),
        10 to LimiteJuros(13.47, 15.00),
        11 to LimiteJuros(13.03, 14.00),
        12 to LimiteJuros(12.60, 13.00),
        13 to LimiteJuros(12.19, 12.60),
        14 to LimiteJuros(11.80, 12.19),
        15 to LimiteJuros(11.43, 11.80)
    ),
    val desabilitarRegras: Boolean = false,
    val sistemaJuros: String = "compostos-mensal",
    val exibirDetalhesModeLivre: Boolean = true,
    val ajusteMes31Dias: Boolean = false,
    val diasExtrasFixos: Int = 0
)

data class LimiteJuros(
    val min: Double,
    val max: Double
)

class SimuladorViewModel : ViewModel() {
    
    private val _uiState = MutableStateFlow(SimuladorUiState())
    val uiState: StateFlow<SimuladorUiState> = _uiState.asStateFlow()
    
    private val _configuracoes = MutableStateFlow(Configuracoes())
    val configuracoes: StateFlow<Configuracoes> = _configuracoes.asStateFlow()
    
    init {
        // Sempre forçar isAdmin = false na inicialização para segurança
        _configuracoes.value = _configuracoes.value.copy(isAdmin = false)
        // Verificar consistência do estado ao inicializar
        verificarConsistenciaEstado()
    }
    
    // Callback para notificar mudanças de configuração
    private var onConfiguracoesChanged: (() -> Unit)? = null
    
    // Tabela de limites de juros conforme a versão web
    private val limitesJuros = mapOf(
        1 to LimiteJuros(15.00, 100.00),
        2 to LimiteJuros(15.00, 100.00),
        3 to LimiteJuros(15.00, 30.00),
        4 to LimiteJuros(15.00, 24.00),
        5 to LimiteJuros(15.00, 22.00),
        6 to LimiteJuros(15.00, 20.00),
        7 to LimiteJuros(14.75, 18.00),
        8 to LimiteJuros(14.36, 17.00),
        9 to LimiteJuros(13.92, 16.00),
        10 to LimiteJuros(13.47, 15.00),
        11 to LimiteJuros(13.03, 14.00),
        12 to LimiteJuros(12.60, 13.00),
        13 to LimiteJuros(12.19, 12.60),
        14 to LimiteJuros(11.80, 12.19),
        15 to LimiteJuros(11.43, 11.80)
    )
    
    fun updateValorEmprestimo(valor: String) {
        _uiState.value = _uiState.value.copy(
            valorEmprestimo = valor,
            showResult = false,
            showError = false,
            errorMessage = null
        )
    }
    
    fun updateNumeroParcelas(parcelas: String) {
        _uiState.value = _uiState.value.copy(
            numeroParcelas = parcelas,
            showResult = false,
            showError = false,
            errorMessage = null
        )
    }
    
    fun updateTaxaJuros(juros: String) {
        _uiState.value = _uiState.value.copy(
            taxaJuros = juros,
            showResult = false,
            showError = false,
            errorMessage = null
        )
    }
    
    fun updateDataInicial(data: String) {
        _uiState.value = _uiState.value.copy(
            dataInicial = data,
            showResult = false,
            showError = false,
            errorMessage = null
        )
    }
    
    fun updateNomeCliente(nome: String) {
        _uiState.value = _uiState.value.copy(nomeCliente = nome)
    }
    
    fun updateCpfCliente(cpf: String) {
        _uiState.value = _uiState.value.copy(cpfCliente = cpf)
    }
    
    fun updateMetodoDiasExtras(metodo: String) {
        _uiState.value = _uiState.value.copy(metodoDiasExtras = metodo)
    }
    
    fun setOnConfiguracoesChangedCallback(callback: () -> Unit) {
        onConfiguracoesChanged = callback
    }
    
    fun updateConfiguracoes(novasConfiguracoes: Configuracoes) {
        _configuracoes.value = novasConfiguracoes
        onConfiguracoesChanged?.invoke() // Notificar mudanças
    }
    
    fun salvarConfiguracoes(novasConfiguracoes: Configuracoes) {
        _configuracoes.value = novasConfiguracoes
        // Simular salvamento persistente (SharedPreferences)
        onConfiguracoesChanged?.invoke() // Notificar mudanças imediatamente
    }
    
    private fun recarregarConfiguracoes() {
        // Simular recarregamento das configurações do SharedPreferences
        // Em uma implementação real, seria algo como:
        // val savedConfig = sharedPreferences.getString("configuracoes", null)
        // if (savedConfig != null) {
        //     _configuracoes.value = Json.decodeFromString(savedConfig)
        // }
        // 
        // Por enquanto, manter as configurações atuais
        // pois não temos persistência real implementada
    }
    
    fun isJurosInvalido(taxaJuros: String, numeroParcelas: String): Boolean {
        val modoLivreAtivo = _configuracoes.value.desabilitarRegras
        if (modoLivreAtivo || taxaJuros.isEmpty() || numeroParcelas.isEmpty()) {
            return false
        }
        
        val juros = parsePercentual(taxaJuros)
        val nParcelas = numeroParcelas.toIntOrNull() ?: return false
        
        // Obter limites para o número de parcelas
        val limites = _configuracoes.value.limitesPersonalizados?.get(nParcelas) 
            ?: limitesJuros[nParcelas] 
            ?: return false
        
        // Verificar se está fora dos limites
        return juros < limites.min || juros > limites.max
    }
    
    fun calcular() {
        val currentState = _uiState.value
        
        // Recarregar configurações mais recentes antes do cálculo
        recarregarConfiguracoes()
        
        // Limpar mensagens anteriores
        _uiState.value = currentState.copy(
            isLoading = true,
            showResult = false,
            showError = false,
            errorMessage = null
        )
        
        try {
            val valor = parseValorMonetario(currentState.valorEmprestimo)
            val nParcelas = currentState.numeroParcelas.toIntOrNull() ?: 0
            val juros = parsePercentual(currentState.taxaJuros)
            
            // Validar campos
            val validacao = validarCampos(valor, nParcelas, juros)
            if (!validacao.first) {
                _uiState.value = currentState.copy(
                    isLoading = false,
                    showError = true,
                    errorMessage = validacao.second
                )
                return
            }
            
            // Calcular prestação com pró-rata se houver data
            val diasExtra = calcularDiasExtras(_uiState.value.dataInicial)
            val igpmMensal = _configuracoes.value.igpmAnual / 12.0
            val metodo = _uiState.value.metodoDiasExtras
            val resultadoCalculo = calcularParcela(valor, juros, nParcelas, diasExtra, igpmMensal, metodo)
            
            _uiState.value = currentState.copy(
                isLoading = false,
                resultado = resultadoCalculo,
                showResult = true
            )
            
        } catch (e: Exception) {
            _uiState.value = currentState.copy(
                isLoading = false,
                showError = true,
                errorMessage = "SIMULAÇÃO NEGADA. Verifique os valores informados."
            )
        }
    }
    
    private fun parseValorMonetario(valor: String): Double {
        return valor.replace(",", ".").replace("[^0-9.]".toRegex(), "").toDoubleOrNull() ?: 0.0
    }
    
    private fun parsePercentual(percentual: String): Double {
        val valor = percentual.replace(Regex("[^\\d,]"), "").replace(",", ".")
        return valor.toDoubleOrNull() ?: 0.0
    }
    
    private fun validarCampos(valor: Double, nParcelas: Int, juros: Double): Pair<Boolean, String?> {
        val modoLivreAtivo = _configuracoes.value.isAdmin && _configuracoes.value.desabilitarRegras
        
        if (modoLivreAtivo) {
            if (valor <= 0) return Pair(false, "Valor do empréstimo deve ser maior que zero.")
            if (nParcelas < 1) return Pair(false, "SIMULAÇÃO NEGADA. NÚMERO DE PARCELAS DEVE SER MAIOR QUE ZERO.")
            if (juros < 0) return Pair(false, "TAXA DE JUROS DEVE SER MAIOR OU IGUAL A ZERO.")
            return Pair(true, null)
        }
        
        // Validações normais
        if (valor <= 0) {
            return Pair(false, "Valor do empréstimo deve ser maior que zero.")
        }
        
        if (nParcelas < 1) {
            return Pair(false, "SIMULAÇÃO NEGADA. NÚMERO DE PARCELAS INFERIOR AO MÍNIMO PERMITIDO.")
        }
        
        if (nParcelas > 15) {
            return Pair(false, "SIMULAÇÃO NEGADA. VOCÊ NÃO TEM PERMISSÃO PARA SIMULAÇÕES ACIMA DE 15 PARCELAS. PARA SIMULAÇÕES SUPERIORES A 15 PARCELAS, CONSULTE MIGUEIS.")
        }
        
        val limites = _configuracoes.value.limitesPersonalizados?.get(nParcelas) 
            ?: limitesJuros[nParcelas] 
            ?: return Pair(false, "SIMULAÇÃO NEGADA. NÚMERO DE PARCELAS INVÁLIDO.")
        
        if (juros < limites.min) {
            val tipoMensagem = if (nParcelas == 1) "PARCELA" else "PARCELAS"
            return Pair(false, "SIMULAÇÃO NEGADA. [$nParcelas] $tipoMensagem, A PORCENTAGEM MÍNIMA PERMITIDA É DE ${String.format("%.2f", limites.min).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.")
        }
        
        if (juros > limites.max) {
            val tipoMensagem = if (nParcelas == 1) "PARCELA" else "PARCELAS"
            return Pair(false, "SIMULAÇÃO NEGADA. [$nParcelas] $tipoMensagem, A PORCENTAGEM MÁXIMA PERMITIDA É DE ${String.format("%.2f", limites.max).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.")
        }
        
        return Pair(true, null)
    }
    
    private fun calcularParcela(valor: Double, juros: Double, nParcelas: Int, diasExtra: Int = 0, igpmMensal: Double = 0.0, metodo: String = "primeira"): ResultadoCalculo {
        // Taxa efetiva (juros + IGPM)
        val taxaEfetiva = (juros + igpmMensal) / 100.0
        
        // Aplicar sistema de juros baseado na configuração
        val sistemaJuros = _configuracoes.value.sistemaJuros ?: "compostos-mensal"
        
        return when (sistemaJuros) {
            "compostos-prorata-real" -> {
                // Sistema Pro-rata Real: diferente para 1 parcela vs múltiplas parcelas
                val prestacaoBase = (valor * (1 + taxaEfetiva).pow(nParcelas)) / nParcelas
                
                if (diasExtra != 0) {
                    if (nParcelas == 1) {
                        // Para 1 parcela: usar cálculo linear simples igual aos outros sistemas
                        val taxaDiaria = taxaEfetiva / 30.0
                        val jurosProrrata = valor * taxaDiaria * diasExtra
                        val prestacaoComJurosExtras = prestacaoBase + jurosProrrata
                        
                        ResultadoCalculo(
                            parcelaNormal = prestacaoComJurosExtras,
                            primeiraParcela = prestacaoComJurosExtras,
                            jurosDiasExtras = jurosProrrata,
                            diasExtra = diasExtra
                        )
                    } else {
                        // Para múltiplas parcelas: calcular juros extras a cada mês e somar à parcela
                        val taxaDiariaReal = (1 + taxaEfetiva).pow(1.0/30.0) - 1
                        val jurosExtrasPorParcela = prestacaoBase * ((1 + taxaDiariaReal).pow(diasExtra.toDouble()) - 1)
                        val prestacaoComJurosExtras = prestacaoBase + jurosExtrasPorParcela
                        val jurosExtrasTotal = jurosExtrasPorParcela * nParcelas
                        
                        ResultadoCalculo(
                            parcelaNormal = prestacaoComJurosExtras,
                            primeiraParcela = prestacaoComJurosExtras,
                            jurosDiasExtras = jurosExtrasTotal,
                            diasExtra = diasExtra
                        )
                    }
                } else {
                    ResultadoCalculo(
                        parcelaNormal = prestacaoBase,
                        primeiraParcela = prestacaoBase,
                        jurosDiasExtras = 0.0,
                        diasExtra = 0
                    )
                }
            }
            else -> {
                // Sistemas padrão (simples, compostos, etc.)
                val prestacaoBase = (valor * (1 + taxaEfetiva).pow(nParcelas)) / nParcelas
                
                if (diasExtra != 0) {
                    val taxaDiaria = taxaEfetiva / 30.0
                    val jurosProrrata = valor * taxaDiaria * diasExtra
                    
                    if (metodo == "distribuir" && nParcelas > 1) {
                        val jurosProrrataPorParcela = jurosProrrata / nParcelas
                        val prestacaoDistribuida = prestacaoBase + jurosProrrataPorParcela
                        
                        ResultadoCalculo(
                            parcelaNormal = prestacaoDistribuida,
                            primeiraParcela = prestacaoDistribuida,
                            jurosDiasExtras = jurosProrrata,
                            diasExtra = diasExtra
                        )
                    } else {
                        val primeiraParcela = prestacaoBase + jurosProrrata
                        
                        ResultadoCalculo(
                            parcelaNormal = prestacaoBase,
                            primeiraParcela = primeiraParcela,
                            jurosDiasExtras = jurosProrrata,
                            diasExtra = diasExtra
                        )
                    }
                } else {
                    ResultadoCalculo(
                        parcelaNormal = prestacaoBase,
                        primeiraParcela = prestacaoBase,
                        jurosDiasExtras = 0.0,
                        diasExtra = 0
                    )
                }
            }
        }
    }
    
    private fun calcularDiasExtras(dataStr: String): Int {
        if (dataStr.isEmpty() || dataStr.length < 10) return 0
        
        try {
            val partes = dataStr.split("/")
            if (partes.size != 3) return 0
            
            val dia = partes[0].toInt()
            val mes = partes[1].toInt() - 1 // Calendar usa 0-indexed
            val ano = partes[2].toInt()
            
            val hoje = java.util.Calendar.getInstance()
            val dataInformada = java.util.Calendar.getInstance().apply {
                set(ano, mes, dia)
            }
            
            // Data normal da primeira parcela seria 30 dias após hoje
            val dataNormalPrimeiraParcela = java.util.Calendar.getInstance().apply {
                timeInMillis = hoje.timeInMillis
                add(java.util.Calendar.DAY_OF_YEAR, 30)
            }
            
            // Calcular diferença entre data informada e data normal
            val diffInMillis = dataInformada.timeInMillis - dataNormalPrimeiraParcela.timeInMillis
            return (diffInMillis / (1000 * 60 * 60 * 24)).toInt()
        } catch (e: Exception) {
            return 0
        }
    }

    fun formatarValorMonetario(valor: Double): String {
        return "R$ ${String.format("%,.2f", valor).replace('.', ',').replace(',', 'X').replace(',', '.').replace('X', ',')}"
    }
    
    fun updateConfiguracoes(novasConfiguracoes: Configuracoes) {
        _configuracoes.value = novasConfiguracoes
    }
    
    fun limparResultado() {
        _uiState.value = _uiState.value.copy(
            showResult = false,
            showError = false,
            errorMessage = null,
            resultado = null
        )
    }
    
    fun obterLimitesJuros(nParcelas: Int): String? {
        if (nParcelas < 1 || nParcelas > 15) {
            return null
        }
        
        // Usar limites personalizados se admin configurou, senão usar padrão
        val limites = _configuracoes.value.limitesPersonalizados?.get(nParcelas) 
            ?: limitesJuros[nParcelas] 
            ?: return null
        
        val textoParcel = if (nParcelas == 1) "parcela" else "parcelas"
        val minimo = String.format("%.2f", limites.min).replace('.', ',')
        val maximo = String.format("%.2f", limites.max).replace('.', ',')
        
        return "Para $nParcelas $textoParcel, o juros mínimo é ${minimo}% e máximo ${maximo}%"
    }
    
    fun isJurosInvalido(taxaJuros: String, numeroParcelas: String): Boolean {
        // CORREÇÃO: Verificar apenas desabilitarRegras (independente de login admin)
        if (_configuracoes.value.desabilitarRegras == true) {
            return false
        }
        
        val juros = parsePercentual(taxaJuros)
        val nParcelas = numeroParcelas.toIntOrNull() ?: return false
        
        if (nParcelas < 1 || nParcelas > 15) return false
        
        val limites = _configuracoes.value.limitesPersonalizados?.get(nParcelas) 
            ?: limitesJuros[nParcelas] 
            ?: return false
            
        return juros < limites.min || juros > limites.max
    }
}