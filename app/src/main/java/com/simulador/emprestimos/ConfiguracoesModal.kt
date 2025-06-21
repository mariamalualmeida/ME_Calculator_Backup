package com.simulador.emprestimos

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConfiguracoesModal(
    configuracoes: Configuracoes,
    onDismiss: () -> Unit,
    onSave: (Configuracoes) -> Unit
) {
    var nomeUsuario by remember { mutableStateOf(configuracoes.nomeUsuario) }
    var themeMode by remember { mutableStateOf(configuracoes.themeMode) }
    var colorTheme by remember { mutableStateOf(configuracoes.colorTheme) }
    var igpmAnual by remember { mutableStateOf(configuracoes.igpmAnual.toString().replace('.', ',')) }
    
    // Estados para área administrativa
    var adminUser by remember { mutableStateOf("") }
    var adminPassword by remember { mutableStateOf("") }
    var isAdmin by remember { mutableStateOf(configuracoes.isAdmin) }
    var showAdminPanel by remember { mutableStateOf(configuracoes.isAdmin) }
    
    // Estados para alteração de credenciais
    var newAdminUser by remember { mutableStateOf("") }
    var newAdminPassword by remember { mutableStateOf("") }
    
    // Cores do tema baseadas na paleta selecionada
    val colorScheme = getColorSchemeForTheme(colorTheme, themeMode == "dark")
    
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false
        )
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Cabeçalho do modal
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Configurações",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = colorScheme.onSurface
                    )
                    
                    IconButton(onClick = onDismiss) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Fechar",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
                
                // Conteúdo do modal
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 24.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    // Nome do usuário
                    Column {
                        Text(
                            text = "Nome do usuário",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        
                        OutlinedTextField(
                            value = nomeUsuario,
                            onValueChange = { nomeUsuario = it },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text("Digite seu nome") }
                        )
                    }
                    
                    // Tema do aplicativo
                    Column {
                        Text(
                            text = "Tema do aplicativo",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        
                        var expanded by remember { mutableStateOf(false) }
                        
                        ExposedDropdownMenuBox(
                            expanded = expanded,
                            onExpandedChange = { expanded = !expanded }
                        ) {
                            OutlinedTextField(
                                value = when (themeMode) {
                                    "light" -> "Claro"
                                    "dark" -> "Escuro"
                                    else -> "Claro"
                                },
                                onValueChange = {},
                                readOnly = true,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .menuAnchor(),
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) }
                            )
                            
                            ExposedDropdownMenu(
                                expanded = expanded,
                                onDismissRequest = { expanded = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Claro") },
                                    onClick = {
                                        themeMode = "light"
                                        expanded = false
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Escuro") },
                                    onClick = {
                                        themeMode = "dark"
                                        expanded = false
                                    }
                                )
                            }
                        }
                    }
                    
                    // Paleta de cores
                    Column {
                        Text(
                            text = "Paleta de cores",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        
                        var expandedColor by remember { mutableStateOf(false) }
                        
                        ExposedDropdownMenuBox(
                            expanded = expandedColor,
                            onExpandedChange = { expandedColor = !expandedColor }
                        ) {
                            OutlinedTextField(
                                value = when (colorTheme) {
                                    "default" -> "Padrão (Roxo)"
                                    "blue" -> "Azul"
                                    "green" -> "Verde"
                                    "orange" -> "Laranja"
                                    "yellow" -> "Amarelo"
                                    "red" -> "Vermelho"
                                    "teal" -> "Verde-água"
                                    "pink" -> "Rosa"
                                    else -> "Padrão (Roxo)"
                                },
                                onValueChange = {},
                                readOnly = true,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .menuAnchor(),
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedColor) }
                            )
                            
                            ExposedDropdownMenu(
                                expanded = expandedColor,
                                onDismissRequest = { expandedColor = false }
                            ) {
                                val colorOptions = listOf(
                                    "default" to "Padrão (Roxo)",
                                    "blue" to "Azul",
                                    "green" to "Verde",
                                    "orange" to "Laranja",
                                    "yellow" to "Amarelo",
                                    "red" to "Vermelho",
                                    "teal" to "Verde-água",
                                    "pink" to "Rosa"
                                )
                                
                                colorOptions.forEach { (value, label) ->
                                    DropdownMenuItem(
                                        text = { Text(label) },
                                        onClick = {
                                            colorTheme = value
                                            expandedColor = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                    
                    // IGPM Anual
                    Column {
                        Text(
                            text = "Índice IGPM anual (%)",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        
                        OutlinedTextField(
                            value = igpmAnual,
                            onValueChange = { value ->
                                igpmAnual = formatarPercentual(value)
                            },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text("0,00") }
                        )
                    }
                    
                    // Área Administrativa
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = "Área Administrativa",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(bottom = 16.dp)
                            )
                            
                            if (!showAdminPanel) {
                                // Login administrativo
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedTextField(
                                        value = adminUser,
                                        onValueChange = { adminUser = it },
                                        modifier = Modifier.weight(1f),
                                        placeholder = { Text("Usuário") },
                                        singleLine = true
                                    )
                                    
                                    OutlinedTextField(
                                        value = adminPassword,
                                        onValueChange = { adminPassword = it },
                                        modifier = Modifier.weight(1f),
                                        placeholder = { Text("Senha") },
                                        visualTransformation = PasswordVisualTransformation(),
                                        singleLine = true
                                    )
                                    
                                    Button(
                                        onClick = {
                                            if (adminUser == configuracoes.adminUser && 
                                                adminPassword == configuracoes.adminPassword) {
                                                isAdmin = true
                                                showAdminPanel = true
                                                adminUser = ""
                                                adminPassword = ""
                                            }
                                        },
                                        modifier = Modifier.height(56.dp)
                                    ) {
                                        Text("Login")
                                    }
                                }
                            } else {
                                // Painel administrativo
                                Text(
                                    text = "Acesso administrativo ativo",
                                    fontSize = 14.sp,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(bottom = 16.dp)
                                )
                                
                                // Alteração de credenciais
                                Text(
                                    text = "Alterar Credenciais de Acesso",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier.padding(bottom = 8.dp)
                                )
                                
                                OutlinedTextField(
                                    value = newAdminUser,
                                    onValueChange = { newAdminUser = it },
                                    modifier = Modifier.fillMaxWidth(),
                                    placeholder = { Text("Novo usuário") },
                                    singleLine = true
                                )
                                
                                Spacer(modifier = Modifier.height(8.dp))
                                
                                OutlinedTextField(
                                    value = newAdminPassword,
                                    onValueChange = { newAdminPassword = it },
                                    modifier = Modifier.fillMaxWidth(),
                                    placeholder = { Text("Nova senha") },
                                    visualTransformation = PasswordVisualTransformation(),
                                    singleLine = true
                                )
                                
                                Button(
                                    onClick = {
                                        if (newAdminUser.isNotEmpty() && newAdminPassword.isNotEmpty()) {
                                            // Atualizar credenciais será feito no onSave
                                            newAdminUser = ""
                                            newAdminPassword = ""
                                        }
                                    },
                                    modifier = Modifier.padding(top = 8.dp)
                                ) {
                                    Text("Alterar Credenciais")
                                }
                            }
                        }
                    }
                }
                
                // Botões de ação
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = {
                            val novasConfiguracoes = configuracoes.copy(
                                nomeUsuario = nomeUsuario,
                                themeMode = themeMode,
                                colorTheme = colorTheme,
                                igpmAnual = igpmAnual.replace(',', '.').toDoubleOrNull() ?: 0.0,
                                isAdmin = isAdmin,
                                adminUser = if (newAdminUser.isNotEmpty()) newAdminUser else configuracoes.adminUser,
                                adminPassword = if (newAdminPassword.isNotEmpty()) newAdminPassword else configuracoes.adminPassword
                            )
                            onSave(novasConfiguracoes)
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Text("Salvar", color = Color.White)
                    }
                }
            }
        }
    }
}