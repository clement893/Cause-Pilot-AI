import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Register fonts (optional - uses default if not available)
// Font.register({
//   family: "Inter",
//   src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
// });

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#6366f1",
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: "contain",
  },
  orgInfo: {
    textAlign: "right",
  },
  orgName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  orgDetails: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 30,
  },
  receiptNumber: {
    fontSize: 10,
    textAlign: "center",
    color: "#9333ea",
    marginBottom: 20,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    color: "#6b7280",
    fontSize: 10,
  },
  value: {
    color: "#1f2937",
    fontWeight: "bold",
    fontSize: 10,
  },
  amountBox: {
    backgroundColor: "#f3f4f6",
    padding: 20,
    borderRadius: 8,
    marginVertical: 20,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#059669",
  },
  amountCurrency: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  taxInfo: {
    backgroundColor: "#fef3c7",
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
  },
  taxInfoText: {
    fontSize: 9,
    color: "#92400e",
    textAlign: "center",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 1.5,
  },
  signature: {
    marginTop: 30,
    alignItems: "flex-end",
  },
  signatureLine: {
    width: 200,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
});

export interface ReceiptData {
  // Receipt info
  receiptNumber: string;
  issueDate: Date;
  
  // Donor info
  donorName: string;
  donorEmail: string;
  donorAddress?: string;
  donorCity?: string;
  donorPostalCode?: string;
  donorCountry?: string;
  
  // Donation info
  amount: number;
  currency: string;
  donationDate: Date;
  paymentMethod: string;
  transactionId?: string;
  campaignName?: string;
  
  // Organization info
  orgName: string;
  orgAddress?: string;
  orgCity?: string;
  orgPostalCode?: string;
  orgCountry?: string;
  orgPhone?: string;
  orgEmail?: string;
  orgWebsite?: string;
  orgCharityNumber?: string;
  orgLogoUrl?: string;
  
  // Tax info
  taxYear: number;
  isEligibleForTaxReceipt: boolean;
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export const TaxReceiptDocument: React.FC<{ data: ReceiptData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {data.orgLogoUrl ? (
            <Image src={data.orgLogoUrl} style={styles.logo} />
          ) : (
            <Text style={styles.orgName}>{data.orgName}</Text>
          )}
        </View>
        <View style={styles.orgInfo}>
          <Text style={styles.orgName}>{data.orgName}</Text>
          <Text style={styles.orgDetails}>
            {data.orgAddress && `${data.orgAddress}\n`}
            {data.orgCity && data.orgPostalCode && `${data.orgCity}, ${data.orgPostalCode}\n`}
            {data.orgPhone && `Tél: ${data.orgPhone}\n`}
            {data.orgEmail && `${data.orgEmail}\n`}
            {data.orgCharityNumber && `N° d'organisme: ${data.orgCharityNumber}`}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Reçu Officiel de Don</Text>
      <Text style={styles.subtitle}>
        Pour fins d&apos;impôt sur le revenu - Année fiscale {data.taxYear}
      </Text>
      <Text style={styles.receiptNumber}>
        Reçu N° {data.receiptNumber}
      </Text>

      {/* Donor Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations du Donateur</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nom complet</Text>
          <Text style={styles.value}>{data.donorName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Courriel</Text>
          <Text style={styles.value}>{data.donorEmail}</Text>
        </View>
        {data.donorAddress && (
          <View style={styles.row}>
            <Text style={styles.label}>Adresse</Text>
            <Text style={styles.value}>
              {data.donorAddress}
              {data.donorCity && `, ${data.donorCity}`}
              {data.donorPostalCode && ` ${data.donorPostalCode}`}
            </Text>
          </View>
        )}
      </View>

      {/* Donation Amount */}
      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>Montant du don admissible</Text>
        <Text style={styles.amountValue}>
          {formatCurrency(data.amount, data.currency)}
        </Text>
        <Text style={styles.amountCurrency}>
          Dollars canadiens ({data.currency})
        </Text>
      </View>

      {/* Donation Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détails du Don</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Date du don</Text>
          <Text style={styles.value}>{formatDate(data.donationDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date d&apos;émission du reçu</Text>
          <Text style={styles.value}>{formatDate(data.issueDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Mode de paiement</Text>
          <Text style={styles.value}>{data.paymentMethod}</Text>
        </View>
        {data.transactionId && (
          <View style={styles.row}>
            <Text style={styles.label}>N° de transaction</Text>
            <Text style={styles.value}>{data.transactionId}</Text>
          </View>
        )}
        {data.campaignName && (
          <View style={styles.row}>
            <Text style={styles.label}>Campagne</Text>
            <Text style={styles.value}>{data.campaignName}</Text>
          </View>
        )}
      </View>

      {/* Tax Information */}
      {data.isEligibleForTaxReceipt && (
        <View style={styles.taxInfo}>
          <Text style={styles.taxInfoText}>
            Ce reçu officiel de don est émis conformément aux exigences de l&apos;Agence du revenu du Canada.
            {"\n"}
            Conservez ce reçu pour vos dossiers fiscaux. Aucun bien ou service n&apos;a été fourni en échange de ce don.
          </Text>
        </View>
      )}

      {/* Signature */}
      <View style={styles.signature}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>
          Signature autorisée - {data.orgName}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {data.orgName} • {data.orgCharityNumber && `N° d'enregistrement: ${data.orgCharityNumber} • `}
          {data.orgWebsite || ""}
          {"\n"}
          Ce document est un reçu officiel aux fins de l&apos;impôt sur le revenu.
        </Text>
      </View>
    </Page>
  </Document>
);

export default TaxReceiptDocument;
