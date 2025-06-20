package com.simulador.emprestimos

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.pow

data class SimuladorUiState(
    val valorEmprestimo: String = "",
    val numeroParcelas: String = "",
    val taxaJuros: String = "",
    val dataInicial: String = "",
    val resultado: Double? = null,
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
    val isAdmin: Boolean = false,
    val adminUser: String = "Migueis",
    val adminPassword: String = "Laila@10042009",
    val limitesPersonalizados: Map<Int, LimiteJuros>? = null
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
            
            // Calcular prestação
            val diasExtra = 0 // Por simplicidade, não implementando pró-rata no Android inicialmente
            val igpmMensal = _configuracoes.value.igpmAnual / 12.0
            val prestacao = calcularParcela(valor, juros, nParcelas, diasExtra, igpmMensal)
            
            _uiState.value = currentState.copy(
                isLoading = false,
                resultado = prestacao,
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
        return percentual.replace(",", ".").replace("[^0-9.]".toRegex(), "").toDoubleOrNull() ?: 0.0
    }
    
    private fun validarCampos(valor: Double, nParcelas: Int, juros: Double): Pair<Boolean, String?> {
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
    
    private fun calcularParcela(valor: Double, juros: Double, nParcelas: Int, diasExtra: Int = 0, igpmMensal: Double = 0.0): Double {
        val jurosDecimal = juros / 100.0
        var valorCorrigido = valor
        
        // Aplicar pró-rata se houver dias extras
        if (diasExtra > 0) {
            val jurosProRata = (jurosDecimal / 30) * diasExtra
            valorCorrigido *= (1 + jurosProRata)
        }
        
        // Aplicar IGPM se configurado
        if (igpmMensal > 0) {
            val fatorIGPM = (1 + (igpmMensal / 100)).pow(nParcelas)
            valorCorrigido *= fatorIGPM
        }
        
        return (valorCorrigido * (1 + jurosDecimal).pow(nParcelas)) / nParcelas
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