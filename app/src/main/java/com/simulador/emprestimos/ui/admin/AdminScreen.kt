package com.simulador.emprestimos.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    onNavigateBack: () -> Unit,
    viewModel: AdminViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Área Administrativa") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Voltar")
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text(
                    text = "ME EMPREENDIMENTOS",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth()
                )
                
                Text(
                    text = "Configuração de Limites de Juros",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
            
            items(uiState.limitesJuros) { limite ->
                LimiteJurosCard(
                    limite = limite,
                    isEditing = uiState.editandoLimite == limite.numeroParcelas,
                    onEditClick = { viewModel.iniciarEdicao(limite.numeroParcelas) },
                    onSaveClick = { 
                        viewModel.salvarLimite(
                            limite.numeroParcelas,
                            uiState.editMinimo,
                            uiState.editMaximo
                        )
                    },
                    onMinimoChange = viewModel::onMinimoChange,
                    onMaximoChange = viewModel::onMaximoChange,
                    editMinimo = uiState.editMinimo,
                    editMaximo = uiState.editMaximo
                )
            }
        }
    }
}

@Composable
fun LimiteJurosCard(
    limite: LimiteJuros,
    isEditing: Boolean,
    onEditClick: () -> Unit,
    onSaveClick: () -> Unit,
    onMinimoChange: (String) -> Unit,
    onMaximoChange: (String) -> Unit,
    editMinimo: String,
    editMaximo: String
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = if (limite.numeroParcelas == 1) "1 PARCELA" else "${limite.numeroParcelas} PARCELAS",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Medium
            )
            
            if (isEditing) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = editMinimo,
                        onValueChange = onMinimoChange,
                        label = { Text("Mínimo %") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true
                    )
                    
                    OutlinedTextField(
                        value = editMaximo,
                        onValueChange = onMaximoChange,
                        label = { Text("Máximo %") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true
                    )
                    
                    IconButton(
                        onClick = onSaveClick,
                        modifier = Modifier.align(Alignment.CenterVertically)
                    ) {
                        Icon(Icons.Default.Save, contentDescription = "Salvar")
                    }
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Mínimo: ${String.format("%.2f", limite.minimoJuros).replace('.', ',')}% | " +
                               "Máximo: ${String.format("%.2f", limite.maximoJuros).replace('.', ',')}%",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    
                    IconButton(onClick = onEditClick) {
                        Icon(Icons.Default.Edit, contentDescription = "Editar")
                    }
                }
            }
        }
    }
}