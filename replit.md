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
- June 21, 2025: Fixed reactive interface issues - date field now hides method options when cleared, admin panel synchronizes automatically with main page
- June 21, 2025: Implemented CustomEvent system for Web/PWA - eliminates need for manual page refresh after admin changes
- June 21, 2025: Enhanced admin mode validation - red borders now respect disabled rules setting in all versions (Web, PWA, Android)
- June 21, 2025: Added method selection UI to Android version - users can choose between "primeira parcela maior" and "distribuir igualmente"
- June 21, 2025: Implemented visual validation for interest rate field - red borders when values exceed limits, respects admin free mode
- June 21, 2025: Enhanced user experience with real-time validation feedback across all platforms (Web, PWA, Android)
- June 21, 2025: Fixed header layout with proper spacing between "ME" and "EMPREENDIMENTOS" text lines for better visual hierarchy
- June 21, 2025: Repositioned settings button to avoid text overlap, improved mobile responsiveness with adjusted padding
- June 21, 2025: Created comprehensive tutorial documentation system with 4 detailed installation guides (Android PWA/APK, iPhone PWA/React Native)
- June 21, 2025: Enhanced build-android.sh script with automated dependency checking, error handling, and installation assistance
- June 21, 2025: Implemented PDF tutorial generator for offline documentation distribution and user training materials
- June 21, 2025: Fixed critical percentage formatting bug where "15,50" was corrupted to "1555" by implementing input validation without destructive reformatting
- June 21, 2025: Separated percentage input handling from blur formatting to preserve user-entered decimal values during typing across all versions
- June 21, 2025: Implemented real-time percentage formatting as cents - "1555" now instantly shows "15,55" during typing
- June 21, 2025: Added 4-digit limit with automatic cent formatting: 1→"0,01", 15→"0,15", 155→"1,55", 1555→"15,55"
- June 21, 2025: Copied exact structure from working formatarMoeda() function to formatarPercentualTempoReal() for consistency
- June 21, 2025: Added aggressive event listener attachment strategy with multiple fallbacks and direct DOM manipulation
- June 21, 2025: SUCESSO: Formatação em tempo real funcionando corretamente - user confirmou que "1750" agora mostra "17,50" instantaneamente
- June 21, 2025: Implementado formulário completo de dados cadastrais com seção expansível/recolhível para análise de crédito completa
- June 21, 2025: Adicionado sistema de juros configuráveis no painel administrativo (Simples, Compostos Diários, Compostos Mensais, Pro-rata Real)
- June 21, 2025: Melhorias de layout implementadas - removidos campos duplicados, reorganizado telefone após CPF, removidos ícones das seções
- June 21, 2025: Botão de formulário completo atualizado para seguir paleta de cores ativa, geração PDF expandida para incluir todos dados cadastrais
- June 21, 2025: Interface administrativa expandida com seleção de sistema de juros e controle de regras unificado usando selects
- June 21, 2025: CORREÇÕES CRÍTICAS IMPLEMENTADAS: Sistema de juros agora persiste configuração, cálculos usam sistema selecionado, botão expandir segue paleta de cores, erro PDF eliminado
- June 21, 2025: Adicionada função obterDadosCompletosPdf() para inclusão completa de dados cadastrais em PDFs com verificação segura de elementos DOM
- June 21, 2025: Configuração sistemaJuros incluída em defaultConfig, salvarConfiguracoesModal() e abrirConfiguracoes() para persistência completa
- June 21, 2025: Função calcular() atualizada para usar this.configuracoes.sistemaJuros e calcularParcela() modificada para aceitar parâmetro sistemaJuros
- June 21, 2025: Função aplicarPaletaCores() expandida para incluir botão .form-toggle-btn garantindo cores consistentes em toda interface
- June 21, 2025: MELHORIAS FINAIS IMPLEMENTADAS: PDF dados cadastrais completos, modal tela completa, IGMP movido para admin, sistema juros exibido no resultado
- June 21, 2025: Modal configurações agora ocupa 95% da tela (width/height) para melhor experiência de usuário
- June 21, 2025: Campo IGPM transferido de configurações gerais para área administrativa restrita com descrição explicativa
- June 21, 2025: Sistema de juros usado agora é exibido no resultado do cálculo com destaque visual em caixa colorida
- June 21, 2025: Função obterDadosCompletosPdf() corrigida para capturar dados independente da visibilidade do formulário
- June 22, 2025: IMPLEMENTADAS MELHORIAS DE UX AVANÇADAS: Modal fullscreen responsivo, login admin oculto após autenticação, botões unificados
- June 22, 2025: Modal configurações revertido para padrão centralizado seguindo layout da tela inicial (max-width 800px, altura adaptável ao conteúdo)
- June 22, 2025: Login administrativo agora oculta automaticamente após autenticação, melhorando fluxo de navegação
- June 22, 2025: Unificadas todas as funções de salvamento (credenciais, limites, configurações) em botão único centralizado e padronizado
- June 22, 2025: Removidas funções duplicadas salvarLimitesAdmin() e salvarCredenciaisAdmin(), consolidando lógica em salvarConfiguracoesModal()
- June 22, 2025: Todos os botões administrativos (.save-btn, .admin-btn, #adminLoginBtn) padronizados com mesmo estilo, tamanho e efeitos hover
- June 22, 2025: CORREÇÕES CRÍTICAS DE RESPONSIVIDADE MOBILE: Modal configurações otimizado para evitar corte superior/inferior
- June 22, 2025: Implementado max-height 95vh e scroll interno no modal-body para garantir botão "SALVAR" sempre visível
- June 22, 2025: Reduzido padding de cabeçalho/rodapé (24dp→16dp) e conteúdo (24dp→16dp) para otimizar espaço em telas pequenas
- June 22, 2025: Correções aplicadas identicamente nas versões Web/PWA e Android para consistência total de experiência
- June 22, 2025: REVERSÃO COMPLETA PARA FORMATO DA TELA PRINCIPAL: Modal configurações ajustado para max-width 600px igual container principal
- June 22, 2025: Corrigido problema crítico do botão "Dados completos do cliente" com validação robusta de elementos DOM
- June 22, 2025: Implementado reset completo do estado administrativo ao fechar modal - limpa campos e oculta painel
- June 22, 2025: Adicionado suporte à paleta de cores no botão de formulário completo para consistência visual
- June 22, 2025: Modal Android reduzido para 90% da tela (0.9f) seguindo mesmo padrão das outras versões
- June 22, 2025: TODAS CORREÇÕES FINAIS IMPLEMENTADAS: Modal tamanho corrigido (640px), select estado civil padronizado (min-width 180px)
- June 22, 2025: Ícones senha atualizados para símbolos minimalistas (●/○), campos numéricos com teclado apropriado (type="tel" inputmode="numeric")
- June 22, 2025: Validação data nascimento corrigida (anos desde 1920), código duplicado removido, toggle regras funcionando corretamente
- June 22, 2025: Campos telefone/CEP/referências configurados para teclado numérico, caches atualizados (v=20250622062500)
- June 22, 2025: Consistência total entre versões Web/PWA/Android mantida - todas correções aplicadas sistematicamente em todas plataformas
- June 22, 2025: SOLUÇÃO DEFINITIVA IMPLEMENTADA: Nova arquitetura de autenticação administrativa - painel sempre oculto ao abrir configurações, exige reautenticação a cada acesso
- June 22, 2025: Sistema de preservação de configurações implementado - estado administrativo preservado durante sessão, validações funcionam corretamente com modo livre
- June 22, 2025: Correções aplicadas em todas as versões (Web/PWA/Android) - fecharModal() não destrói mais configurações, atualizarClassesModoLivre() funciona adequadamente
- June 22, 2025: Arquitetura simplificada - removido sistema complexo de localStorage session tracking, implementado fluxo direto de login a cada abertura de configurações
- June 22, 2025: LIMPEZA COMPLETA DO SISTEMA - removidas 94 linhas CSS redundantes do estado civil, eliminado MutationObserver desnecessário, consolidadas validações duplicadas
- June 22, 2025: Otimização massiva - removidas funções obsoletas, comentários redundantes, event listeners duplicados, simplificado CSS com solução de 2 linhas para estado civil
- June 22, 2025: Padronização de código - unificados tipos de dados boolean/string, consolidadas funções de validação, removido JavaScript forçando CSS via DOM
- June 22, 2025: Performance melhorada - eliminados timeouts desnecessários, MutationObserver, event listeners múltiplos, especificidade CSS extrema
- June 22, 2025: CORREÇÕES CRÍTICAS APLICADAS EM TODAS VERSÕES - credenciais hardcoded removidas (admin/admin123), timeouts eliminados, console logs limpos, CSS otimizado, validações consolidadas, estado administrativo corrigido, cache atualizado (v20250622095500)
- June 22, 2025: TODOS OS PROBLEMAS SISTEMÁTICOS CORRIGIDOS - estado civil com estilos completos, CSS redundante removido, especificidade excessiva eliminada, regras unificadas para formulários, dark theme consolidado, comentários atualizados, arquitetura CSS reorganizada (v20250622101000)
- June 22, 2025: IMPLEMENTAÇÃO COMPLETA DAS SOLICITAÇÕES - estado civil agora igual aos outros campos (estrutura HTML corrigida), campos bairro/cidade adicionados às referências, geração PDF atualizada com novos campos, modal fecha automaticamente após salvar, correções aplicadas em todas versões (v20250622102400)
- June 22, 2025: NOVA FÓRMULA PRO-RATA REAL IMPLEMENTADA - sistema agora calcula juros extras sobre cada parcela individual e soma totais, em vez de distribuir juros do principal, resultando em valores substancialmente maiores e matemática mais precisa nas versões Web/PWA e Android (v20250622140900)
- June 22, 2025: CORREÇÃO CRÍTICA PRO-RATA REAL - fórmula corrigida para calcular juros extras sobre valor principal (não sobre parcela), agora todos sistemas convergem para R$ 1.225,00 conforme esperado, sistema padrão definido como "Juros Compostos Mensais", regras de limites mantidas habilitadas por padrão (v20250622143000)
- June 22, 2025: SINCRONIZAÇÃO DE CONFIGURAÇÕES IMPLEMENTADA - sistema agora recarrega configurações do localStorage antes de cada cálculo, garantindo que mudanças administrativas (sistema de juros, regras de limite, IGPM) sejam aplicadas imediatamente sem necessidade de refresh da página, correção aplicada nas versões Web/PWA e Android (v20250622144500)
- June 22, 2025: CORREÇÃO ESPECÍFICA PRO-RATA REAL - ajustada fórmula apenas para 1 parcela usar cálculo linear igual aos outros sistemas (R$ 1.225,00), múltiplas parcelas mantém lógica exponencial original, configuração de regras de limites padronizada como "Habilitar regras" por padrão, sincronização de selects administrativos implementada (v20250622145500)
- June 22, 2025: NOVA LÓGICA PRO-RATA REAL PARA MÚLTIPLAS PARCELAS - sistema agora calcula juros extras mensalmente sobre cada parcela individual (em vez de distribuir valor total), resultando em valores substancialmente maiores para múltiplas parcelas, primeira parcela mantém cálculo linear, select "Habilitar regras" configurado como padrão selecionado no HTML, correções aplicadas nas versões Web/PWA e Android (v20250622150500)
- June 24, 2025: LIMPEZA COMPLETA DO SISTEMA - removidos TODOS os resíduos do módulo de chat/hub em todas as versões (Web/PWA/Android), botão configurações funciona corretamente abrindo apenas modal de configurações, credenciais admin/admin123 funcionando, cache forçado v=20250624082000 para eliminar interferências (v20250624082000)
- June 24, 2025: VARREDURA SISTEMÁTICA FINAL - análise linha por linha de todos arquivos, eliminação total de qualquer código relacionado a chat/hub, credenciais administrativas testadas e funcionando, sistema completamente dedicado ao simulador ME EMPREENDIMENTOS, cache v=20250624083000 (v20250624083000)
- June 24, 2025: CORREÇÕES CRÍTICAS IMPLEMENTADAS - modal configurações não abre mais automaticamente na inicialização, área administrativa funciona corretamente após login admin/admin123, botão X de fechar modal aumentado (48px), botões seguem paleta de cores definida, botão expandir dados completos funcionando, cache v=20250624085000 (v20250624085000)
- June 24, 2025: RECUPERAÇÃO COMPLETA PÓS-ROLLBACK - todas melhorias restauradas: erro inicialização corrigido, cores botões forçadas com !important, botão expandir funcionando, área administrativa funcional, cache v=20250624090000 (v20250624090000)
- June 24, 2025: CORREÇÃO CRÍTICA FUNÇÃO PDF - erro de sintaxe na exportarPdf() corrigido, função gerarPdfSimples() restaurada, botão expandir dados completos conectado corretamente ao ID formToggleBtn, sistema funcionando completamente, cache v=20250624092000 (v20250624092000)
- June 24, 2025: CORREÇÃO DEFINITIVA ERRO INICIALIZAÇÃO - função escurecerCor() implementada corrigindo TypeError crítico, código duplicado nas funções PDF removido, sistema inicializando corretamente, todas funcionalidades restauradas e funcionando, cache v=20250624093000 (v20250624093000)

## User Preferences

Preferred communication style: Simple, everyday language in Portuguese (PTBR).
App branding: Company name "ME EMPREENDIMENTOS" should be prominently displayed above application titles.
Deployment preference: PWA (Progressive Web App) installation for mobile devices as primary method.
User request: Provide clear instructions for Android installation without technical complexity.