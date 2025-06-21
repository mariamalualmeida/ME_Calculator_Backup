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
    val diasExtra: Int
)

data class SimuladorUiState(
    val valorEmprestimo: String = "",
    val numeroParcelas: String = "",
    val taxaJuros: String = "",
    val dataInicial: String = "",
    val nomeCliente: String = "",
    val cpfCliente: String = "",
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
    val adminPassword: String = "Laila@10042009",
    val limitesPersonalizados: Map<Int, LimiteJuros>? = null,
    val desabilitarRegras: Boolean = false
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
        _uiState.value = _uiState.value.copy(dataInicial = data)
    }
    
    fun updateNomeCliente(nome: String) {
        _uiState.value = _uiState.value.copy(nomeCliente = nome)
    }
    
    fun updateCpfCliente(cpf: String) {
        _uiState.value = _uiState.value.copy(cpfCliente = cpf)
    }
    
    fun calcular() {
        val currentState = _uiState.value
        
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
            val metodo = "primeira" // Por simplicidade, usando método primeira parcela maior no Android
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
                errorMessage = "Erro ao calcular. Verifique os valores informados."
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
        // Verificar se regras estão desabilitadas para admin
        if (_configuracoes.value.desabilitarRegras == true && _configuracoes.value.isAdmin) {
            // Modo livre - apenas validações básicas
            if (valor <= 0) {
                return Pair(false, "Valor do empréstimo deve ser maior que zero.")
            }
            if (nParcelas < 1) {
                return Pair(false, "NÚMERO DE PARCELAS DEVE SER MAIOR QUE ZERO.")
            }
            if (juros < 0) {
                return Pair(false, "TAXA DE JUROS DEVE SER MAIOR OU IGUAL A ZERO.")
            }
            return Pair(true, null)
        }
        
        // Validações normais
        if (valor <= 0) {
            return Pair(false, "Valor do empréstimo deve ser maior que zero.")
        }
        
        if (nParcelas < 1) {
            return Pair(false, "NÚMERO DE PARCELAS INFERIOR AO MÍNIMO PERMITIDO.")
        }
        
        if (nParcelas > 15) {
            return Pair(false, "VOCÊ NÃO TEM PERMISSÃO PARA SIMULAÇÕES ACIMA DE 15 PARCELAS. PARA SIMULAÇÕES SUPERIORES A 15 PARCELAS, CONSULTE MIGUEIS.")
        }
        
        val limites = _configuracoes.value.limitesPersonalizados?.get(nParcelas) 
            ?: limitesJuros[nParcelas] 
            ?: return Pair(false, "NÚMERO DE PARCELAS INVÁLIDO.")
        
        if (juros < limites.min) {
            val tipoMensagem = if (nParcelas == 1) "PARCELA" else "PARCELAS"
            return Pair(false, "[$nParcelas] $tipoMensagem, A PORCENTAGEM MÍNIMA PERMITIDA É DE ${String.format("%.2f", limites.min).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.")
        }
        
        if (juros > limites.max) {
            val tipoMensagem = if (nParcelas == 1) "PARCELA" else "PARCELAS"
            return Pair(false, "[$nParcelas] $tipoMensagem, A PORCENTAGEM MÁXIMA PERMITIDA É DE ${String.format("%.2f", limites.max).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.")
        }
        
        return Pair(true, null)
    }
    
    private fun calcularParcela(valor: Double, juros: Double, nParcelas: Int, diasExtra: Int = 0, igpmMensal: Double = 0.0, metodo: String = "primeira"): ResultadoCalculo {
        // Taxa efetiva (juros + IGPM)
        val taxaEfetiva = (juros + igpmMensal) / 100.0
        
        // Prestação base: P = Valor × (1 + JurosMensal)^N ÷ N
        val prestacaoBase = (valor * (1 + taxaEfetiva).pow(nParcelas)) / nParcelas
        
        return if (diasExtra != 0) {
            val taxaDiaria = taxaEfetiva / 30.0 // Taxa mensal dividida por 30 dias
            val jurosProrrata = valor * taxaDiaria * diasExtra
            
            if (metodo == "distribuir" && nParcelas > 1) {
                // Método distribuir corrigido - distribuir apenas os juros extras, sem juros compostos
                val jurosProrrataPorParcela = jurosProrrata / nParcelas
                val prestacaoDistribuida = prestacaoBase + jurosProrrataPorParcela
                
                ResultadoCalculo(
                    parcelaNormal = prestacaoDistribuida,
                    primeiraParcela = prestacaoDistribuida,
                    jurosDiasExtras = jurosProrrata,
                    diasExtra = diasExtra
                )
            } else {
                // Método primeira parcela maior - juros dos dias extras apenas na primeira parcela
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
}