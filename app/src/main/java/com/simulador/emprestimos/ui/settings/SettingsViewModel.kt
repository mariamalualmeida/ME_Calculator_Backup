package com.simulador.emprestimos.ui.settings

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.simulador.emprestimos.data.UserPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SettingsUiState(
    val nomeUsuario: String = "",
    val loginUsuario: String = "",
    val loginSenha: String = "",
    val loginErro: String? = null,
    val isLoggedIn: Boolean = false
)

class SettingsViewModel(application: Application) : AndroidViewModel(application) {
    
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()
    
    private val userPreferences = UserPreferences(application)
    
    // Credenciais de administrador
    private val ADMIN_USER = "Migueis"
    private val ADMIN_PASSWORD = "Laila@10042009"
    
    init {
        carregarNomeUsuario()
    }
    
    private fun carregarNomeUsuario() {
        viewModelScope.launch {
            userPreferences.userName.collect { nome ->
                _uiState.value = _uiState.value.copy(nomeUsuario = nome)
            }
        }
    }
    
    fun onNomeUsuarioChange(nome: String) {
        _uiState.value = _uiState.value.copy(nomeUsuario = nome)
    }
    
    fun onLoginUsuarioChange(usuario: String) {
        _uiState.value = _uiState.value.copy(
            loginUsuario = usuario,
            loginErro = null
        )
    }
    
    fun onLoginSenhaChange(senha: String) {
        _uiState.value = _uiState.value.copy(
            loginSenha = senha,
            loginErro = null
        )
    }
    
    fun salvarNomeUsuario() {
        viewModelScope.launch {
            userPreferences.saveUserName(_uiState.value.nomeUsuario)
        }
    }
    
    fun fazerLogin() {
        val estado = _uiState.value
        
        if (estado.loginUsuario == ADMIN_USER && estado.loginSenha == ADMIN_PASSWORD) {
            _uiState.value = estado.copy(
                isLoggedIn = true,
                loginErro = null
            )
        } else {
            _uiState.value = estado.copy(
                isLoggedIn = false,
                loginErro = "Usuário ou senha incorretos"
            )
        }
    }
}