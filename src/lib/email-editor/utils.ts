import { v4 as uuidv4 } from "uuid";
import { 
  EmailBlock, 
  EmailTemplate, 
  BlockType, 
  DEFAULT_BLOCKS,
  TextBlock,
  HeadingBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  ColumnsBlock,
  SocialBlock,
  FooterBlock,
} from "./types";

// Créer un nouveau bloc avec un ID unique
export function createBlock(type: BlockType): EmailBlock {
  const defaultBlock = DEFAULT_BLOCKS[type];
  return {
    ...defaultBlock,
    id: uuidv4(),
    type,
  } as EmailBlock;
}

// Convertir les blocs en HTML compatible email
export function blocksToHtml(blocks: EmailBlock[], globalStyle?: EmailTemplate["globalStyle"]): string {
  const contentWidth = globalStyle?.contentWidth || "600px";
  const backgroundColor = globalStyle?.backgroundColor || "#ffffff";
  const fontFamily = globalStyle?.fontFamily || "Arial, sans-serif";

  const blocksHtml = blocks.map(block => blockToHtml(block)).join("\n");

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; font-family: ${fontFamily}; }
    table { border-collapse: collapse; }
    img { max-width: 100%; height: auto; display: block; }
    a { color: #6366f1; text-decoration: none; }
    .button { display: inline-block; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="${contentWidth}" cellpadding="0" cellspacing="0" style="background-color: ${backgroundColor}; max-width: 100%;">
          ${blocksHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function blockToHtml(block: EmailBlock): string {
  const style = block.style || {};
  const padding = style.padding || "0";
  const backgroundColor = style.backgroundColor || "transparent";
  const textAlign = style.textAlign || "left";

  switch (block.type) {
    case "text":
      return textBlockToHtml(block as TextBlock, padding, backgroundColor, textAlign);
    case "heading":
      return headingBlockToHtml(block as HeadingBlock, padding, backgroundColor, textAlign);
    case "image":
      return imageBlockToHtml(block as ImageBlock, padding, backgroundColor, textAlign);
    case "button":
      return buttonBlockToHtml(block as ButtonBlock, padding, backgroundColor, textAlign);
    case "divider":
      return dividerBlockToHtml(block as DividerBlock, padding, backgroundColor);
    case "spacer":
      return spacerBlockToHtml(block as SpacerBlock);
    case "columns":
      return columnsBlockToHtml(block as ColumnsBlock, padding, backgroundColor);
    case "social":
      return socialBlockToHtml(block as SocialBlock, padding, backgroundColor, textAlign);
    case "footer":
      return footerBlockToHtml(block as FooterBlock, padding, backgroundColor, textAlign);
    default:
      return "";
  }
}

function textBlockToHtml(block: TextBlock, padding: string, backgroundColor: string, textAlign: string): string {
  const fontSize = block.style?.fontSize || "16px";
  const color = block.style?.color || "#333333";
  
  return `
    <tr>
      <td style="padding: ${padding}; background-color: ${backgroundColor}; text-align: ${textAlign}; font-size: ${fontSize}; color: ${color}; line-height: 1.6;">
        ${block.content}
      </td>
    </tr>
  `;
}

function headingBlockToHtml(block: HeadingBlock, padding: string, backgroundColor: string, textAlign: string): string {
  const fontSize = block.level === 1 ? "32px" : block.level === 2 ? "24px" : "20px";
  const color = block.style?.color || "#1a1a1a";
  const tag = `h${block.level}`;
  
  return `
    <tr>
      <td style="padding: ${padding}; background-color: ${backgroundColor}; text-align: ${textAlign};">
        <${tag} style="margin: 0; font-size: ${fontSize}; color: ${color}; font-weight: bold;">${block.content}</${tag}>
      </td>
    </tr>
  `;
}

function imageBlockToHtml(block: ImageBlock, padding: string, backgroundColor: string, textAlign: string): string {
  const width = block.width || "100%";
  const imgHtml = `<img src="${block.src}" alt="${block.alt}" width="${width}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">`;
  const content = block.link ? `<a href="${block.link}">${imgHtml}</a>` : imgHtml;
  
  return `
    <tr>
      <td style="padding: ${padding}; background-color: ${backgroundColor}; text-align: ${textAlign};">
        ${content}
      </td>
    </tr>
  `;
}

function buttonBlockToHtml(block: ButtonBlock, padding: string, backgroundColor: string, textAlign: string): string {
  const btnStyle = block.buttonStyle || {};
  const btnBg = btnStyle.backgroundColor || "#6366f1";
  const btnColor = btnStyle.color || "#ffffff";
  const btnRadius = btnStyle.borderRadius || "6px";
  const btnPadding = btnStyle.padding || "12px 24px";
  
  return `
    <tr>
      <td style="padding: ${padding}; background-color: ${backgroundColor}; text-align: ${textAlign};">
        <a href="${block.link}" class="button" style="display: inline-block; background-color: ${btnBg}; color: ${btnColor}; padding: ${btnPadding}; border-radius: ${btnRadius}; text-decoration: none; font-weight: bold;">
          ${block.text}
        </a>
      </td>
    </tr>
  `;
}

function dividerBlockToHtml(block: DividerBlock, padding: string, backgroundColor: string): string {
  const lineStyle = block.lineStyle || "solid";
  const lineColor = block.lineColor || "#e5e7eb";
  const lineWidth = block.lineWidth || "1px";
  
  return `
    <tr>
      <td style="padding: ${padding}; background-color: ${backgroundColor};">
        <hr style="border: none; border-top: ${lineWidth} ${lineStyle} ${lineColor}; margin: 0;">
      </td>
    </tr>
  `;
}

function spacerBlockToHtml(block: SpacerBlock): string {
  return `
    <tr>
      <td style="height: ${block.height}; font-size: 0; line-height: 0;">&nbsp;</td>
    </tr>
  `;
}

function columnsBlockToHtml(block: ColumnsBlock, padding: string, backgroundColor: string): string {
  const columnsHtml = block.columns.map(col => {
    const colBlocksHtml = col.blocks.map(b => blockToHtml(b)).join("");
    return `
      <td width="${col.width}" valign="top" style="vertical-align: top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${colBlocksHtml || '<tr><td style="padding: 10px;">&nbsp;</td></tr>'}
        </table>
      </td>
    `;
  }).join("");
  
  return `
    <tr>
      <td style="padding: ${padding}; background-color: ${backgroundColor};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${columnsHtml}
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function socialBlockToHtml(block: SocialBlock, padding: string, backgroundColor: string, textAlign: string): string {
  const iconSize = block.iconSize || "32px";
  
  const socialIcons: Record<string, string> = {
    facebook: "https://cdn-icons-png.flaticon.com/512/733/733547.png",
    twitter: "https://cdn-icons-png.flaticon.com/512/733/733579.png",
    instagram: "https://cdn-icons-png.flaticon.com/512/733/733558.png",
    linkedin: "https://cdn-icons-png.flaticon.com/512/733/733561.png",
    youtube: "https://cdn-icons-png.flaticon.com/512/733/733646.png",
  };
  
  const linksHtml = block.links.map(link => `
    <a href="${link.url}" style="display: inline-block; margin: 0 8px;">
      <img src="${socialIcons[link.platform]}" alt="${link.platform}" width="${iconSize}" height="${iconSize}" style="display: block;">
    </a>
  `).join("");
  
  return `
    <tr>
      <td style="padding: ${padding}; background-color: ${backgroundColor}; text-align: ${textAlign};">
        ${linksHtml}
      </td>
    </tr>
  `;
}

function footerBlockToHtml(block: FooterBlock, padding: string, backgroundColor: string, textAlign: string): string {
  const fontSize = block.style?.fontSize || "12px";
  const color = block.style?.color || "#6b7280";
  
  return `
    <tr>
      <td style="padding: ${padding}; background-color: ${backgroundColor}; text-align: ${textAlign}; font-size: ${fontSize}; color: ${color};">
        ${block.companyName ? `<p style="margin: 0 0 8px 0; font-weight: bold;">${block.companyName}</p>` : ""}
        ${block.address ? `<p style="margin: 0 0 8px 0;">${block.address}</p>` : ""}
        ${block.unsubscribeLink ? `<p style="margin: 0;"><a href="${block.unsubscribeLink}" style="color: ${color}; text-decoration: underline;">${block.unsubscribeText || "Se désabonner"}</a></p>` : ""}
      </td>
    </tr>
  `;
}

// Convertir HTML en texte brut pour la version texte de l'email
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Templates prédéfinis
export const STARTER_TEMPLATES: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Newsletter Simple",
    description: "Un template simple pour vos newsletters",
    category: "newsletter",
    blocks: [
      {
        id: "header-1",
        type: "heading",
        content: "Votre Newsletter",
        level: 1,
        style: { padding: "30px 20px 10px", textAlign: "center", color: "#1a1a1a" },
      },
      {
        id: "divider-1",
        type: "divider",
        lineStyle: "solid",
        lineColor: "#e5e7eb",
        lineWidth: "1px",
        style: { padding: "10px 40px" },
      },
      {
        id: "text-1",
        type: "text",
        content: "<p>Bonjour {{firstName}},</p><p>Voici les dernières nouvelles de notre organisation...</p>",
        style: { padding: "20px", fontSize: "16px", color: "#333333" },
      },
      {
        id: "button-1",
        type: "button",
        text: "En savoir plus",
        link: "#",
        buttonStyle: { backgroundColor: "#6366f1", color: "#ffffff", borderRadius: "6px", padding: "12px 24px" },
        style: { padding: "20px", textAlign: "center" },
      },
      {
        id: "spacer-1",
        type: "spacer",
        height: "20px",
      },
      {
        id: "footer-1",
        type: "footer",
        companyName: "Votre Organisation",
        address: "123 Rue Principale, Ville",
        unsubscribeText: "Se désabonner",
        unsubscribeLink: "{{unsubscribeLink}}",
        style: { padding: "20px", backgroundColor: "#f3f4f6", fontSize: "12px", color: "#6b7280", textAlign: "center" },
      },
    ] as EmailBlock[],
    globalStyle: { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif", contentWidth: "600px" },
  },
  {
    name: "Appel aux dons",
    description: "Template pour vos campagnes de collecte de fonds",
    category: "fundraising",
    blocks: [
      {
        id: "image-1",
        type: "image",
        src: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&h=300&fit=crop",
        alt: "Campagne de dons",
        width: "100%",
        style: { padding: "0" },
      },
      {
        id: "heading-1",
        type: "heading",
        content: "Votre soutien fait la différence",
        level: 1,
        style: { padding: "30px 20px 10px", textAlign: "center", color: "#1a1a1a" },
      },
      {
        id: "text-1",
        type: "text",
        content: "<p>Cher(e) {{firstName}},</p><p>Grâce à votre générosité, nous avons pu accomplir de grandes choses cette année. Mais notre mission continue et nous avons besoin de votre aide.</p>",
        style: { padding: "20px", fontSize: "16px", color: "#333333" },
      },
      {
        id: "button-1",
        type: "button",
        text: "Faire un don maintenant",
        link: "#",
        buttonStyle: { backgroundColor: "#dc2626", color: "#ffffff", borderRadius: "6px", padding: "16px 32px" },
        style: { padding: "20px", textAlign: "center" },
      },
      {
        id: "text-2",
        type: "text",
        content: "<p style='text-align: center; font-size: 14px; color: #6b7280;'>Chaque don compte, peu importe le montant.</p>",
        style: { padding: "10px 20px" },
      },
      {
        id: "footer-1",
        type: "footer",
        companyName: "Votre Organisation",
        address: "123 Rue Principale, Ville",
        unsubscribeText: "Se désabonner",
        unsubscribeLink: "{{unsubscribeLink}}",
        style: { padding: "20px", backgroundColor: "#f3f4f6", fontSize: "12px", color: "#6b7280", textAlign: "center" },
      },
    ] as EmailBlock[],
    globalStyle: { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif", contentWidth: "600px" },
  },
  {
    name: "Remerciement don",
    description: "Template pour remercier vos donateurs",
    category: "thank-you",
    blocks: [
      {
        id: "heading-1",
        type: "heading",
        content: "Merci pour votre don ! 🙏",
        level: 1,
        style: { padding: "30px 20px 10px", textAlign: "center", color: "#1a1a1a" },
      },
      {
        id: "text-1",
        type: "text",
        content: "<p>Cher(e) {{firstName}},</p><p>Nous tenons à vous remercier sincèrement pour votre généreux don de <strong>{{lastDonationAmount}}</strong>.</p><p>Votre soutien nous permet de continuer notre mission et de faire une réelle différence dans la vie de ceux que nous aidons.</p>",
        style: { padding: "20px", fontSize: "16px", color: "#333333" },
      },
      {
        id: "divider-1",
        type: "divider",
        lineStyle: "solid",
        lineColor: "#e5e7eb",
        lineWidth: "1px",
        style: { padding: "10px 40px" },
      },
      {
        id: "text-2",
        type: "text",
        content: "<p style='text-align: center;'>Votre reçu fiscal vous sera envoyé par courrier.</p>",
        style: { padding: "20px", fontSize: "14px", color: "#6b7280" },
      },
      {
        id: "social-1",
        type: "social",
        links: [
          { platform: "facebook", url: "#" },
          { platform: "twitter", url: "#" },
          { platform: "instagram", url: "#" },
        ],
        iconSize: "32px",
        iconStyle: "color",
        style: { padding: "20px", textAlign: "center" },
      },
      {
        id: "footer-1",
        type: "footer",
        companyName: "Votre Organisation",
        address: "123 Rue Principale, Ville",
        unsubscribeText: "Se désabonner",
        unsubscribeLink: "{{unsubscribeLink}}",
        style: { padding: "20px", backgroundColor: "#f3f4f6", fontSize: "12px", color: "#6b7280", textAlign: "center" },
      },
    ] as EmailBlock[],
    globalStyle: { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif", contentWidth: "600px" },
  },
];
