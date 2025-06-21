# ME EMPREENDIMENTOS - Simulador de Empréstimos Web

## Overview

Complete web-based loan simulator application with advanced calculation features, administrative area, and PDF export functionality. The application calculates loan installments using the formula `installment = Value × (1 + Interest)^N / N` with Material Design 3 interface. It implements dynamic validation rules, pro-rata calculations, IGPM correction, and provides user-friendly error messages in Portuguese (uppercase format as specified).

## System Architecture

### Web Application Architecture
- **Technology Stack**: HTML5, CSS3, JavaScript (ES6+)
- **Design System**: Material Design 3 with light/dark theme support
- **Architecture Pattern**: Modular JavaScript with class-based organization
- **State Management**: LocalStorage for configuration persistence

### Key Components

#### Core Application Logic (`script.js`)
- **SimuladorEmprestimos Class**: Main business logic controller with ES6 class syntax
- **Interest Rate Validation**: Dynamic table with min/max interest rates per installment count
- **Advanced Calculations**: Pro-rata, IGPM correction, and compound interest support
- **Input Formatting**: Real-time currency and percentage formatting for Brazilian locale
- **PDF Generation**: Complete report generation with jsPDF library

#### User Interface (`index.html`)
- **Material Design 3**: Modern responsive UI with semantic HTML structure
- **Auto-focus**: Automatic focus on loan amount field when page loads
- **Accessibility Features**: Proper ARIA labeling and keyboard navigation
- **Responsive Design**: Mobile-first approach with adaptive layouts

#### Styling System (`style.css`)
- **CSS Custom Properties**: Theme variables for consistent design system
- **Dark/Light Mode**: Complete theme switching with user preference persistence
- **Mobile Responsive**: Optimized layouts for all screen sizes
- **Modern CSS**: Flexbox, Grid, and advanced selectors for clean styling

#### Testing Infrastructure (`test.html`)
- **Automated Testing**: Comprehensive test suite for all calculation functions
- **Validation Testing**: Tests for business rule validations and edge cases
- **DOM Testing**: UI interaction and formatting validation

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

### Web Application Setup
- **Dependencies**: jsPDF library loaded via CDN
- **Browser Support**: Chrome, Firefox, Safari, Edge (modern versions)
- **No Build Process**: Pure vanilla JavaScript, CSS, and HTML
- **Testing**: Browser-based test suite with automated validation

### Deployment Strategy
- **Static Hosting**: Any web server or file hosting service
- **Local Development**: Simple HTTP server (Python, Node.js, or any static server)
- **Production**: Can be deployed to Netlify, Vercel, GitHub Pages, or any static hosting

### Technical Requirements
- **Modern Browser**: ES6+ support required
- **LocalStorage**: For configuration persistence
- **JavaScript Enabled**: Core functionality depends on client-side JavaScript

## Project Structure

```
SimuladorEmprestimos/
├── index.html          # Main application page
├── style.css           # Material Design 3 styles and themes
├── script.js           # Core business logic and UI interactions
├── test.html           # Automated testing suite
├── README.md           # Complete project documentation
└── replit.md           # Technical architecture and preferences
```

## Changelog

