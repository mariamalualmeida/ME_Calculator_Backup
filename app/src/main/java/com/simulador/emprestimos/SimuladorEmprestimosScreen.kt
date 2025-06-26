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
                        placeholder = { 
                            Text(
                                if (configuracoes.desabilitarRegras) {
                                    "Quantidade de parcelas"
                                } else {
                                    "Permitido: 1 a 15 parcelas"
                                },
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        },
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
            
            // Análise financeira detalhada (modo livre)
            if (uiState.showResult && uiState.resultado != null && configuracoes.desabilitarRegras && configuracoes.exibirDetalhesModeLivre) {
                val nParcelas = uiState.numeroParcelas.toIntOrNull() ?: 1
                val valorEmprestimo = viewModel.parseValorMonetario(uiState.valorEmprestimo)
                val totalPago = if (uiState.resultado!!.diasExtra > 0 && uiState.resultado!!.metodo == "primeira") {
                    uiState.resultado!!.primeiraParcela + (uiState.resultado!!.parcelaNormal * (nParcelas - 1))
                } else {
                    uiState.resultado!!.parcelaNormal * nParcelas
                }
                val lucro = totalPago - valorEmprestimo
                val margem = if (valorEmprestimo > 0) (lucro / valorEmprestimo) * 100 else 0.0
                
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = colorScheme.surfaceVariant
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "ANÁLISE FINANCEIRA",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = colorScheme.primary,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                        
                        // Grid com informações financeiras
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Linha 1: Capital e Total
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "Capital",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = viewModel.formatarValorMonetario(valorEmprestimo),
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Medium,
                                        color = colorScheme.onSurface
                                    )
                                }
                                
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "Total Pago",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = viewModel.formatarValorMonetario(totalPago),
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Medium,
                                        color = colorScheme.onSurface
                                    )
                                }
                            }
                            
                            // Linha 2: Lucro e Margem
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "Lucro",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = viewModel.formatarValorMonetario(lucro),
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Medium,
                                        color = if (lucro >= 0) Color(0xFF4CAF50) else Color(0xFFF44336)
                                    )
                                }
                                
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "Margem",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = String.format("%.2f%%", margem),
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Medium,
                                        color = if (margem >= 0) Color(0xFF4CAF50) else Color(0xFFF44336)
                                    )
                                }
                            }
                        }
                        
                        // Exibir detalhes de dias extras separadamente se houver
                        if (uiState.resultado!!.diasExtra > 0) {
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            val diasExtrasData = uiState.resultado!!.diasExtrasData
                            val diasCompensacao = uiState.resultado!!.diasCompensacao  
                            val diasMeses31 = uiState.resultado!!.diasMeses31
                            val totalDias = diasExtrasData + diasCompensacao + diasMeses31
                            val jurosTotal = uiState.resultado!!.jurosDiasExtras
                            
                            Text(
                                text = "Detalhamento de Dias Extras:",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Medium,
                                color = colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(bottom = 8.dp)
                            )
                            
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                if (diasExtrasData > 0) {
                                    val jurosExtras = if (totalDias > 0) (jurosTotal * diasExtrasData) / totalDias else 0.0
                                    Text(
                                        text = "Dias extras: $diasExtrasData | Juros: ${viewModel.formatarValorMonetario(jurosExtras)}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colorScheme.onSurfaceVariant
                                    )
                                }
                                
                                if (diasMeses31 > 0) {
                                    val jurosMeses31 = if (totalDias > 0) (jurosTotal * diasMeses31) / totalDias else 0.0
                                    Text(
                                        text = "Meses 31 dias: $diasMeses31 | Juros: ${viewModel.formatarValorMonetario(jurosMeses31)}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colorScheme.onSurfaceVariant
                                    )
                                }
                                
                                if (diasCompensacao > 0) {
                                    val jurosCompensacao = if (totalDias > 0) (jurosTotal * diasCompensacao) / totalDias else 0.0
                                    Text(
                                        text = "Dias compensação: $diasCompensacao | Juros: ${viewModel.formatarValorMonetario(jurosCompensacao)}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
                val valorEmprestimo = uiState.valorEmprestimo.replace(",", ".").toDoubleOrNull() ?: 0.0
                val valorTotal = uiState.resultado!!.parcelaNormal * nParcelas
                val lucroTotal = valorTotal - valorEmprestimo
                val margemLucro = if (valorEmprestimo > 0) (lucroTotal / valorEmprestimo) * 100 else 0.0
                
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = colorScheme.primaryContainer
                    ),
                    border = androidx.compose.foundation.BorderStroke(2.dp, colorScheme.primary)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "ANÁLISE FINANCEIRA",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        
                        // Grid com informações financeiras
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Capital emprestado:",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = viewModel.formatarValorMonetario(valorEmprestimo),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colorScheme.primary
                                )
                            }
                            
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Total a receber:",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = viewModel.formatarValorMonetario(valorTotal),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colorScheme.primary
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Lucro líquido:",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = viewModel.formatarValorMonetario(lucroTotal),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (lucroTotal > 0) Color(0xFF4CAF50) else Color(0xFFF44336)
                                )
                            }
                            
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Margem de lucro:",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = "${String.format("%.2f", margemLucro).replace('.', ',')}%",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (margemLucro > 0) Color(0xFF4CAF50) else Color(0xFFF44336)
                                )
                            }
                        }
                    }
                }
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
                        text = "SIMULAÇÃO NEGADA",
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