# Loan Simulator Application

## Overview

This is a web-based loan simulator application built with vanilla HTML, CSS, and JavaScript. The application calculates loan installments using the formula `installment = Value × (1 + Interest)^N / N` with Material Design 3 interface. It implements validation rules for interest rate limits based on the number of installments and provides user-friendly error messages in Portuguese.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Pure HTML5, CSS3, and vanilla JavaScript
- **Design System**: Material Design 3 with Roboto font family
- **Responsive Design**: Single-page application optimized for mobile and desktop
- **State Management**: Client-side state management using JavaScript classes

### Key Components

#### Core Application Logic (`script.js`)
- **SimuladorEmprestimos Class**: Main application controller that handles all business logic
- **Interest Rate Validation**: Built-in table with min/max interest rates per installment count
- **Input Formatting**: Currency and percentage formatting for user inputs
- **Real-time Validation**: Immediate feedback on input changes

#### User Interface (`index.html`)
- **Material Design 3 Components**: Cards, input fields, and buttons following MD3 specifications
- **Accessibility Features**: Proper labeling and focus management
- **Progressive Enhancement**: Works without JavaScript for basic functionality

#### Styling (`style.css`)
- **CSS Custom Properties**: Consistent theming throughout the application
- **Flexbox Layout**: Responsive layout system
- **Material Design Tokens**: Color scheme and elevation following MD3 guidelines

#### Testing Infrastructure (`test.html`)
- **Unit Testing**: Comprehensive test suite for core calculation functions
- **Validation Testing**: Tests for all business rule validations
- **UI Testing**: Interactive testing interface for manual verification

## Data Flow

1. **User Input**: User enters loan amount, number of installments, and interest rate
2. **Real-time Validation**: Input validation occurs on every field change
3. **Calculation Trigger**: User clicks "CALCULAR" button to perform calculation
4. **Business Logic Execution**: Application validates inputs against predefined rules
5. **Result Display**: Calculated installment amount is displayed or error messages are shown
6. **State Management**: Application maintains clean state with automatic result clearing

### Interest Rate Limits Table
```
Installments 1-3:  15.00% - 30.00%
Installments 4-15: 15.00% - 24.00%
```

## External Dependencies

### CDN Dependencies
- **Google Fonts**: Roboto font family for Material Design compliance
- **Material Icons**: Icon font for UI elements

### Development Server
- **Python HTTP Server**: Simple static file server for development and deployment
- **Port Configuration**: Runs on port 5000 with automatic port forwarding

## Deployment Strategy

### Static File Hosting
- **Server Technology**: Python's built-in HTTP server
- **Deployment Method**: Static file serving from root directory
- **Environment**: Replit-hosted with automatic deployments

### Build Process
- **No Build Step**: Direct file serving without compilation
- **Asset Management**: All assets served directly from filesystem
- **Cache Strategy**: Browser-based caching for static assets

## Changelog

- June 20, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.