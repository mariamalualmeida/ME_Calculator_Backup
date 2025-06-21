#!/bin/bash

# ME EMPREENDIMENTOS - Build Script para Android APK
set -e  # Exit on any error

echo "=== ME EMPREENDIMENTOS - Build do Aplicativo Android ==="
echo ""

# Função para verificar dependências
check_dependencies() {
    echo "📋 Verificando dependências..."
    
    # Verificar Java
    if ! command -v java &> /dev/null; then
        echo "❌ Java não encontrado. Instale Java JDK 11+ antes de continuar."
        echo "   Download: https://adoptium.net/"
        exit 1
    fi
    
    echo "✅ Java encontrado: $(java -version 2>&1 | head -1)"
    
    # Verificar JAVA_HOME
    if [ -z "$JAVA_HOME" ]; then
        echo "⚠️  JAVA_HOME não definido. Tentando detectar..."
        if command -v java &> /dev/null; then
            export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
            echo "   JAVA_HOME definido como: $JAVA_HOME"
        fi
    fi
}

# Função para verificar estrutura do projeto
check_project() {
    echo "📁 Verificando estrutura do projeto..."
    
    if [ ! -f "./gradlew" ]; then
        echo "❌ gradlew não encontrado. Certifique-se de estar no diretório raiz."
        exit 1
    fi
    
    if [ ! -f "./build.gradle.kts" ]; then
        echo "❌ build.gradle.kts não encontrado."
        exit 1
    fi
    
    echo "✅ Estrutura do projeto verificada"
}

# Função principal de build
build_apk() {
    echo ""
    echo "📱 Iniciando build do APK..."
    echo "   Empresa: ME EMPREENDIMENTOS"
    echo "   Versão: 1.0.0"
    echo "   Target: Android 7.0+ (API 24+)"
    echo ""
    
    # Tornar gradlew executável
    chmod +x gradlew
    
    # Limpar build anterior
    echo "🧹 Limpando builds anteriores..."
    ./gradlew clean
    
    # Build do APK
    echo "🔧 Compilando APK..."
    ./gradlew assembleDebug
    
    # Verificar se o build foi bem-sucedido
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$APK_PATH" ]; then
        echo ""
        echo "✅ BUILD SUCCESSFUL!"
        echo "📦 APK gerado: $APK_PATH"
        echo "📊 Tamanho: $(du -h "$APK_PATH" | cut -f1)"
        return 0
    else
        echo "❌ BUILD FAILED!"
        exit 1
    fi
}

# Executar verificações e build
check_dependencies
check_project
build_apk

# Criar arquivo info do APK
cat > build/outputs/apk/debug/app-info.txt << EOF
=== ME EMPREENDIMENTOS - Simulador de Empréstimos ===

📱 Arquivo APK: app-debug.apk
📅 Data de build: $(date)
🏢 Empresa: ME EMPREENDIMENTOS
📋 Versão: 1.0.0
🎯 Plataforma: Android 7.0+ (API 24+)
📐 Arquitetura: Universal (arm64-v8a, armeabi-v7a, x86, x86_64)

🔧 Funcionalidades incluídas:
✅ Simulador de empréstimos completo
✅ 8 paletas de cores personalizáveis
✅ Tema claro/escuro dinâmico
✅ Validações em português
✅ Área administrativa
✅ Exportação de PDF
✅ Configurações avançadas
✅ Interface Material Design 3

📋 Instruções de instalação:
1. Baixe o arquivo app-debug.apk
2. No Android, vá em Configurações > Segurança
3. Ative "Fontes desconhecidas" ou "Instalar apps desconhecidos"
4. Abra o arquivo APK baixado
5. Toque em "Instalar"

⚠️ Nota: Este é um APK de debug para testes.
Para produção, use um APK assinado com certificado oficial.

🌐 Alternativa PWA:
Acesse pelo navegador e adicione à tela inicial para
experiência similar a app nativo.
EOF

echo "✅ Build concluído com sucesso!"
echo ""
echo "📁 Arquivos gerados:"
echo "   • build/outputs/apk/debug/app-info.txt"
echo ""
echo "📋 Para instalar no Android:"
echo "   1. Baixe o APK quando disponível"
echo "   2. Ative 'Fontes desconhecidas' nas configurações"
echo "   3. Instale o arquivo APK"
echo ""
echo "🌐 Alternativa PWA (Recomendado):"
echo "   1. Acesse o app pelo navegador"
echo "   2. Menu > 'Adicionar à tela inicial'"
echo ""