package com.simulador.emprestimos

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color

// Formatação de moeda
fun formatarMoeda(input: String): String {
    val digitos = input.replace(Regex("[^0-9]"), "")
    if (digitos.isEmpty() || digitos == "0") return ""
    
    val valor = digitos.toLongOrNull() ?: return ""
    val valorDecimal = valor / 100.0
    
    return String.format("%,.2f", valorDecimal)
        .replace('.', 'X')
        .replace(',', '.')
        .replace('X', ',')
}

// Função removida - formatação é feita apenas em tempo real
fun formatarPercentual(input: String): String {
    return formatarPercentualTempoReal(input)
}

// Formatação de percentual em tempo real como centavos
fun formatarPercentualTempoReal(input: String): String {
    // Remover todos os caracteres não numéricos
    val valor = input.replace(Regex("\\D"), "")
    
    // Limitar a 4 dígitos
    val valorLimitado = if (valor.length > 4) valor.substring(0, 4) else valor
    
    // Se vazio, retornar vazio
    if (valorLimitado.isEmpty()) {
        return ""
    }
    
    // Formatar como centavos
    return when (valorLimitado.length) {
        1 -> "0,0$valorLimitado"
        2 -> "0,$valorLimitado"
        3 -> "${valorLimitado[0]},${valorLimitado.substring(1)}"
        4 -> "${valorLimitado.substring(0, 2)},${valorLimitado.substring(2)}"
        else -> valorLimitado
    }
}

// Função legacy removida - usar apenas formatarPercentualTempoReal
fun formatarPercentualInput(input: String): String {
    return formatarPercentualTempoReal(input)
}

// Formatação de data
fun formatarData(input: String): String {
    val digitos = input.replace(Regex("[^0-9]"), "").take(8)
    
    return when {
        digitos.length <= 2 -> digitos
        digitos.length <= 4 -> "${digitos.substring(0, 2)}/${digitos.substring(2)}"
        else -> "${digitos.substring(0, 2)}/${digitos.substring(2, 4)}/${digitos.substring(4)}"
    }
}

// Validação de data
fun validarData(data: String): Boolean {
    if (data.length != 10) return true // Permite datas incompletas
    
    val partes = data.split("/")
    if (partes.size != 3) return false
    
    val dia = partes[0].toIntOrNull() ?: return false
    val mes = partes[1].toIntOrNull() ?: return false
    val ano = partes[2].toIntOrNull() ?: return false
    
    // Validar ano
    if (ano < 2020 || ano > 2050) return false
    
    // Validar mês
    if (mes < 1 || mes > 12) return false
    
    // Validar dia
    val diasPorMes = listOf(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
    val maxDias = if (mes == 2 && isAnoBissexto(ano)) 29 else diasPorMes[mes - 1]
    
    return dia in 1..maxDias
}

// Verificar ano bissexto
fun isAnoBissexto(ano: Int): Boolean {
    return (ano % 4 == 0 && ano % 100 != 0) || (ano % 400 == 0)
}

// Formatação de CPF
fun formatarCpf(input: String): String {
    val digitos = input.replace(Regex("[^0-9]"), "").take(11)
    
    return when {
        digitos.length <= 3 -> digitos
        digitos.length <= 6 -> "${digitos.substring(0, 3)}.${digitos.substring(3)}"
        digitos.length <= 9 -> "${digitos.substring(0, 3)}.${digitos.substring(3, 6)}.${digitos.substring(6)}"
        else -> "${digitos.substring(0, 3)}.${digitos.substring(3, 6)}.${digitos.substring(6, 9)}-${digitos.substring(9)}"
    }
}

// Paletas de cores para diferentes temas
fun getColorSchemeForTheme(colorTheme: String, isDark: Boolean): ColorScheme {
    val colors = when (colorTheme) {
        "blue" -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFF90CAF9),
                secondary = Color(0xFF2196F3),
                tertiary = Color(0xFF1E88E5),
                background = Color(0xFF121212),
                surface = Color(0xFF1E1E1E)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFF1976D2),
                secondary = Color(0xFF2196F3),
                tertiary = Color(0xFF1E88E5),
                background = Color(0xFFF5F5F5),
                surface = Color(0xFFFFFFFF)
            )
        }
        
        "green" -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFFA5D6A7),
                secondary = Color(0xFF4CAF50),
                tertiary = Color(0xFF43A047),
                background = Color(0xFF121212),
                surface = Color(0xFF1E1E1E)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFF388E3C),
                secondary = Color(0xFF4CAF50),
                tertiary = Color(0xFF43A047),
                background = Color(0xFFF5F5F5),
                surface = Color(0xFFFFFFFF)
            )
        }
        
        "orange" -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFFFFCC02),
                secondary = Color(0xFFFF9800),
                tertiary = Color(0xFFFB8C00),
                background = Color(0xFF121212),
                surface = Color(0xFF1E1E1E)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFFF57C00),
                secondary = Color(0xFFFF9800),
                tertiary = Color(0xFFFB8C00),
                background = Color(0xFFF5F5F5),
                surface = Color(0xFFFFFFFF)
            )
        }
        
        "yellow" -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFFFFF59D),
                secondary = Color(0xFFFFC107),
                tertiary = Color(0xFFFFB300),
                background = Color(0xFF121212),
                surface = Color(0xFF1E1E1E)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFFF9A825),
                secondary = Color(0xFFFFC107),
                tertiary = Color(0xFFFFB300),
                background = Color(0xFFF5F5F5),
                surface = Color(0xFFFFFFFF)
            )
        }
        
        "red" -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFFEF9A9A),
                secondary = Color(0xFFF44336),
                tertiary = Color(0xFFE53935),
                background = Color(0xFF121212),
                surface = Color(0xFF1E1E1E)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFFD32F2F),
                secondary = Color(0xFFF44336),
                tertiary = Color(0xFFE53935),
                background = Color(0xFFF5F5F5),
                surface = Color(0xFFFFFFFF)
            )
        }
        
        "teal" -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFF80CBC4),
                secondary = Color(0xFF009688),
                tertiary = Color(0xFF00897B),
                background = Color(0xFF121212),
                surface = Color(0xFF1E1E1E)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFF00796B),
                secondary = Color(0xFF009688),
                tertiary = Color(0xFF00897B),
                background = Color(0xFFF5F5F5),
                surface = Color(0xFFFFFFFF)
            )
        }
        
        "pink" -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFFF8BBD9),
                secondary = Color(0xFFE91E63),
                tertiary = Color(0xFFD81B60),
                background = Color(0xFF121212),
                surface = Color(0xFF1E1E1E)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFFC2185B),
                secondary = Color(0xFFE91E63),
                tertiary = Color(0xFFD81B60),
                background = Color(0xFFF5F5F5),
                surface = Color(0xFFFFFFFF)
            )
        }
        
        else -> if (isDark) { // default purple
            darkColorScheme(
                primary = Color(0xFFD0BCFF),
                secondary = Color(0xFF7C4DFF),
                tertiary = Color(0xFF7C4DFF),
                background = Color(0xFF121212),
                surface = Color(0xFF1E1E1E)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFF6750A4),
                secondary = Color(0xFF7C4DFF),
                tertiary = Color(0xFF7C4DFF),
                background = Color(0xFFF5F5F5),
                surface = Color(0xFFFFFFFF)
            )
        }
    }
    
    return colors
}