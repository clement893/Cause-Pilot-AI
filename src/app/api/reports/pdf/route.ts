import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// GET - Générer un rapport PDF
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "monthly";
    const year = searchParams.get("year") || new Date().getFullYear().toString();
    const month = searchParams.get("month") || (new Date().getMonth() + 1).toString();

    // Récupérer les données du rapport
    const baseUrl = request.nextUrl.origin;
    const reportUrl = `${baseUrl}/api/reports?type=${type}&year=${year}&month=${month}`;
    
    const reportResponse = await fetch(reportUrl);
    const reportData = await reportResponse.json();

    // Créer le PDF
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page 1: Résumé Exécutif
    const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page1.getSize();
    
    // Couleurs
    const primaryColor = rgb(0.12, 0.23, 0.54);
    const textColor = rgb(0.2, 0.2, 0.2);
    const grayColor = rgb(0.4, 0.4, 0.4);
    const greenColor = rgb(0.09, 0.64, 0.26);
    const redColor = rgb(0.86, 0.15, 0.15);

    let y = height - 50;

    // Header
    page1.drawRectangle({
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: primaryColor,
    });

    page1.drawText("Rapport pour le Conseil d'Administration", {
      x: 50,
      y: height - 50,
      size: 22,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    page1.drawText(reportData.metadata?.period || "Période", {
      x: 50,
      y: height - 75,
      size: 14,
      font: helveticaFont,
      color: rgb(0.8, 0.8, 0.9),
    });

    const generatedDate = new Date(reportData.metadata?.generatedAt || new Date()).toLocaleDateString("fr-CA");
    page1.drawText(`Généré le ${generatedDate}`, {
      x: width - 150,
      y: height - 75,
      size: 10,
      font: helveticaFont,
      color: rgb(0.8, 0.8, 0.9),
    });

    y = height - 140;

    // Section: Résumé Exécutif
    page1.drawText("Résumé Exécutif", {
      x: 50,
      y,
      size: 16,
      font: helveticaBold,
      color: primaryColor,
    });

    y -= 10;
    page1.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });

    y -= 30;

    // Métriques principales
    const metrics = [
      { label: "Total Collecté", value: formatCurrency(reportData.summary?.totalRaised || 0), change: reportData.yearOverYear?.growthRate },
      { label: "Nombre de Dons", value: String(reportData.summary?.totalDonations || 0), change: reportData.yearOverYear?.donorGrowthRate },
      { label: "Donateurs Actifs", value: String(reportData.summary?.totalDonors || 0), sub: `dont ${reportData.summary?.newDonors || 0} nouveaux` },
      { label: "Taux de Rétention", value: `${(reportData.summary?.retentionRate || 0).toFixed(1)}%`, sub: `Don moyen: ${formatCurrency(reportData.summary?.averageDonation || 0)}` },
    ];

    const cardWidth = (width - 100 - 30) / 4;
    metrics.forEach((metric, i) => {
      const x = 50 + i * (cardWidth + 10);
      
      page1.drawRectangle({
        x,
        y: y - 60,
        width: cardWidth,
        height: 70,
        color: rgb(0.97, 0.98, 0.99),
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1,
      });

      page1.drawText(metric.label, {
        x: x + 10,
        y: y - 15,
        size: 8,
        font: helveticaFont,
        color: grayColor,
      });

      page1.drawText(metric.value, {
        x: x + 10,
        y: y - 35,
        size: 14,
        font: helveticaBold,
        color: textColor,
      });

      if (metric.change !== undefined) {
        const changeText = `${metric.change >= 0 ? "+" : ""}${metric.change.toFixed(1)}% vs N-1`;
        page1.drawText(changeText, {
          x: x + 10,
          y: y - 52,
          size: 8,
          font: helveticaFont,
          color: metric.change >= 0 ? greenColor : redColor,
        });
      } else if (metric.sub) {
        page1.drawText(metric.sub, {
          x: x + 10,
          y: y - 52,
          size: 8,
          font: helveticaFont,
          color: grayColor,
        });
      }
    });

    y -= 100;

    // Points Saillants
    page1.drawText("Points Saillants", {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });

    y -= 20;

    const highlights = reportData.highlights || [];
    highlights.forEach((highlight: string) => {
      page1.drawRectangle({
        x: 50,
        y: y - 20,
        width: width - 100,
        height: 25,
        color: rgb(0.93, 0.96, 1),
      });

      page1.drawText(`• ${highlight}`, {
        x: 60,
        y: y - 12,
        size: 10,
        font: helveticaFont,
        color: rgb(0.12, 0.25, 0.69),
        maxWidth: width - 120,
      });

      y -= 30;
    });

    y -= 20;

    // Recommandations
    page1.drawText("Recommandations", {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });

    y -= 20;

    const recommendations = reportData.recommendations || [];
    recommendations.forEach((rec: string) => {
      page1.drawRectangle({
        x: 50,
        y: y - 20,
        width: width - 100,
        height: 25,
        color: rgb(1, 0.97, 0.88),
      });

      page1.drawText(`• ${rec}`, {
        x: 60,
        y: y - 12,
        size: 10,
        font: helveticaFont,
        color: rgb(0.57, 0.25, 0.05),
        maxWidth: width - 120,
      });

      y -= 30;
    });

    // Footer page 1
    page1.drawText("Rapport confidentiel - Usage interne uniquement", {
      x: 50,
      y: 30,
      size: 8,
      font: helveticaFont,
      color: grayColor,
    });

    page1.drawText("Page 1/2", {
      x: width - 80,
      y: 30,
      size: 8,
      font: helveticaFont,
      color: grayColor,
    });

    // Page 2: Détails
    const page2 = pdfDoc.addPage([595.28, 841.89]);
    y = height - 50;

    // Comparaison Année sur Année
    page2.drawText("Comparaison Année sur Année", {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });

    y -= 30;

    // Tableau de comparaison
    const tableHeaders = ["Métrique", String(reportData.metadata?.year || ""), String((reportData.metadata?.year || 0) - 1), "Variation"];
    const colWidths = [150, 100, 100, 100];
    let tableX = 50;

    page2.drawRectangle({
      x: 50,
      y: y - 20,
      width: 450,
      height: 25,
      color: rgb(0.95, 0.96, 0.98),
    });

    tableHeaders.forEach((header, i) => {
      page2.drawText(header, {
        x: tableX + 5,
        y: y - 12,
        size: 9,
        font: helveticaBold,
        color: grayColor,
      });
      tableX += colWidths[i];
    });

    y -= 25;

    // Lignes du tableau
    const tableRows = [
      {
        label: "Total Collecté",
        current: formatCurrency(reportData.yearOverYear?.currentPeriod?.totalAmount || 0),
        previous: formatCurrency(reportData.yearOverYear?.previousPeriod?.totalAmount || 0),
        change: reportData.yearOverYear?.growthRate || 0,
      },
      {
        label: "Nombre de Dons",
        current: String(reportData.yearOverYear?.currentPeriod?.donationCount || 0),
        previous: String(reportData.yearOverYear?.previousPeriod?.donationCount || 0),
        change: reportData.yearOverYear?.donorGrowthRate || 0,
      },
    ];

    tableRows.forEach((row) => {
      tableX = 50;
      
      page2.drawLine({
        start: { x: 50, y },
        end: { x: 500, y },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9),
      });

      page2.drawText(row.label, { x: tableX + 5, y: y - 15, size: 9, font: helveticaFont, color: textColor });
      tableX += colWidths[0];
      
      page2.drawText(row.current, { x: tableX + 5, y: y - 15, size: 9, font: helveticaBold, color: textColor });
      tableX += colWidths[1];
      
      page2.drawText(row.previous, { x: tableX + 5, y: y - 15, size: 9, font: helveticaFont, color: grayColor });
      tableX += colWidths[2];
      
      const changeText = `${row.change >= 0 ? "+" : ""}${row.change.toFixed(1)}%`;
      page2.drawText(changeText, { x: tableX + 5, y: y - 15, size: 9, font: helveticaBold, color: row.change >= 0 ? greenColor : redColor });

      y -= 25;
    });

    y -= 30;

    // Top Donateurs
    page2.drawText("Top 10 Donateurs", {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });

    y -= 25;

    const topDonors = reportData.topDonors || [];
    topDonors.slice(0, 10).forEach((donor: { name: string; totalAmount: number; donationCount: number }, i: number) => {
      page2.drawText(`${i + 1}. ${donor.name}`, {
        x: 50,
        y: y - 5,
        size: 10,
        font: helveticaFont,
        color: textColor,
      });
      
      page2.drawText(formatCurrency(donor.totalAmount), {
        x: 300,
        y: y - 5,
        size: 10,
        font: helveticaBold,
        color: textColor,
      });
      
      page2.drawText(`${donor.donationCount} don(s)`, {
        x: 400,
        y: y - 5,
        size: 9,
        font: helveticaFont,
        color: grayColor,
      });

      y -= 18;
    });

    y -= 30;

    // Santé de la Base Donateurs
    page2.drawText("Santé de la Base Donateurs", {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });

    y -= 25;

    const donorStats = [
      { label: "Donateurs actifs", value: String(reportData.donorMetrics?.totalDonors || 0) },
      { label: "Nouveaux donateurs", value: String(reportData.donorMetrics?.newDonors || 0) },
      { label: "Donateurs fidèles", value: String(reportData.donorMetrics?.returningDonors || 0) },
      { label: "Donateurs inactifs", value: String(reportData.donorMetrics?.lapsedDonors || 0) },
      { label: "Taux de rétention", value: `${(reportData.donorMetrics?.retentionRate || 0).toFixed(1)}%` },
      { label: "Valeur vie moyenne", value: formatCurrency(reportData.donorMetrics?.averageLifetimeValue || 0) },
    ];

    donorStats.forEach((stat) => {
      page2.drawText(stat.label, {
        x: 50,
        y: y - 5,
        size: 10,
        font: helveticaFont,
        color: grayColor,
      });
      
      page2.drawText(stat.value, {
        x: 250,
        y: y - 5,
        size: 10,
        font: helveticaBold,
        color: textColor,
      });

      y -= 18;
    });

    // Footer page 2
    page2.drawText("Rapport confidentiel - Usage interne uniquement", {
      x: 50,
      y: 30,
      size: 8,
      font: helveticaFont,
      color: grayColor,
    });

    page2.drawText("Page 2/2", {
      x: width - 80,
      y: 30,
      size: 8,
      font: helveticaFont,
      color: grayColor,
    });

    // Sauvegarder le PDF
    const pdfBytes = await pdfDoc.save();

    // Retourner le PDF en utilisant Buffer.from pour compatibilité
    const pdfBuffer = Buffer.from(pdfBytes);
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rapport-ca-${type}-${year}${type === "monthly" ? `-${month}` : ""}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur génération PDF rapport:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
