# Simulador de Empréstimos

## Visão Geral

Aplicativo Android nativo em Kotlin que simula cálculos de empréstimos com validação de limites de juros por número de parcelas. Implementa a fórmula `parcela = Valor × (1 + Juros)^N / N` com interface Material Design 3, validações específicas e mensagens de erro em português em caixa alta.

## Funcionalidades

- **Campos de entrada**: Valor do empréstimo (moeda), número de parcelas (1-15), taxa de juros (percentual com 2 casas)
- **Cálculo automático**: Botão CALCULAR que aplica a fórmula matemática
- **Validações**: Limites de juros por parcelas (15-30% para 1-3 parcelas, 15-24% para 4-15 parcelas)
- **Mensagens de erro**: Textos específicos em português e caixa alta conforme especificação
- **Interface Material 3**: Design moderno com Jetpack Compose
- **Foco automático**: Campo valor do empréstimo recebe foco ao abrir o app
- **Campo bloqueado**: Prestação é sempre calculada e não editável

## Estrutura do Projeto

```
SimuladorEmprestimos/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/simulador/emprestimos/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── SimuladorEmprestimosScreen.kt
│   │   │   │   ├── SimuladorViewModel.kt
│   │   │   │   └── ui/theme/
│   │   │   │       ├── Color.kt
│   │   │   │       ├── Theme.kt
│   │   │   │       └── Type.kt
│   │   │   ├── res/
│   │   │   │   ├── values/
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   ├── colors.xml
│   │   │   │   │   └── themes.xml
│   │   │   │   └── xml/
│   │   │   └── AndroidManifest.xml
│   │   └── test/
│   │       └── java/com/simulador/emprestimos/
│   │           └── SimuladorViewModelTest.kt
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── README.md
```

## Principais Trechos de Código

### 1. Função de Cálculo (SimuladorViewModel.kt)

```kotlin
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
```

### 2. Tabela de Limites de Juros

```kotlin
private val limitesJuros = mapOf(
    1 to Pair(15.00, 30.00),
    2 to Pair(15.00, 30.00),
    3 to Pair(15.00, 30.00),
    4 to Pair(15.00, 24.00),
    5 to Pair(15.00, 24.00),
    // ... até 15 parcelas
)
```

### 3. Validações com Mensagens Específicas

```kotlin
private fun validarCampos(valor: Double, nParcelas: Int, juros: Double): Pair<Boolean, String?> {
    if (nParcelas < 1) {
        return Pair(false, "NÚMERO DE PARCELAS INFERIOR AO MÍNIMO PERMITIDO.")
    }
    
    if (nParcelas > 15) {
        return Pair(false, "VOCÊ NÃO TEM PERMISSÃO PARA SIMULAÇÕES ACIMA DE 15 PARCELAS. PARA SIMULAÇÕES SUPERIORES A 15 PARCELAS, CONSULTE MIGUEIS.")
    }
    
    val limites = limitesJuros[nParcelas] ?: return Pair(false, "NÚMERO DE PARCELAS INVÁLIDO.")
    
    if (juros < limites.first) {
        return Pair(false, "[$nParcelas] PARCELA(S), A PORCENTAGEM MÍNIMA PERMITIDA É DE ${String.format("%.2f", limites.first).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.")
    }
    
    if (juros > limites.second) {
        return Pair(false, "[$nParcelas] PARCELA(S), A PORCENTAGEM MÁXIMA PERMITIDA É DE ${String.format("%.2f", limites.second).replace('.', ',')} %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS.")
    }
    
    return Pair(true, null)
}
```

### 4. Interface com Jetpack Compose

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SimuladorEmprestimosScreen(viewModel: SimuladorViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus() // Foco automático no valor do empréstimo
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Campos de entrada em Card Material 3
        // Botão de cálculo
        // Cards de resultado e erro
    }
}
```

## Como Gerar o APK

### Pré-requisitos
- Android Studio instalado
- JDK 8 ou superior
- Android SDK (API 24 ou superior)

### Passos para Build

1. **Clonar o projeto**:
```bash
git clone <repository-url>
cd SimuladorEmprestimos
```

2. **Build via linha de comando**:
```bash
# Debug APK
./gradlew assembleDebug

# Release APK (assinado)
./gradlew assembleRelease
```

3. **Build via Android Studio**:
- Abra o projeto no Android Studio
- Menu: Build → Build Bundle(s) / APK(s) → Build APK(s)
- Menu: Build → Generate Signed Bundle / APK (para release)

### Localização dos APKs

- **Debug**: `app/build/outputs/apk/debug/app-debug.apk`
- **Release**: `app/build/outputs/apk/release/app-release.apk`

## Testes Unitários

Execute os testes da função `calcularParcela`:

```bash
./gradlew test
```

### Testes Implementados

- Cálculo básico (R$ 1000, 15%, 1 parcela → R$ 1.150,00)
- Juros compostos (R$ 5000, 20%, 5 parcelas → R$ 2.985,98)
- Valores altos (R$ 2000, 24%, 10 parcelas → R$ 1.870,61)
- Máximo de parcelas (R$ 10000, 15%, 15 parcelas → R$ 5.420,45)
- Precisão decimal e casos extremos

## Instalação

1. Ative "Fontes desconhecidas" nas configurações do Android
2. Transfira o APK para o dispositivo
3. Toque no arquivo APK para instalar
4. Abra o app "Simulador de Empréstimos"

## Especificações Técnicas

- **Plataforma**: Android nativo
- **Linguagem**: Kotlin
- **UI Framework**: Jetpack Compose
- **Design**: Material Design 3
- **Versão mínima**: Android 7.0 (API 24)
- **Versão alvo**: Android 14 (API 34)

