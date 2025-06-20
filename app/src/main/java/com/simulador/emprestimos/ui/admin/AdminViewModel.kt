package com.simulador.emprestimos.ui.admin

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.simulador.emprestimos.data.UserPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LimiteJuros(
    val numeroParcelas: Int,
    val minimoJuros: Double,
    val maximoJuros: Double
)

data class AdminUiState(
    val limitesJuros: List<LimiteJuros> = emptyList(),
    val editandoLimite: Int? = null,
    val editMinimo: String = "",
    val editMaximo: String = ""
)

class AdminViewModel(application: Application) : AndroidViewModel(application) {
    
    private val _uiState = MutableStateFlow(AdminUiState())
    val uiState: StateFlow<AdminUiState> = _uiState.asStateFlow()
    
    private val userPreferences = UserPreferences(application)
    
    init {
        carregarLimites()
    }
    
    private fun carregarLimites() {
        viewModelScope.launch {
            userPreferences.limitesJuros.collect { limites ->
                val limitesOrdenados = limites.map { (parcelas, limite) ->
                    LimiteJuros(
                        numeroParcelas = parcelas,
                        minimoJuros = limite.first,
                        maximoJuros = limite.second
                    )
                }.sortedBy { it.numeroParcelas }
                
                _uiState.value = _uiState.value.copy(limitesJuros = limitesOrdenados)
            }
        }
    }
    
    fun iniciarEdicao(numeroParcelas: Int) {
        val limite = _uiState.value.limitesJuros.find { it.numeroParcelas == numeroParcelas }
        if (limite != null) {
            _uiState.value = _uiState.value.copy(
                editandoLimite = numeroParcelas,
                editMinimo = String.format("%.2f", limite.minimoJuros).replace('.', ','),
                editMaximo = String.format("%.2f", limite.maximoJuros).replace('.', ',')
            )
        }
    }
    
    fun onMinimoChange(valor: String) {
        _uiState.value = _uiState.value.copy(editMinimo = valor)
    }
    
    fun onMaximoChange(valor: String) {
        _uiState.value = _uiState.value.copy(editMaximo = valor)
    }
    
    fun salvarLimite(numeroParcelas: Int, minimoStr: String, maximoStr: String) {
        try {
            val minimo = minimoStr.replace(',', '.').toDouble()
            val maximo = maximoStr.replace(',', '.').toDouble()
            
            if (minimo >= 0 && maximo >= minimo) {
                viewModelScope.launch {
                    userPreferences.updateLimiteJuros(numeroParcelas, minimo, maximo)
                    _uiState.value = _uiState.value.copy(
                        editandoLimite = null,
                        editMinimo = "",
                        editMaximo = ""
                    )
                }
            }
        } catch (e: NumberFormatException) {
            // Ignora valores inválidos
        }
    }
}