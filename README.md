# Simulador de Empréstimos

## Visão Geral

Aplicativo Android nativo em Kotlin da **ME EMPREENDIMENTOS** que simula cálculos de empréstimos com validação de limites dinâmicos de juros. Implementa scroll automático após cálculo, exportação PDF com tabela de vencimentos, configurações de usuário e área administrativa para edição de limites. Interface Material Design 3 com mensagens contextuais singular/plural.

## Funcionalidades

### Simulação de Empréstimos
- **Valor do empréstimo**: Campo monetário com formatação R$
- **Número de parcelas**: 1 a 15 parcelas
- **Taxa de juros**: Percentual com 2 casas decimais
- **Cálculo**: Fórmula `Prestação = Valor × (1 + Juros)ᴺ ÷ N`
- **Scroll automático**: Tela rola até o resultado após calcular
- **Campo somente-leitura**: Prestação calculada automaticamente

### Validações Dinâmicas
- **Nova tabela de limites**: Parcelas 1-2 (15-100%), 3 (15-30%), 4-15 (limites específicos)
- **Mensagens contextuais**: Singular "1 PARCELA" vs plural "N PARCELAS"
- **Validação em tempo real**: Limpeza automática se campos ficarem vazios

### Exportação PDF
- **Relatório completo**: Cabeçalho ME EMPREENDIMENTOS + nome do usuário
- **Tabela de parcelas**: Nº, data vencimento (dia 5), valor
- **Salvar em Downloads**: Compartilhamento automático disponível

### Configurações
- **Nome do usuário**: Salvo em DataStore Preferences
- **Login administrativo**: Usuário "Migueis", senha "Laila@10042009"
- **Edição de limites**: CRUD para as 15 faixas de juros (admin apenas)

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

### 2. Nova Tabela de Limites de Juros

```kotlin
private val limitesJuros = mapOf(
    1 to Pair(15.00, 100.00),
    2 to Pair(15.00, 100.00),
    3 to Pair(15.00, 30.00),
    4 to Pair(15.00, 24.00),
    5 to Pair(15.00, 22.00),
    6 to Pair(15.00, 20.00),
    7 to Pair(14.75, 18.00),
    8 to Pair(14.36, 17.00),
    9 to Pair(13.92, 16.00),
    10 to Pair(13.47, 15.00),
    11 to Pair(13.03, 14.00),
    12 to Pair(12.60, 13.00),
    13 to Pair(12.19, 12.60),
    14 to Pair(11.80, 12.19),
    15 to Pair(11.43, 11.80)
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

