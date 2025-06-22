// Teste dos cálculos atuais do sistema
// Simulação: R$ 1000, 15% juros, 1 parcela, 15 dias extras

const valor = 1000;
const juros = 15;
const nParcelas = 1;
const diasExtra = 15;
const taxaEfetiva = juros / 100; // 0.15

console.log("=== TESTE DOS SISTEMAS DE CÁLCULO ===");
console.log(`Valor: R$ ${valor}`);
console.log(`Juros: ${juros}%`);
console.log(`Parcelas: ${nParcelas}`);
console.log(`Dias extras: ${diasExtra}`);
console.log("");

// 1. Juros Simples
function calcularJurosSimples(valor, taxaEfetiva, nParcelas, diasExtra = 0) {
    const prestacaoBase = valor * (1 + (taxaEfetiva * nParcelas)) / nParcelas;
    
    if (diasExtra !== 0) {
        const taxaDiaria = taxaEfetiva / 30.0;
        const jurosProrrata = valor * taxaDiaria * diasExtra;
        const primeiraParcela = prestacaoBase + jurosProrrata;
        
        return {
            parcelaNormal: prestacaoBase,
            primeiraParcela: primeiraParcela,
            jurosDiasExtras: jurosProrrata,
            diasExtra: diasExtra
        };
    }
    
    return {
        parcelaNormal: prestacaoBase,
        primeiraParcela: prestacaoBase,
        jurosDiasExtras: 0,
        diasExtra: 0
    };
}

// 2. Juros Compostos Mensais
function calcularJurosCompostosMensais(valor, taxaEfetiva, nParcelas, diasExtra = 0) {
    const prestacaoBase = (valor * Math.pow(1 + taxaEfetiva, nParcelas)) / nParcelas;
    
    if (diasExtra !== 0) {
        const taxaDiaria = taxaEfetiva / 30.0;
        const jurosProrrata = valor * taxaDiaria * diasExtra;
        const primeiraParcela = prestacaoBase + jurosProrrata;
        
        return {
            parcelaNormal: prestacaoBase,
            primeiraParcela: primeiraParcela,
            jurosDiasExtras: jurosProrrata,
            diasExtra: diasExtra
        };
    }
    
    return {
        parcelaNormal: prestacaoBase,
        primeiraParcela: prestacaoBase,
        jurosDiasExtras: 0,
        diasExtra: 0
    };
}

// 3. Juros Compostos Pro-rata Real (fórmula corrigida)
function calcularJurosCompostosProRataReal(valor, taxaEfetiva, nParcelas, diasExtra = 0) {
    const montante = valor * Math.pow(1 + taxaEfetiva, nParcelas);
    const prestacaoBase = montante / nParcelas;
    
    if (diasExtra !== 0) {
        // Corrigido: calcular juros extras sobre o valor principal, não sobre a parcela
        const taxaDiaria = taxaEfetiva / 30.0; // Taxa linear para consistência
        const jurosProrrata = valor * taxaDiaria * diasExtra;
        
        // Distribuir juros extras igualmente entre todas as parcelas
        const jurosProrrataPorParcela = jurosProrrata / nParcelas;
        const prestacaoComJurosExtras = prestacaoBase + jurosProrrataPorParcela;
        
        return {
            parcelaNormal: prestacaoComJurosExtras,
            primeiraParcela: prestacaoComJurosExtras,
            jurosDiasExtras: jurosProrrata,
            diasExtra: diasExtra
        };
    }
    
    return {
        parcelaNormal: prestacaoBase,
        primeiraParcela: prestacaoBase,
        jurosDiasExtras: 0,
        diasExtra: 0
    };
}

// Executar testes
const resultadoSimples = calcularJurosSimples(valor, taxaEfetiva, nParcelas, diasExtra);
const resultadoCompostosMensal = calcularJurosCompostosMensais(valor, taxaEfetiva, nParcelas, diasExtra);
const resultadoProRataReal = calcularJurosCompostosProRataReal(valor, taxaEfetiva, nParcelas, diasExtra);

console.log("1. JUROS SIMPLES:");
console.log(`   Parcela: R$ ${resultadoSimples.primeiraParcela.toFixed(2)}`);
console.log(`   Juros dias extras: R$ ${resultadoSimples.jurosDiasExtras.toFixed(2)}`);
console.log("");

console.log("2. JUROS COMPOSTOS MENSAIS:");
console.log(`   Parcela: R$ ${resultadoCompostosMensal.primeiraParcela.toFixed(2)}`);
console.log(`   Juros dias extras: R$ ${resultadoCompostosMensal.jurosDiasExtras.toFixed(2)}`);
console.log("");

console.log("3. JUROS COMPOSTOS PRO-RATA REAL:");
console.log(`   Parcela: R$ ${resultadoProRataReal.primeiraParcela.toFixed(2)}`);
console.log(`   Juros dias extras: R$ ${resultadoProRataReal.jurosDiasExtras.toFixed(2)}`);
console.log("");

console.log("=== VALOR ESPERADO ===");
console.log("Parcela: R$ 1225,00");
console.log("Juros dias extras: R$ 75,00");