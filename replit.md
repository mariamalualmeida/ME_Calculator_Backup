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

## User Preferences

Preferred communication style: Simple, everyday language in Portuguese (PTBR).
App branding: Company name "ME EMPREENDIMENTOS" should be prominently displayed above application titles.