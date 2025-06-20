package com.simulador.emprestimos

import org.junit.Test
import org.junit.Assert.*
import org.junit.Before

class SimuladorViewModelTest {

    private lateinit var viewModel: SimuladorViewModel

    @Before
    fun setup() {
        viewModel = SimuladorViewModel()
    }

    @Test
    fun calcularParcela_valorBasico_retornaCalculoCorreto() {
        // Arrange
        val valor = 1000.0
        val juros = 15.0
        val parcelas = 1
        val esperado = 1150.0

        // Act
        val resultado = viewModel.calcularParcela(valor, juros, parcelas)

        // Assert
        assertEquals(esperado, resultado, 0.01)
    }

    @Test
    fun calcularParcela_valorComJurosCompostos_retornaCalculoCorreto() {
        // Arrange
        val valor = 5000.0
        val juros = 20.0
        val parcelas = 5
        val esperado = 2985.984

        // Act
        val resultado = viewModel.calcularParcela(valor, juros, parcelas)

        // Assert
        assertEquals(esperado, resultado, 0.01)
    }

    @Test
    fun calcularParcela_valorAlto_retornaCalculoCorreto() {
        // Arrange
        val valor = 2000.0
        val juros = 24.0
        val parcelas = 10
        val esperado = 1870.6134

        // Act
        val resultado = viewModel.calcularParcela(valor, juros, parcelas)

        // Assert
        assertEquals(esperado, resultado, 0.01)
    }

    @Test
    fun calcularParcela_valorMaximoParcelas_retornaCalculoCorreto() {
        // Arrange
        val valor = 10000.0
        val juros = 15.0
        val parcelas = 15
        val esperado = 5420.4482

        // Act
        val resultado = viewModel.calcularParcela(valor, juros, parcelas)

        // Assert
        assertEquals(esperado, resultado, 0.01)
    }

    @Test
    fun calcularParcela_parcelasUnicas_aplicaJurosCorretamente() {
        // Arrange
        val valor = 1000.0
        val juros = 30.0
        val parcelas = 1

        // Act
        val resultado = viewModel.calcularParcela(valor, juros, parcelas)

        // Assert
        assertEquals(1300.0, resultado, 0.01)
    }

    @Test
    fun calcularParcela_jurosZero_retornaValorDividido() {
        // Arrange
        val valor = 1000.0
        val juros = 0.0
        val parcelas = 5

        // Act
        val resultado = viewModel.calcularParcela(valor, juros, parcelas)

        // Assert
        assertEquals(200.0, resultado, 0.01)
    }

    @Test
    fun calcularParcela_valorDecimal_calculaCorretamente() {
        // Arrange
        val valor = 1250.75
        val juros = 18.0
        val parcelas = 3

        // Act
        val resultado = viewModel.calcularParcela(valor, juros, parcelas)

        // Assert
        assertTrue("Resultado deve ser maior que o valor original dividido por parcelas", 
                  resultado > valor / parcelas)
    }

    @Test
    fun calcularParcela_limitesExtremos_funcionaCorretamente() {
        // Teste com valores nos limites permitidos
        
        // Teste 1: Mínimo para 1-3 parcelas (15%)
        val resultado1 = viewModel.calcularParcela(1000.0, 15.0, 3)
        assertTrue("Resultado deve ser positivo", resultado1 > 0)
        
        // Teste 2: Máximo para 1-3 parcelas (30%)
        val resultado2 = viewModel.calcularParcela(1000.0, 30.0, 3)
        assertTrue("Resultado deve ser positivo", resultado2 > 0)
        
        // Teste 3: Máximo para 4-15 parcelas (24%)
        val resultado3 = viewModel.calcularParcela(1000.0, 24.0, 15)
        assertTrue("Resultado deve ser positivo", resultado3 > 0)
    }

    @Test
    fun calcularParcela_formulaMatematica_aplicadaCorretamente() {
        // Verificar se a fórmula parcela = Valor × (1 + Juros)^N / N está sendo aplicada
        val valor = 1000.0
        val juros = 10.0
        val parcelas = 2
        
        // Cálculo manual da fórmula
        val jurosDecimal = juros / 100.0
        val esperado = (valor * Math.pow(1 + jurosDecimal, parcelas.toDouble())) / parcelas
        
        val resultado = viewModel.calcularParcela(valor, juros, parcelas)
        
        assertEquals(esperado, resultado, 0.001)
    }

    @Test
    fun calcularParcela_precisaoDecimal_mantemExatidao() {
        // Teste de precisão para valores que podem gerar dízimas
        val valor = 1000.0
        val juros = 16.666667 // Um terço aproximado
        val parcelas = 3
        
        val resultado = viewModel.calcularParcela(valor, juros, parcelas)
        
        // Verificar que o resultado é um número válido
        assertFalse("Resultado não deve ser NaN", resultado.isNaN())
        assertFalse("Resultado não deve ser infinito", resultado.isInfinite())
        assertTrue("Resultado deve ser positivo", resultado > 0)
    }
}