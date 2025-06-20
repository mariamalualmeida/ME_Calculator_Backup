# Simulador de Empréstimos - Android Native Application

## Overview

This project has evolved from a web-based loan simulator to a native Android application built with Kotlin and Jetpack Compose. The application calculates loan installments using the formula `installment = Value × (1 + Interest)^N / N` with Material Design 3 interface. It implements validation rules for interest rate limits based on the number of installments and provides user-friendly error messages in Portuguese (uppercase format as specified).

## System Architecture

### Android Architecture
- **Technology Stack**: Kotlin, Jetpack Compose, Material Design 3
- **Architecture Pattern**: MVVM (Model-View-ViewModel) with StateFlow
- **UI Framework**: Jetpack Compose with declarative UI
- **State Management**: ViewModel with reactive state using StateFlow

### Key Components

#### Core Application Logic (`SimuladorViewModel.kt`)
- **SimuladorViewModel Class**: Main business logic controller using Android ViewModel
- **Interest Rate Validation**: Built-in table with min/max interest rates per installment count
- **Input Formatting**: Currency and percentage formatting for Brazilian locale
- **Reactive State**: StateFlow-based state management for UI updates

#### User Interface (`SimuladorEmprestimosScreen.kt`)
- **Jetpack Compose**: Modern declarative UI with Material Design 3 components
- **Auto-focus**: Automatic focus on loan amount field when app opens
- **Accessibility Features**: Proper labeling and keyboard navigation
- **Responsive Design**: Adaptive layout for different screen sizes

#### Main Activity (`MainActivity.kt`)
- **ComponentActivity**: Entry point with Compose integration
- **Theme Application**: Material Design 3 theme configuration
- **Screen Hosting**: Hosts the main simulator screen

#### Testing Infrastructure (`SimuladorViewModelTest.kt`)
- **Unit Testing**: Comprehensive test suite for core calculation functions
- **Validation Testing**: Tests for all business rule validations
- **JUnit Integration**: Standard Android testing framework

## Data Flow

1. **User Input**: User enters loan amount, number of installments, and interest rate
2. **Real-time Validation**: Input validation occurs through ViewModel state changes
3. **Calculation Trigger**: User clicks "CALCULAR" button to perform calculation
4. **Business Logic Execution**: ViewModel validates inputs against predefined rules
5. **State Updates**: UI automatically updates based on StateFlow emissions
6. **Result Display**: Calculated installment amount or error messages are shown

### Interest Rate Limits Table
```
Installments 1-3:  15.00% - 30.00%
Installments 4-15: 15.00% - 24.00%
```

### Error Messages (Portuguese, Uppercase)
- Parcelas < 1: "NÚMERO DE PARCELAS INFERIOR AO MÍNIMO PERMITIDO."
- Parcelas > 15: "VOCÊ NÃO TEM PERMISSÃO PARA SIMULAÇÕES ACIMA DE 15 PARCELAS. PARA SIMULAÇÕES SUPERIORES A 15 PARCELAS, CONSULTE MIGUEIS."
- Juros fora dos limites: "[N] PARCELA(S), A PORCENTAGEM MÍNIMA/MÁXIMA PERMITIDA É DE X,XX %. PARA EMPRÉSTIMOS COM JUROS FORA DOS LIMITES ESPECIFICADOS, CONSULTE MIGUEIS."

## Build Configuration

### Gradle Setup
- **Build System**: Gradle with Kotlin DSL
- **Android Plugin**: Application plugin with Compose support
- **Dependencies**: Material 3, Compose BOM, Lifecycle components
- **Testing**: JUnit, Espresso, Compose testing utilities

### Build Variants
- **Debug**: Development builds with debugging symbols
- **Release**: Production builds with optimization and obfuscation

## Deployment Strategy

### APK Generation
- **Debug APK**: Via `./gradlew assembleDebug`
- **Release APK**: Via `./gradlew assembleRelease`
- **Location**: `app/build/outputs/apk/[variant]/`

### Installation Requirements
- **Minimum SDK**: Android 7.0 (API 24)
- **Target SDK**: Android 14 (API 34)
- **Permissions**: None required (offline calculation app)

## Project Structure

```
SimuladorEmprestimos/
├── app/
│   ├── src/main/
│   │   ├── java/com/simulador/emprestimos/
│   │   │   ├── MainActivity.kt
│   │   │   ├── SimuladorEmprestimosScreen.kt
│   │   │   ├── SimuladorViewModel.kt
│   │   │   └── ui/theme/
│   │   ├── res/values/
│   │   └── AndroidManifest.xml
│   ├── src/test/
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
└── README.md
```

## Changelog

- June 20, 2025: Initial web application setup
- June 20, 2025: Complete migration to Android native application with Kotlin and Jetpack Compose
- June 20, 2025: Added comprehensive test suite and README documentation
- June 20, 2025: Updated app branding to "ME EMPREENDIMENTOS" with company name prominently displayed above "Simulador de Empréstimos"
- June 20, 2025: Implemented prompt revisado completo - nova tabela de limites dinâmicos, scroll automático, exportação PDF com tabela de vencimentos, configurações de usuário e área administrativa
- June 20, 2025: Corrigido tipo de teclado para campos monetários (Decimal) e ajustado datas PDF para começar 30 dias após simulação

## User Preferences

Preferred communication style: Simple, everyday language in Portuguese (PTBR).
App branding: Company name "ME EMPREENDIMENTOS" should be prominently displayed above application titles.