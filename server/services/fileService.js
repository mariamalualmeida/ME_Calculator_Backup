import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import sharp from 'sharp';
import { db } from '../db.js';
import { uploadedFiles, financialAnalyses } from '../../shared/schema.js';

export class FileService {
  constructor() {
    this.supportedTypes = {
      'application/pdf': this.processPDF,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.processDocx,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': this.processExcel,
      'application/vnd.ms-excel': this.processExcel,
      'text/csv': this.processCSV,
      'image/jpeg': this.processImage,
      'image/png': this.processImage,
      'image/jpg': this.processImage
    };
  }

  async processFile(file) {
    try {
      const processor = this.supportedTypes[file.mimetype];
      if (!processor) {
        throw new Error(`Tipo de arquivo não suportado: ${file.mimetype}`);
      }

      const content = await processor.call(this, file.path);
      const analysis = await this.analyzeFinancialContent(content, file.originalname);

      return {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        content,
        analysis
      };
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      throw new Error(`Erro ao processar arquivo: ${error.message}`);
    }
  }

  async processPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  async processDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  async processExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    let content = '';

    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      content += `Planilha: ${sheetName}\n`;
      content += jsonData.map(row => row.join('\t')).join('\n');
      content += '\n\n';
    });

    return content;
  }

  async processCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  }

  async processImage(filePath) {
    // Para OCR futuro - por enquanto retorna informações básicas da imagem
    const metadata = await sharp(filePath).metadata();
    return `Imagem: ${metadata.width}x${metadata.height} pixels, formato: ${metadata.format}`;
  }

  async analyzeFinancialContent(content, filename) {
    try {
      const documentType = this.detectDocumentType(content, filename);
      const bankName = this.detectBank(content, filename);
      
      let transactions = [];
      let summary = {};

      switch (documentType) {
        case 'extrato_bancario':
          transactions = this.extractBankStatementTransactions(content);
          summary = this.generateBankStatementSummary(transactions);
          break;
        case 'fatura_cartao':
          transactions = this.extractCreditCardTransactions(content);
          summary = this.generateCreditCardSummary(transactions);
          break;
        case 'contracheque':
          summary = this.extractPayrollData(content);
          break;
        default:
          summary = { message: 'Tipo de documento não identificado para análise automática' };
      }

      return {
        documentType,
        bankName,
        transactions,
        summary,
        rawContent: content.substring(0, 1000) // Primeiros 1000 caracteres para referência
      };
    } catch (error) {
      return {
        error: `Erro na análise: ${error.message}`,
        rawContent: content.substring(0, 500)
      };
    }
  }

  detectDocumentType(content, filename) {
    const contentLower = content.toLowerCase();
    const filenameLower = filename.toLowerCase();

    // Palavras-chave para extrato bancário
    const bankStatementKeywords = ['extrato', 'saldo', 'débito', 'crédito', 'transferência', 'pix'];
    
    // Palavras-chave para fatura de cartão
    const creditCardKeywords = ['fatura', 'cartão', 'limite', 'compras', 'pagamento mínimo'];
    
    // Palavras-chave para contracheque
    const payrollKeywords = ['salário', 'contracheque', 'holerite', 'desconto', 'inss', 'irrf'];

    if (bankStatementKeywords.some(keyword => contentLower.includes(keyword) || filenameLower.includes(keyword))) {
      return 'extrato_bancario';
    }
    
    if (creditCardKeywords.some(keyword => contentLower.includes(keyword) || filenameLower.includes(keyword))) {
      return 'fatura_cartao';
    }
    
    if (payrollKeywords.some(keyword => contentLower.includes(keyword) || filenameLower.includes(keyword))) {
      return 'contracheque';
    }

    return 'desconhecido';
  }

  detectBank(content, filename) {
    const contentLower = content.toLowerCase();
    const filenameLower = filename.toLowerCase();

    const banks = {
      'nubank': ['nubank', 'nu bank'],
      'itau': ['itaú', 'itau'],
      'bradesco': ['bradesco'],
      'santander': ['santander'],
      'caixa': ['caixa econômica', 'caixa'],
      'inter': ['inter', 'banco inter'],
      'c6': ['c6 bank', 'c6'],
      'picpay': ['picpay'],
      'bb': ['banco do brasil', 'bb']
    };

    for (const [bankCode, keywords] of Object.entries(banks)) {
      if (keywords.some(keyword => contentLower.includes(keyword) || filenameLower.includes(keyword))) {
        return bankCode;
      }
    }

    return 'desconhecido';
  }

  extractBankStatementTransactions(content) {
    const transactions = [];
    const lines = content.split('\n');

    // Regex para identificar transações (formato genérico)
    const transactionRegex = /(\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2})\s+([^0-9\-\+]+)\s+([\-\+]?\d+[.,]\d{2})/g;

    lines.forEach(line => {
      const match = transactionRegex.exec(line);
      if (match) {
        const [, date, description, amount] = match;
        transactions.push({
          date: this.parseDate(date),
          description: description.trim(),
          amount: this.parseAmount(amount),
          type: this.parseAmount(amount) >= 0 ? 'entrada' : 'saida'
        });
      }
    });

    return transactions;
  }

  extractCreditCardTransactions(content) {
    const transactions = [];
    const lines = content.split('\n');

    // Regex para transações de cartão
    const transactionRegex = /(\d{2}\/\d{2})\s+([^0-9\-\+]+)\s+([\d,.]+)/g;

    lines.forEach(line => {
      const match = transactionRegex.exec(line);
      if (match) {
        const [, date, description, amount] = match;
        transactions.push({
          date: this.parseDate(date),
          description: description.trim(),
          amount: -Math.abs(this.parseAmount(amount)), // Compras são negativas
          type: 'compra'
        });
      }
    });

    return transactions;
  }

  extractPayrollData(content) {
    const payrollData = {};
    const lines = content.split('\n');

    // Regex para dados do contracheque
    const salaryRegex = /salário\s*[:.]?\s*([\d,.]+)/i;
    const deductionsRegex = /desconto|inss|irrf|fgts/i;

    lines.forEach(line => {
      const salaryMatch = line.match(salaryRegex);
      if (salaryMatch) {
        payrollData.salarioBruto = this.parseAmount(salaryMatch[1]);
      }

      if (deductionsRegex.test(line)) {
        // Processar descontos
      }
    });

    return payrollData;
  }

  generateBankStatementSummary(transactions) {
    const totalEntradas = transactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSaidas = transactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      totalTransacoes: transactions.length,
      totalEntradas,
      totalSaidas,
      saldoLiquido: totalEntradas - totalSaidas,
      periodo: this.getTransactionPeriod(transactions)
    };
  }

  generateCreditCardSummary(transactions) {
    const totalCompras = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      totalTransacoes: transactions.length,
      totalCompras,
      periodo: this.getTransactionPeriod(transactions)
    };
  }

  getTransactionPeriod(transactions) {
    if (transactions.length === 0) return null;

    const dates = transactions.map(t => new Date(t.date)).sort();
    return {
      inicio: dates[0].toLocaleDateString('pt-BR'),
      fim: dates[dates.length - 1].toLocaleDateString('pt-BR')
    };
  }

  parseDate(dateStr) {
    // Converte datas em formato brasileiro para Date
    const parts = dateStr.split('/');
    if (parts.length === 2) {
      // Adiciona ano atual se não especificado
      parts.push(new Date().getFullYear().toString());
    }
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  parseAmount(amountStr) {
    // Converte valores monetários brasileiros para número
    return parseFloat(
      amountStr
        .replace(/[^\d,.-]/g, '')
        .replace('.', '')
        .replace(',', '.')
    );
  }

  async analyzeFiles(files) {
    const analyses = [];
    
    for (const file of files) {
      try {
        const analysis = await this.processFile(file);
        analyses.push(analysis);
      } catch (error) {
        analyses.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    return {
      totalFiles: files.length,
      analyses,
      summary: this.generateOverallSummary(analyses)
    };
  }

  generateOverallSummary(analyses) {
    const successful = analyses.filter(a => !a.error);
    const failed = analyses.filter(a => a.error);

    return {
      processedSuccessfully: successful.length,
      failed: failed.length,
      documentTypes: [...new Set(successful.map(a => a.analysis?.documentType).filter(Boolean))],
      totalTransactions: successful.reduce((sum, a) => sum + (a.analysis?.transactions?.length || 0), 0)
    };
  }
}