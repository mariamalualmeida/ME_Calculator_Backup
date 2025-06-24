package com.simulador.emprestimos

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SimuladorEmprestimosScreen(
    viewModel: SimuladorViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val configuracoes by viewModel.configuracoes.collectAsState()
    val focusManager = LocalFocusManager.current
    val focusRequester = remember { FocusRequester() }
    val scrollState = rememberScrollState()
    
    var showConfigModal by remember { mutableStateOf(false) }
    
    // Garantir que o modal não abre automaticamente
    LaunchedEffect(Unit) {
        showConfigModal = false
    }
    
    // Auto-focus no campo de valor quando a tela carrega
    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }
    
    // Cores do tema baseadas na paleta selecionada
    val colorScheme = getColorSchemeForTheme(configuracoes.colorTheme, configuracoes.themeMode == "dark")
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorScheme.background)
            .padding(20.dp)
            .verticalScroll(scrollState)
    ) {
        // Cabeçalho da empresa
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 32.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color.Transparent
            )
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        brush = Brush.horizontalGradient(
                            colors = listOf(
                                colorScheme.primary,
                                colorScheme.tertiary
                            )
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
                    .padding(24.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(end = 60.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "ME",
                            fontSize = 34.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            textAlign = TextAlign.Center,
                            lineHeight = 34.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "EMPREENDIMENTOS",
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            textAlign = TextAlign.Center,
                            lineHeight = 28.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Simulador de Empréstimos",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.White.copy(alpha = 0.9f),
                        textAlign = TextAlign.Center
                    )
                }
                
                IconButton(
                    onClick = { showConfigModal = true },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = (-8).dp, y = (-8).dp)
                        .background(
                            Color.White.copy(alpha = 0.1f),
                            RoundedCornerShape(50)
                        )
                ) {
                    Icon(
                        Icons.Default.Settings,
                        contentDescription = "Configurações",
                        tint = Color.White
                    )
                }
            }
        }
        
        // Seção de entrada de dados
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = colorScheme.surface
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Valor do empréstimo
                Column {
                    Text(
                        text = "Valor do empréstimo",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    OutlinedTextField(
                        value = uiState.valorEmprestimo,
                        onValueChange = { value ->
                            viewModel.updateValorEmprestimo(formatarMoeda(value))
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .focusRequester(focusRequester),
                        placeholder = { Text("0,00") },
                        leadingIcon = { Text("R$", fontWeight = FontWeight.Medium) },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Decimal,
                            imeAction = ImeAction.Next
                        ),
                        keyboardActions = KeyboardActions(
                            onNext = { focusManager.moveFocus(androidx.compose.ui.focus.FocusDirection.Down) }
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = colorScheme.primary,
                            cursorColor = colorScheme.primary
                        )
                    )
                }
                
                // Número de parcelas
                Column {
                    Text(
                        text = "Número de parcelas",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    OutlinedTextField(
                        value = uiState.numeroParcelas,
                        onValueChange = { value ->
                            if (value.all { it.isDigit() } && value.length <= 2) {
                                viewModel.updateNumeroParcelas(value)
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("1-15") },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Next
                        ),
                        keyboardActions = KeyboardActions(
                            onNext = { focusManager.moveFocus(androidx.compose.ui.focus.FocusDirection.Down) }
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = colorScheme.primary,
                            cursorColor = colorScheme.primary
                        )
                    )
                }
                
                // Taxa de juros
                Column {
                    Text(
                        text = "Taxa de juros (%)",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    val isJurosInvalido = viewModel.isJurosInvalido(uiState.taxaJuros, uiState.numeroParcelas)
                    
                    OutlinedTextField(
                        value = uiState.taxaJuros,
                        onValueChange = { value ->
                            val valorFormatado = formatarPercentualTempoReal(value)
                            viewModel.updateTaxaJuros(valorFormatado)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("0,00") },
                        trailingIcon = { Text("%", fontWeight = FontWeight.Medium) },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Decimal,
                            imeAction = ImeAction.Next
                        ),
                        keyboardActions = KeyboardActions(
                            onNext = { focusManager.moveFocus(androidx.compose.ui.focus.FocusDirection.Down) }
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = if (isJurosInvalido) colorScheme.error else colorScheme.primary,
                            unfocusedBorderColor = if (isJurosInvalido) colorScheme.error else colorScheme.outline,
                            cursorColor = colorScheme.primary
                        )
                    )
                    
                    // Informação dos limites de juros
                    val limitesInfo = viewModel.obterLimitesJuros(uiState.numeroParcelas.toIntOrNull() ?: 0)
                    if (limitesInfo != null && !configuracoes.desabilitarRegras) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = colorScheme.surfaceVariant.copy(alpha = 0.7f)
                            ),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .width(3.dp)
                                        .height(20.dp)
                                        .background(
                                            color = colorScheme.primary,
                                            shape = RoundedCornerShape(2.dp)
                                        )
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = limitesInfo,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colorScheme.onSurfaceVariant,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                }
                
                // Data inicial (opcional)
                Column {
                    Text(
                        text = "Data inicial de vencimento (opcional)",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    OutlinedTextField(
                        value = uiState.dataInicial,
                        onValueChange = { value ->
                            val dataFormatada = formatarData(value)
                            viewModel.updateDataInicial(dataFormatada)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("DD/MM/AAAA") },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = { 
                                focusManager.clearFocus()
                                viewModel.calcular()
                            }
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = colorScheme.primary,
                            cursorColor = colorScheme.primary
                        )
                    )
                }
                
                // Campo Nome do Cliente (Opcional)
                Column {
                    Text(
                        text = "Nome do Cliente (Opcional)",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    OutlinedTextField(
                        value = uiState.nomeCliente,
                        onValueChange = { value ->
                            viewModel.updateNomeCliente(value)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Digite o nome do cliente") },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Text,
                            imeAction = ImeAction.Next,
                            capitalization = KeyboardCapitalization.Words
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = colorScheme.primary,
                            cursorColor = colorScheme.primary
                        )
                    )
                }
                
                // Campo CPF do Cliente (Opcional)
                Column {
                    Text(
                        text = "CPF do Cliente (Opcional)",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    OutlinedTextField(
                        value = uiState.cpfCliente,
                        onValueChange = { value ->
                            val cpfFormatado = formatarCpf(value)
                            viewModel.updateCpfCliente(cpfFormatado)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("000.000.000-00") },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = { 
                                focusManager.clearFocus()
                                viewModel.calcular()
                            }
                        ),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = colorScheme.primary,
                            cursorColor = colorScheme.primary
                        )
                    )
                }
                
                // Método de dias extras (aparece apenas quando há data e parcelas > 1)
                val shouldShowMetodo = uiState.dataInicial.isNotEmpty() && 
                    uiState.dataInicial.length >= 8 && 
                    (uiState.numeroParcelas.toIntOrNull() ?: 1) > 1
                
                if (shouldShowMetodo) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                color = colorScheme.surfaceVariant.copy(alpha = 0.3f),
                                shape = RoundedCornerShape(8.dp)
                            )
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "Método para dias extras:",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Primeira parcela maior
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = uiState.metodoDiasExtras == "primeira",
                                    onClick = { viewModel.updateMetodoDiasExtras("primeira") },
                                    colors = RadioButtonDefaults.colors(
                                        selectedColor = colorScheme.primary
                                    )
                                )
                                Text(
                                    text = "Primeira parcela maior",
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.padding(start = 4.dp)
                                )
                            }
                            
                            // Distribuir
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = uiState.metodoDiasExtras == "distribuir",
                                    onClick = { viewModel.updateMetodoDiasExtras("distribuir") },
                                    colors = RadioButtonDefaults.colors(
                                        selectedColor = colorScheme.primary
                                    )
                                )
                                Text(
                                    text = "Distribuir igualmente",
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.padding(start = 4.dp)
                                )
                            }
                        }
                    }
                }
                
                // Botão calcular
                Button(
                    onClick = { 
                        focusManager.clearFocus()
                        viewModel.calcular()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colorScheme.primary
                    ),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            "CALCULAR",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }
                }
            }
        }
        
        // Resultado
        if (uiState.showResult && uiState.resultado != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color.Transparent
                )
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(
                                    colorScheme.primary,
                                    colorScheme.secondary
                                )
                            ),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Resultado",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color.White,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                        
                        // Verificar se há diferença entre primeira parcela e demais
                        if (uiState.resultado!!.diasExtra > 0) {
                            val nParcelas = uiState.numeroParcelas.toIntOrNull() ?: 1
                            
                            if (nParcelas == 1) {
                                // Apenas 1 parcela - mostrar só o valor total com explicação
                                Text(
                                    text = "Valor da parcela:",
                                    fontSize = 14.sp,
                                    color = Color.White.copy(alpha = 0.9f),
                                    modifier = Modifier.padding(bottom = 8.dp)
                                )
                                
                                Text(
                                    text = viewModel.formatarValorMonetario(uiState.resultado!!.primeiraParcela),
                                    fontSize = 32.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(bottom = 12.dp)
                                )
                                
                                Text(
                                    text = "Dias extras: ${uiState.resultado!!.diasExtra} | Juros extras: ${viewModel.formatarValorMonetario(uiState.resultado!!.jurosDiasExtras)}",
                                    fontSize = 12.sp,
                                    color = Color.White.copy(alpha = 0.8f),
                                    textAlign = TextAlign.Center
                                )
                            } else {
                                // Múltiplas parcelas - mostrar primeira e demais
                                Text(
                                    text = "1ª parcela:",
                                    fontSize = 14.sp,
                                    color = Color.White.copy(alpha = 0.9f),
                                    modifier = Modifier.padding(bottom = 4.dp)
                                )
                                
                                Text(
                                    text = viewModel.formatarValorMonetario(uiState.resultado!!.primeiraParcela),
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(bottom = 16.dp)
                                )
                                
                                Text(
                                    text = "Demais ${nParcelas - 1} parcelas:",
                                    fontSize = 14.sp,
                                    color = Color.White.copy(alpha = 0.9f),
                                    modifier = Modifier.padding(bottom = 4.dp)
                                )
                                
                                Text(
                                    text = viewModel.formatarValorMonetario(uiState.resultado!!.parcelaNormal),
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(bottom = 12.dp)
                                )
                                
                                Text(
                                    text = "Dias extras: ${uiState.resultado!!.diasExtra} | Juros extras: ${viewModel.formatarValorMonetario(uiState.resultado!!.jurosDiasExtras)}",
                                    fontSize = 12.sp,
                                    color = Color.White.copy(alpha = 0.8f),
                                    textAlign = TextAlign.Center
                                )
                            }
                        } else {
                            // Parcelas iguais
                            val nParcelas = uiState.numeroParcelas.toIntOrNull() ?: 1
                            val textoParcel = if (nParcelas == 1) "parcela de:" else "parcelas de:"
                            Text(
                                text = "$nParcelas $textoParcel",
                                fontSize = 14.sp,
                                color = Color.White.copy(alpha = 0.9f),
                                modifier = Modifier.padding(bottom = 8.dp)
                            )
                            
                            Text(
                                text = viewModel.formatarValorMonetario(uiState.resultado!!.parcelaNormal),
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }
            
            // Botão exportar PDF
            Button(
                onClick = { /* TODO: Implementar exportação PDF */ },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFFF9800)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    "EXPORTAR PDF",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(vertical = 4.dp)
                )
            }
        }
        
        // Erro
        if (uiState.showError && uiState.errorMessage != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFFFFEAEB)
                ),
                border = androidx.compose.foundation.BorderStroke(2.dp, Color(0xFFF2B8BB))
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Erro",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFFBA1A1A),
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    
                    Text(
                        text = uiState.errorMessage!!,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFFBA1A1A),
                        textAlign = TextAlign.Center,
                        lineHeight = 20.sp
                    )
                }
            }
        }
    }
    
    // Modal de configurações
    if (showConfigModal) {
        ConfiguracoesModal(
            configuracoes = configuracoes,
            onDismiss = { showConfigModal = false },
            onSave = { novasConfiguracoes ->
                viewModel.updateConfiguracoes(novasConfiguracoes)
                showConfigModal = false
            }
        )
    }
}