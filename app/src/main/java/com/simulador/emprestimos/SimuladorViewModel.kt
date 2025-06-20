package com.simulador.emprestimos

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.simulador.emprestimos.data.UserPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.*
import kotlin.math.pow

data class SimuladorUiState(
    val valorEmprestimo: String = "",
    val numeroParcelas: String = "",
    val taxaJuros: String = "",
    val valorPrestacao: String? = null,
    val mensagemErro: String? = null,
    val isCalculating: Boolean = false,
    val shouldScrollToBottom: Boolean = false,
    val showPdfOptions: Boolean = false
)

class SimuladorViewModel(application: Application) : AndroidViewModel(application) {
    
    private val _uiState = MutableStateFlow(SimuladorUiState())
    val uiState: StateFlow<SimuladorUiState> = _uiState.asStateFlow()

    private val userPreferences = UserPreferences(application)
    private var limitesJuros = mapOf<Int, Pair<Double, Double>>()

    init {
        // Carrega os limites dinâmicos do DataStore
        viewModelScope.launch {
            userPreferences.limitesJuros.collect { limites ->
                limitesJuros = limites
            }
        }
    }

    private val currencyFormatter = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))

    fun onValorEmprestimoChange(valor: String) {
        val valorFormatado = formatarMoeda(valor)
        _uiState.value = _uiState.value.copy(
            valorEmprestimo = valorFormatado,
            valorPrestacao = null,
            mensagemErro = null
        )
    }

    fun onNumeroParcelasChange(parcelas: String) {
        val parcelasNumerico = parcelas.filter { it.isDigit() }
        _uiState.value = _uiState.value.copy(
            numeroParcelas = parcelasNumerico,
            valorPrestacao = null,
            mensagemErro = null
        )
    }

    fun onTaxaJurosChange(juros: String) {
        val jurosFormatado = formatarPercentual(juros)
        _uiState.value = _uiState.value.copy(
            taxaJuros = jurosFormatado,
            valorPrestacao = null,
            mensagemErro = null
        )
    }

    fun calcular() {
        val estado = _uiState.value
        
        // Verificar se todos os campos estão preenchidos
        if (estado.valorEmprestimo.isBlank() || 
            estado.numeroParcelas.isBlank() || 
            estado.taxaJuros.isBlank()) {
            _uiState.value = estado.copy(
                valorPrestacao = null,
                mensagemErro = null
            )
            return
        }

        _uiState.value = estado.copy(isCalculating = true)

        try {
            val valor = obterValorNumerico(estado.valorEmprestimo)
            val nParcelas = estado.numeroParcelas.toIntOrNull() ?: 0
            val juros = obterPercentualNumerico(estado.taxaJuros)

            val validacao = validarCampos(valor, nParcelas, juros)
            
            if (validacao.first) {
                val valorParcela = calcularParcela(valor, juros, nParcelas)
                val valorFormatado = currencyFormatter.format(valorParcela)
                
                _uiState.value = estado.copy(
                    valorPrestacao = valorFormatado,
                    mensagemErro = null,
                    isCalculating = false,
                    shouldScrollToBottom = true,
                    showPdfOptions = true
                )
            } else {
                _uiState.value = estado.copy(
                    valorPrestacao = null,
                    mensagemErro = validacao.second,
                    isCalculating = false
                )
            }
        } catch (e: Exception) {
            _uiState.value = estado.copy(
                valorPrestacao = null,
                mensagemErro = "ERRO NO CÁLCULO. VERIFIQUE OS VALORES INFORMADOS.",
                isCalculating = false
            )
        }
    }

    /**
     * Calcula o valor da parcela usando a fórmula: parcela = Valor × (1 + Juros)^N / N
     * @param valor Valor do empréstimo
     * @param juros Taxa de juros (em percentual)
     * @param nParcelas Número de parcelas
     * @return Valor da parcela
     */
    fun calcularParcela(valor: Double, juros: Double, nParcelas: Int): Double {
        val jurosDecimal = juros / 100.0
        return (valor * (1 + jurosDecimal).pow(nParcelas)) / nParcelas
    }

    private fun validarCampos(valor: Double, nParcelas: Int, juros: Double): Pair<Boolean, String?> {
        // Validar número de parcelas
        if (nParcelas < 1) {
            return Pair(false, "NÚMERO DE PARCELAS INFERIOR AO MÍNIMO PERMITIDO.")
        }

        if (nParcelas > 15) {
            return Pair(false, "VOCÊ NÃO TEM PERMISSÃO PARA SIMULAÇÕES ACIMA DE 15 PARCELAS. PARA SIMULAÇÕES SUPERIORES A 15 PARCELAS, CONSULTE MIGUEIS.")
        }

        // Validar limites de juros
        val limites = limitesJuros[nParcelas] ?: return Pair(false, "NÚMERO DE PARCELAS INVÁLIDO.")
        
        if (juros < limites.first) {
            val mensagem = if (nParcelas == 1) {
                "CÁLCULO DE 1 PARCELA, A PORCENTAGEM MÍNIMA PERMITIDA É DE ${String.format("%.2f", limites.first).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS."
            } else {
                "CÁLCULOS DE $nParcelas PARCELAS, A PORCENTAGEM MÍNIMA PERMITIDA É DE ${String.format("%.2f", limites.first).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS."
            }
            return Pair(false, mensagem)
        }

        if (juros > limites.second) {
            val mensagem = if (nParcelas == 1) {
                "CÁLCULO DE 1 PARCELA, A PORCENTAGEM MÁXIMA PERMITIDA É DE ${String.format("%.2f", limites.second).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS."
            } else {
                "CÁLCULOS DE $nParcelas PARCELAS, A PORCENTAGEM MÁXIMA PERMITIDA É DE ${String.format("%.2f", limites.second).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS."
            }
            return Pair(false, mensagem)
        }

        return Pair(true, null)
    }

    private fun formatarMoeda(input: String): String {
        val digitos = input.filter { it.isDigit() }
        if (digitos.isEmpty()) return ""
        
        val valor = digitos.toLongOrNull() ?: 0L
        return when {
            digitos.length == 1 -> "0,0$digitos"
            digitos.length == 2 -> "0,$digitos"
            else -> {
                val reais = digitos.dropLast(2)
                val centavos = digitos.takeLast(2)
                val reaisFormatados = reais.reversed().chunked(3)
                    .joinToString(".") { it.reversed() }.reversed()
                "$reaisFormatados,$centavos"
            }
        }
    }

    private fun formatarPercentual(input: String): String {
        val permitidos = input.filter { it.isDigit() || it == ',' }
        val virgulas = permitidos.count { it == ',' }
        
        if (virgulas > 1) {
            val ultimaVirgula = permitidos.lastIndexOf(',')
            return permitidos.removeRange(permitidos.indexOf(','), ultimaVirgula)
        }
        
        if (permitidos.contains(',')) {
            val partes = permitidos.split(',')
            val decimais = partes.getOrNull(1)?.take(2) ?: ""
            return "${partes[0]},$decimais"
        }
        
        return permitidos
    }

    private fun obterValorNumerico(valorFormatado: String): Double {
        if (valorFormatado.isBlank()) return 0.0
        return valorFormatado.replace(".", "").replace(",", ".").toDoubleOrNull() ?: 0.0
    }

    private fun obterPercentualNumerico(percentualFormatado: String): Double {
        if (percentualFormatado.isBlank()) return 0.0
        return percentualFormatado.replace(",", ".").toDoubleOrNull() ?: 0.0
    }

    fun onScrollCompleted() {
        _uiState.value = _uiState.value.copy(shouldScrollToBottom = false)
    }

    fun exportarPdf() {
        _uiState.value = _uiState.value.copy(showPdfOptions = true)
    }

    fun hidePdfOptions() {
        _uiState.value = _uiState.value.copy(showPdfOptions = false)
    }

    fun getNomeUsuario(): String {
        // Retorna nome do usuário das preferências
        return ""
    }
}