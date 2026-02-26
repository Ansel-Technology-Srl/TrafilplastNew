using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using RecinzioniPortal.API.Models;

namespace RecinzioniPortal.API.Services;

public class PdfService
{
    /// <summary>
    /// Genera il PDF di un preventivo/ordine secondo il layout AF §6.4
    /// </summary>
    public byte[] GeneraPdf(
        OrdineTestata ordine,
        List<OrdineConfig> configList,
        PuntoDiVendita? pdv,
        string? logoPath)
    {
        var isOrdine = ordine.FlagConferma;
        var titoloDoc = isOrdine ? "ORDINE CONFERMATO" : "PREVENTIVO";

        // Organizza righe padre-figli
        var righe = ordine.Righe?.OrderBy(r => r.RigaNum).ToList() ?? new();
        var righePadre = righe.Where(r => r.RigaPadre == null).ToList();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginTop(1.5f, Unit.Centimetre);
                page.MarginBottom(1.5f, Unit.Centimetre);
                page.MarginLeft(2, Unit.Centimetre);
                page.MarginRight(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial"));

                // ── Header ──────────────────────────────────────
                page.Header().Column(col =>
                {
                    // Logo + Intestazione PdV
                    col.Item().Row(row =>
                    {
                        // Logo a sinistra
                        row.ConstantItem(120).Height(60).AlignMiddle().Element(container =>
                        {
                            if (!string.IsNullOrEmpty(logoPath) && File.Exists(logoPath))
                                container.Image(logoPath).FitArea();
                            else
                                container.Text(""); // spazio vuoto se no logo
                        });

                        row.RelativeItem().PaddingLeft(10).AlignRight().Column(c =>
                        {
                            if (pdv != null)
                            {
                                c.Item().Text(pdv.ItemDes ?? "").Bold().FontSize(11);
                                c.Item().Text(pdv.Ind ?? "").FontSize(8);
                                var capCitta = $"{pdv.Cap ?? ""} {pdv.Loc ?? ""} ({pdv.Pro ?? ""})".Trim();
                                if (!string.IsNullOrWhiteSpace(capCitta))
                                    c.Item().Text(capCitta).FontSize(8);
                                var contatti = new List<string>();
                                if (!string.IsNullOrEmpty(pdv.Tel)) contatti.Add($"Tel: {pdv.Tel}");
                                if (!string.IsNullOrEmpty(pdv.Mail)) contatti.Add(pdv.Mail);
                                if (contatti.Any())
                                    c.Item().Text(string.Join(" | ", contatti)).FontSize(8);
                            }
                        });
                    });

                    col.Item().PaddingTop(8).LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);

                    // Titolo documento
                    col.Item().PaddingTop(6).PaddingBottom(6)
                        .Background(Colors.Grey.Lighten3)
                        .Padding(8)
                        .Row(row =>
                        {
                            row.RelativeItem().Text(text =>
                            {
                                text.Span($"{titoloDoc} N. {ordine.OrdNum}").Bold().FontSize(13);
                                text.Span($" / {ordine.OrdData:dd-MM-yyyy}").FontSize(11);
                            });
                            row.ConstantItem(150).AlignRight().Text(text =>
                            {
                                text.Span("Stato: ").FontSize(9);
                                text.Span(titoloDoc).Bold().FontSize(9)
                                    .FontColor(isOrdine ? Colors.Green.Darken2 : Colors.Blue.Darken2);
                            });
                        });

                    // Dati fatturazione e consegna
                    col.Item().PaddingTop(6).Row(row =>
                    {
                        // Fatturazione
                        row.RelativeItem().Border(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(6).Column(c =>
                        {
                            c.Item().Text("DATI FATTURAZIONE").Bold().FontSize(8).FontColor(Colors.Grey.Darken2);
                            c.Item().PaddingTop(3).Text(ordine.FattRagSoc ?? "").Bold().FontSize(9);
                            c.Item().Text(ordine.FattIndirizzo ?? "").FontSize(8);
                            c.Item().Text($"{ordine.FattCap ?? ""} {ordine.FattCitta ?? ""} ({ordine.FattProvincia ?? ""})").FontSize(8);
                            if (!string.IsNullOrEmpty(ordine.FattPIva))
                                c.Item().Text($"P.IVA: {ordine.FattPIva}").FontSize(8);
                            if (!string.IsNullOrEmpty(ordine.FattCFis))
                                c.Item().Text($"C.F.: {ordine.FattCFis}").FontSize(8);
                        });

                        row.ConstantItem(8); // spacer

                        // Consegna
                        row.RelativeItem().Border(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(6).Column(c =>
                        {
                            c.Item().Text("DATI CONSEGNA").Bold().FontSize(8).FontColor(Colors.Grey.Darken2);
                            c.Item().PaddingTop(3).Text(ordine.ConsRagSoc ?? "").Bold().FontSize(9);
                            c.Item().Text(ordine.ConsIndirizzo ?? "").FontSize(8);
                            c.Item().Text($"{ordine.ConsCap ?? ""} {ordine.ConsCitta ?? ""} ({ordine.ConsProvincia ?? ""})").FontSize(8);
                        });
                    });

                    col.Item().PaddingTop(8);
                });

                // ── Content: tabella righe ──────────────────────
                page.Content().Column(col =>
                {
                    col.Item().Table(table =>
                    {
                        // Definizione colonne
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(30);   // N.
                            columns.ConstantColumn(70);   // Codice
                            columns.RelativeColumn(3);    // Descrizione
                            columns.ConstantColumn(30);   // UM
                            columns.ConstantColumn(35);   // Qtà
                            columns.ConstantColumn(60);   // P.U.
                            columns.ConstantColumn(65);   // Totale
                        });

                        // Header tabella
                        table.Header(header =>
                        {
                            var headerStyle = TextStyle.Default.FontSize(8).Bold().FontColor(Colors.White);

                            header.Cell().Background(Colors.Grey.Darken2).Padding(4)
                                .Text("N.").Style(headerStyle);
                            header.Cell().Background(Colors.Grey.Darken2).Padding(4)
                                .Text("Codice").Style(headerStyle);
                            header.Cell().Background(Colors.Grey.Darken2).Padding(4)
                                .Text("Descrizione").Style(headerStyle);
                            header.Cell().Background(Colors.Grey.Darken2).Padding(4)
                                .Text("UM").Style(headerStyle);
                            header.Cell().Background(Colors.Grey.Darken2).Padding(4).AlignRight()
                                .Text("Qtà").Style(headerStyle);
                            header.Cell().Background(Colors.Grey.Darken2).Padding(4).AlignRight()
                                .Text("P.U.").Style(headerStyle);
                            header.Cell().Background(Colors.Grey.Darken2).Padding(4).AlignRight()
                                .Text("Totale").Style(headerStyle);
                        });

                        // Righe dati
                        int numVisuale = 0;
                        foreach (var padre in righePadre)
                        {
                            numVisuale++;
                            var figli = righe.Where(r => r.RigaPadre == padre.RigaNum).ToList();
                            var isConfigured = figli.Any();
                            var bgColor = numVisuale % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;

                            // Riga padre
                            var padreStyle = TextStyle.Default.FontSize(9);
                            if (isConfigured) padreStyle = padreStyle.Bold();

                            table.Cell().Background(bgColor).Padding(3)
                                .Text(numVisuale.ToString()).Style(padreStyle);
                            table.Cell().Background(bgColor).Padding(3)
                                .Text(padre.PrdCod ?? "").Style(padreStyle);
                            table.Cell().Background(bgColor).Padding(3)
                                .Text(padre.PrdDes ?? "").Style(padreStyle);
                            table.Cell().Background(bgColor).Padding(3)
                                .Text(padre.PrdUm ?? "").Style(padreStyle);
                            table.Cell().Background(bgColor).Padding(3).AlignRight()
                                .Text(padre.Quantita?.ToString("N0") ?? "").Style(padreStyle);
                            table.Cell().Background(bgColor).Padding(3).AlignRight()
                                .Text(isConfigured ? "" : FormatEuro(padre.PrezzoUnitario)).Style(padreStyle);
                            table.Cell().Background(bgColor).Padding(3).AlignRight()
                                .Text(FormatEuro(padre.PrezzoTotale)).Style(padreStyle);

                            // Righe figlie (componenti)
                            foreach (var figlio in figli)
                            {
                                var figlioStyle = TextStyle.Default.FontSize(8).FontColor(Colors.Grey.Darken1);

                                table.Cell().Background(Colors.Blue.Lighten5).Padding(3).Text(""); // N. vuoto
                                table.Cell().Background(Colors.Blue.Lighten5).Padding(3)
                                    .Text(figlio.PrdCod ?? "").Style(figlioStyle);
                                table.Cell().Background(Colors.Blue.Lighten5).Padding(3)
                                    .Text($"  └ {figlio.PrdDes ?? ""}").Style(figlioStyle);
                                table.Cell().Background(Colors.Blue.Lighten5).Padding(3)
                                    .Text(figlio.PrdUm ?? "").Style(figlioStyle);
                                table.Cell().Background(Colors.Blue.Lighten5).Padding(3).AlignRight()
                                    .Text(figlio.Quantita?.ToString("N0") ?? "").Style(figlioStyle);
                                table.Cell().Background(Colors.Blue.Lighten5).Padding(3).AlignRight()
                                    .Text(FormatEuro(figlio.PrezzoUnitario)).Style(figlioStyle);
                                table.Cell().Background(Colors.Blue.Lighten5).Padding(3).AlignRight()
                                    .Text(FormatEuro(figlio.PrezzoTotale)).Style(figlioStyle);
                            }
                        }
                    });

                    // Note + Pagamento + Totali
                    col.Item().PaddingTop(10).Row(row =>
                    {
                        // Colonna sinistra: note e pagamento
                        row.RelativeItem().Column(c =>
                        {
                            if (!string.IsNullOrEmpty(ordine.Note))
                            {
                                c.Item().Text("Note:").Bold().FontSize(8);
                                c.Item().Text(ordine.Note).FontSize(8);
                            }
                            if (!string.IsNullOrEmpty(ordine.PagDescrizione))
                            {
                                c.Item().PaddingTop(4).Text("Pagamento:").Bold().FontSize(8);
                                c.Item().Text($"{ordine.PagCod} - {ordine.PagDescrizione}").FontSize(8);
                            }
                        });

                        // Colonna destra: totali
                        row.ConstantItem(180).Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(6).Column(c =>
                        {
                            c.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Subtotale:").FontSize(9);
                                r.ConstantItem(80).AlignRight().Text(FormatEuro(ordine.Subtotale)).FontSize(9);
                            });
                            c.Item().PaddingTop(2).Row(r =>
                            {
                                r.RelativeItem().Text($"IVA ({ordine.AliquotaIVA:N0}%):").FontSize(9);
                                r.ConstantItem(80).AlignRight().Text(FormatEuro(ordine.ImportoIVA)).FontSize(9);
                            });
                            c.Item().PaddingTop(4).LineHorizontal(0.5f);
                            c.Item().PaddingTop(4).Row(r =>
                            {
                                r.RelativeItem().Text("TOTALE:").Bold().FontSize(11);
                                r.ConstantItem(80).AlignRight().Text(FormatEuro(ordine.Totale)).Bold().FontSize(11);
                            });
                        });
                    });
                });

                // ── Footer ──────────────────────────────────────
                page.Footer().Row(row =>
                {
                    row.RelativeItem().AlignLeft().Text(text =>
                    {
                        text.Span($"N. {ordine.OrdNum}").FontSize(7);
                        text.Span($" | {ordine.OrdData:dd/MM/yyyy}").FontSize(7);
                    });
                    row.RelativeItem().AlignRight().Text(text =>
                    {
                        text.Span("Pagina ").FontSize(7);
                        text.CurrentPageNumber().FontSize(7);
                        text.Span(" di ").FontSize(7);
                        text.TotalPages().FontSize(7);
                    });
                });
            });
        });

        using var ms = new MemoryStream();
        document.GeneratePdf(ms);
        return ms.ToArray();
    }

    private static string FormatEuro(decimal? value)
    {
        if (!value.HasValue) return "";
        return $"€ {value.Value:N2}";
    }
}