- June 20, 2025: Initial web application setup with basic loan calculator
- June 20, 2025: Implemented complete feature set - dynamic interest rate limits table, automatic scroll, PDF export with payment schedule, user configurations, and administrative area
- June 20, 2025: Added comprehensive test suite and complete README documentation
- June 20, 2025: Updated app branding to "ME EMPREENDIMENTOS" with company name prominently displayed
- June 20, 2025: Consolidated to pure web application - removed Android components for focused web deployment
- June 20, 2025: Final optimization - cleaned CSS redundancies, removed unused Material Icons dependency, updated documentation to reflect web-only architecture
- June 20, 2025: Added Progressive Web App (PWA) support with manifest.json for Android installation capability
- June 20, 2025: Created complete Android project structure with Jetpack Compose for future native development
- June 20, 2025: Implemented PWA installation process as primary method for mobile deployment
- June 20, 2025: Fixed percentage field input issues - now supports comma input, deletion, and proper formatting across all versions
- June 20, 2025: Enhanced PDF reports - removed "Cliente:" label when empty, fixed zero values, increased font sizes, centralized table text
- June 20, 2025: Updated app icon to golden lion design with transparent background for professional appearance
- June 20, 2025: Fixed PWA icon compatibility - created dedicated SVG icons (192x192 and 512x512) with proper manifest configuration
- June 20, 2025: Implemented comprehensive date validation system rejecting impossible dates (32/13/2025, 55/55/2030) with leap year support
- June 20, 2025: Enhanced Android validation functions with proper date formatting and business rule validation
- June 20, 2025: Implemented simplified solution - added fixed optional client name/CPF fields on main screen
- June 20, 2025: Added configuration toggle for showing interest rate in PDF reports
- June 20, 2025: Updated PDF generation to use exactly 2 decimal places formatting (R$ 1.234,56)
- June 20, 2025: Created new golden dollar sign ($) icon replacing lion design for clearer financial representation
- June 20, 2025: Applied same enhancements to Android version with name/CPF fields and CPF auto-formatting
- June 20, 2025: Implemented administrative rule disabling system - admin can disable all validation limits via checkbox
- June 20, 2025: Standardized input field styling for name/CPF fields to match other form elements consistently
- June 20, 2025: Added "modo livre" functionality allowing unlimited parcels and interest rates for authenticated administrators
- June 20, 2025: Implemented "primeira parcela maior" method - pro-rata interest only affects first installment instead of being distributed across all installments
- June 20, 2025: Updated calculation logic in both web and Android versions to show first installment amount separately when extra days apply
- June 20, 2025: Enhanced PDF reports to display first installment value separately and include extra days/interest information when applicable
- June 20, 2025: Modified result display to clearly show "1ª parcela: R$ X,XX" and "Demais N parcelas: R$ Y,YY" when pro-rata applies
- June 20, 2025: Fixed visual validation (red border) to respect admin free mode - no red borders when rules are disabled
- June 20, 2025: Corrected PDF report order - "Simulado por" now appears before client data (name/CPF) as requested
- June 20, 2025: Applied validation fixes to both web and Android versions for consistency across platforms
- June 20, 2025: Fixed calculation logic - extra days now calculated correctly from loan date vs requested first payment date (not absolute difference)
- June 20, 2025: Fixed display bug showing "Demais 0 parcelas" when there's only 1 installment with extra days
- June 20, 2025: Implemented user choice toggle for extra days calculation - "primeira parcela maior" vs "distribuir em todas as parcelas"
- June 20, 2025: Added dynamic UI elements that appear only when a date is entered, allowing method selection
- June 20, 2025: Updated both web and Android versions with consistent calculation logic and display corrections
- June 20, 2025: Implemented all UX improvements - method toggle only for 2+ parcels, auto-hide on field changes, fixed singular/plural text
- June 20, 2025: Redesigned app icon with modern R$ symbol in blue gradient, updated PWA manifest for proper installation
- June 20, 2025: Fixed admin free mode validation - red borders now respect disabled rules configuration
- June 20, 2025: Unified PDF export button styling to match main calculate button for visual consistency
- June 20, 2025: Corrected calculation logic - method "distribuir" now only applies to multiple parcels, avoiding compound interest on single parcels
- June 20, 2025: Final system optimization - removed date icon, fixed admin mode red borders, cleaned CSS, updated icons with modern R$ design
- June 20, 2025: Comprehensive bug fixes - method toggle logic, PDF button styling, manifest cache update, removed duplicate files
- June 20, 2025: Critical calculation fix - corrected "distribuir" method to eliminate compound interest on pro-rata, ensuring both methods result in identical total costs
- June 20, 2025: Mathematical integrity restored - removed R$ 39-535 overcharge depending on installment count, now transparent and fair pricing

## User Preferences

Preferred communication style: Simple, everyday language in Portuguese (PTBR).
App branding: Company name "ME EMPREENDIMENTOS" should be prominently displayed above application titles.
Deployment preference: PWA (Progressive Web App) installation for mobile devices as primary method.
User request: Provide clear instructions for Android installation without technical complexity.