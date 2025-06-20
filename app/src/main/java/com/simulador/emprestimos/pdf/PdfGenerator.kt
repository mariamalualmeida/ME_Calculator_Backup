package com.simulador.emprestimos.pdf

import android.content.Context
import android.os.Environment
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.properties.TextAlignment
import java.io.File
import java.io.FileOutputStream
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

class PdfGenerator(private val context: Context) {
    
    private val currencyFormatter = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
    private val dateFormatter = SimpleDateFormat("dd/MM/yyyy", Locale("pt", "BR"))
    
    fun gerarRelatorioPdf(
        nomeUsuario: String,
        valorEmprestimo: Double,
        numeroParcelas: Int,
        taxaJuros: Double,
        valorParcela: Double
    ): File {
        
        val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        val fileName = "simulacao_emprestimo_${System.currentTimeMillis()}.pdf"
        val file = File(downloadsDir, fileName)
        
        val writer = PdfWriter(FileOutputStream(file))
        val pdfDocument = PdfDocument(writer)
        val document = Document(pdfDocument)
        
        // Cabeçalho
        document.add(
            Paragraph("ME EMPREENDIMENTOS")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(18f)
                .setBold()
        )
        
        document.add(
            Paragraph("Relatório de Simulação de Empréstimo")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(14f)
                .setMarginBottom(20f)
        )
        
        // Nome do usuário
        document.add(
            Paragraph("Cliente: $nomeUsuario")
                .setFontSize(12f)
                .setMarginBottom(10f)
        )
        
        // Dados do empréstimo
        document.add(
            Paragraph("Valor do Empréstimo: ${currencyFormatter.format(valorEmprestimo)}")
                .setFontSize(12f)
        )
        
        document.add(
            Paragraph("Número de Parcelas: $numeroParcelas")
                .setFontSize(12f)
        )
        
        document.add(
            Paragraph("Taxa de Juros: ${String.format("%.2f", taxaJuros).replace('.', ',')}%")
                .setFontSize(12f)
        )
        
        document.add(
            Paragraph("Valor da Parcela: ${currencyFormatter.format(valorParcela)}")
                .setFontSize(12f)
                .setMarginBottom(20f)
        )
        
        // Tabela de parcelas
        val table = Table(3)
        table.addHeaderCell("Nº Parcela")
        table.addHeaderCell("Data Vencimento")
        table.addHeaderCell("Valor")
        
        val calendar = Calendar.getInstance()
        calendar.add(Calendar.DAY_OF_MONTH, 30) // Primeira parcela 30 dias após simulação
        
        for (i in 1..numeroParcelas) {
            table.addCell(i.toString())
            table.addCell(dateFormatter.format(calendar.time))
            table.addCell(currencyFormatter.format(valorParcela))
            calendar.add(Calendar.MONTH, 1)
        }
        
        document.add(table)
        
        // Total
        val valorTotal = valorParcela * numeroParcelas
        document.add(
            Paragraph("Valor Total: ${currencyFormatter.format(valorTotal)}")
                .setFontSize(12f)
                .setBold()
                .setMarginTop(20f)
        )
        
        document.close()
        return file
    }
}