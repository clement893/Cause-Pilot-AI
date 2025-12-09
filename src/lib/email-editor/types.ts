// Types pour l'éditeur de templates email

export type BlockType = 
  | "text"
  | "heading"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "columns"
  | "social"
  | "footer";

export interface BlockStyle {
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  padding?: string;
  margin?: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  style?: BlockStyle;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  content: string;
  level: 1 | 2 | 3;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string;
  alt: string;
  width?: string;
  height?: string;
  link?: string;
}

export interface ButtonBlock extends BaseBlock {
  type: "button";
  text: string;
  link: string;
  buttonStyle?: {
    backgroundColor?: string;
    color?: string;
    borderRadius?: string;
    padding?: string;
  };
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
  lineStyle?: "solid" | "dashed" | "dotted";
  lineColor?: string;
  lineWidth?: string;
}

export interface SpacerBlock extends BaseBlock {
  type: "spacer";
  height: string;
}

export interface ColumnBlock {
  id: string;
  width: string; // "50%", "33.33%", etc.
  blocks: EmailBlock[];
}

export interface ColumnsBlock extends BaseBlock {
  type: "columns";
  columns: ColumnBlock[];
}

export interface SocialLink {
  platform: "facebook" | "twitter" | "instagram" | "linkedin" | "youtube";
  url: string;
}

export interface SocialBlock extends BaseBlock {
  type: "social";
  links: SocialLink[];
  iconSize?: string;
  iconStyle?: "color" | "outline" | "dark" | "light";
}

export interface FooterBlock extends BaseBlock {
  type: "footer";
  companyName?: string;
  address?: string;
  unsubscribeText?: string;
  unsubscribeLink?: string;
}

export type EmailBlock = 
  | TextBlock 
  | HeadingBlock 
  | ImageBlock 
  | ButtonBlock 
  | DividerBlock 
  | SpacerBlock 
  | ColumnsBlock 
  | SocialBlock 
  | FooterBlock;

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  blocks: EmailBlock[];
  globalStyle?: {
    backgroundColor?: string;
    fontFamily?: string;
    contentWidth?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Variables de personnalisation disponibles
export const PERSONALIZATION_VARIABLES = [
  { key: "{{firstName}}", label: "Prénom" },
  { key: "{{lastName}}", label: "Nom" },
  { key: "{{email}}", label: "Email" },
  { key: "{{donorId}}", label: "ID Donateur" },
  { key: "{{totalDonations}}", label: "Total des dons" },
  { key: "{{lastDonationDate}}", label: "Date dernier don" },
  { key: "{{lastDonationAmount}}", label: "Montant dernier don" },
  { key: "{{organizationName}}", label: "Nom de l'organisation" },
  { key: "{{currentDate}}", label: "Date actuelle" },
  { key: "{{unsubscribeLink}}", label: "Lien de désabonnement" },
];

// Blocs par défaut pour les nouveaux templates
export const DEFAULT_BLOCKS: Record<BlockType, Partial<EmailBlock>> = {
  text: {
    type: "text",
    content: "<p>Entrez votre texte ici...</p>",
    style: {
      padding: "10px 20px",
      fontSize: "16px",
      color: "#333333",
    },
  },
  heading: {
    type: "heading",
    content: "Titre de section",
    level: 2,
    style: {
      padding: "10px 20px",
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1a1a1a",
    },
  },
  image: {
    type: "image",
    src: "",
    alt: "Image",
    width: "100%",
    style: {
      padding: "10px 20px",
    },
  },
  button: {
    type: "button",
    text: "Cliquez ici",
    link: "#",
    buttonStyle: {
      backgroundColor: "#6366f1",
      color: "#ffffff",
      borderRadius: "6px",
      padding: "12px 24px",
    },
    style: {
      padding: "10px 20px",
      textAlign: "center",
    },
  },
  divider: {
    type: "divider",
    lineStyle: "solid",
    lineColor: "#e5e7eb",
    lineWidth: "1px",
    style: {
      padding: "10px 20px",
    },
  },
  spacer: {
    type: "spacer",
    height: "20px",
  },
  columns: {
    type: "columns",
    columns: [
      { id: "col-1", width: "50%", blocks: [] },
      { id: "col-2", width: "50%", blocks: [] },
    ],
    style: {
      padding: "10px 20px",
    },
  },
  social: {
    type: "social",
    links: [
      { platform: "facebook", url: "#" },
      { platform: "twitter", url: "#" },
      { platform: "instagram", url: "#" },
    ],
    iconSize: "32px",
    iconStyle: "color",
    style: {
      padding: "10px 20px",
      textAlign: "center",
    },
  },
  footer: {
    type: "footer",
    companyName: "Votre Organisation",
    address: "123 Rue Principale, Ville, Province, Code Postal",
    unsubscribeText: "Se désabonner",
    unsubscribeLink: "{{unsubscribeLink}}",
    style: {
      padding: "20px",
      backgroundColor: "#f3f4f6",
      fontSize: "12px",
      color: "#6b7280",
      textAlign: "center",
    },
  },
};
