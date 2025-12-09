"use client";

import { EmailBlock, TextBlock, HeadingBlock, ImageBlock, ButtonBlock, DividerBlock, SpacerBlock, SocialBlock, FooterBlock, ColumnsBlock } from "@/lib/email-editor/types";

interface BlockItemProps {
  block: EmailBlock;
}

export function BlockItem({ block }: BlockItemProps) {
  const style = block.style || {};
  const padding = style.padding || "10px 20px";
  const backgroundColor = style.backgroundColor || "transparent";
  const textAlign = style.textAlign || "left";

  switch (block.type) {
    case "text":
      return <TextBlockPreview block={block as TextBlock} padding={padding} backgroundColor={backgroundColor} textAlign={textAlign} />;
    case "heading":
      return <HeadingBlockPreview block={block as HeadingBlock} padding={padding} backgroundColor={backgroundColor} textAlign={textAlign} />;
    case "image":
      return <ImageBlockPreview block={block as ImageBlock} padding={padding} backgroundColor={backgroundColor} textAlign={textAlign} />;
    case "button":
      return <ButtonBlockPreview block={block as ButtonBlock} padding={padding} backgroundColor={backgroundColor} textAlign={textAlign} />;
    case "divider":
      return <DividerBlockPreview block={block as DividerBlock} padding={padding} backgroundColor={backgroundColor} />;
    case "spacer":
      return <SpacerBlockPreview block={block as SpacerBlock} />;
    case "columns":
      return <ColumnsBlockPreview block={block as ColumnsBlock} padding={padding} backgroundColor={backgroundColor} />;
    case "social":
      return <SocialBlockPreview block={block as SocialBlock} padding={padding} backgroundColor={backgroundColor} textAlign={textAlign} />;
    case "footer":
      return <FooterBlockPreview block={block as FooterBlock} padding={padding} backgroundColor={backgroundColor} textAlign={textAlign} />;
    default:
      return <div className="p-4 text-gray-400">Bloc inconnu</div>;
  }
}

function TextBlockPreview({ block, padding, backgroundColor, textAlign }: { block: TextBlock; padding: string; backgroundColor: string; textAlign: string }) {
  const fontSize = block.style?.fontSize || "16px";
  const color = block.style?.color || "#333333";
  
  return (
    <div 
      style={{ padding, backgroundColor, textAlign: textAlign as React.CSSProperties["textAlign"], fontSize, color, lineHeight: 1.6 }}
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  );
}

function HeadingBlockPreview({ block, padding, backgroundColor, textAlign }: { block: HeadingBlock; padding: string; backgroundColor: string; textAlign: string }) {
  const fontSize = block.level === 1 ? "32px" : block.level === 2 ? "24px" : "20px";
  const color = block.style?.color || "#1a1a1a";
  const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
  
  return (
    <div style={{ padding, backgroundColor, textAlign: textAlign as React.CSSProperties["textAlign"] }}>
      <Tag style={{ margin: 0, fontSize, color, fontWeight: "bold" }}>
        {block.content}
      </Tag>
    </div>
  );
}

function ImageBlockPreview({ block, padding, backgroundColor, textAlign }: { block: ImageBlock; padding: string; backgroundColor: string; textAlign: string }) {
  const width = block.width || "100%";
  
  return (
    <div style={{ padding, backgroundColor, textAlign: textAlign as React.CSSProperties["textAlign"] }}>
      {block.src ? (
        <img 
          src={block.src} 
          alt={block.alt} 
          style={{ maxWidth: "100%", width, height: "auto", display: "block", margin: "0 auto" }}
        />
      ) : (
        <div className="bg-gray-200 flex items-center justify-center h-32 text-gray-400">
          Cliquez pour ajouter une image
        </div>
      )}
    </div>
  );
}

function ButtonBlockPreview({ block, padding, backgroundColor, textAlign }: { block: ButtonBlock; padding: string; backgroundColor: string; textAlign: string }) {
  const btnStyle = block.buttonStyle || {};
  const btnBg = btnStyle.backgroundColor || "#6366f1";
  const btnColor = btnStyle.color || "#ffffff";
  const btnRadius = btnStyle.borderRadius || "6px";
  const btnPadding = btnStyle.padding || "12px 24px";
  
  return (
    <div style={{ padding, backgroundColor, textAlign: textAlign as React.CSSProperties["textAlign"] }}>
      <span
        style={{
          display: "inline-block",
          backgroundColor: btnBg,
          color: btnColor,
          padding: btnPadding,
          borderRadius: btnRadius,
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {block.text}
      </span>
    </div>
  );
}

function DividerBlockPreview({ block, padding, backgroundColor }: { block: DividerBlock; padding: string; backgroundColor: string }) {
  const lineStyle = block.lineStyle || "solid";
  const lineColor = block.lineColor || "#e5e7eb";
  const lineWidth = block.lineWidth || "1px";
  
  return (
    <div style={{ padding, backgroundColor }}>
      <hr style={{ border: "none", borderTop: `${lineWidth} ${lineStyle} ${lineColor}`, margin: 0 }} />
    </div>
  );
}

function SpacerBlockPreview({ block }: { block: SpacerBlock }) {
  return (
    <div style={{ height: block.height, backgroundColor: "rgba(99, 102, 241, 0.1)" }}>
      <div className="h-full flex items-center justify-center text-xs text-indigo-400 opacity-50">
        {block.height}
      </div>
    </div>
  );
}

function ColumnsBlockPreview({ block, padding, backgroundColor }: { block: ColumnsBlock; padding: string; backgroundColor: string }) {
  return (
    <div style={{ padding, backgroundColor }}>
      <div className="flex gap-2">
        {block.columns.map((col, index) => (
          <div 
            key={col.id} 
            style={{ width: col.width }}
            className="border border-dashed border-gray-300 min-h-[60px] flex items-center justify-center text-gray-400 text-sm"
          >
            {col.blocks.length > 0 ? (
              <div className="w-full">
                {col.blocks.map(b => <BlockItem key={b.id} block={b} />)}
              </div>
            ) : (
              `Colonne ${index + 1}`
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialBlockPreview({ block, padding, backgroundColor, textAlign }: { block: SocialBlock; padding: string; backgroundColor: string; textAlign: string }) {
  const iconSize = block.iconSize || "32px";
  
  const socialIcons: Record<string, string> = {
    facebook: "https://cdn-icons-png.flaticon.com/512/733/733547.png",
    twitter: "https://cdn-icons-png.flaticon.com/512/733/733579.png",
    instagram: "https://cdn-icons-png.flaticon.com/512/733/733558.png",
    linkedin: "https://cdn-icons-png.flaticon.com/512/733/733561.png",
    youtube: "https://cdn-icons-png.flaticon.com/512/733/733646.png",
  };
  
  return (
    <div style={{ padding, backgroundColor, textAlign: textAlign as React.CSSProperties["textAlign"] }}>
      {block.links.map((link, index) => (
        <span key={index} style={{ display: "inline-block", margin: "0 8px" }}>
          <img 
            src={socialIcons[link.platform]} 
            alt={link.platform} 
            style={{ width: iconSize, height: iconSize, display: "block" }}
          />
        </span>
      ))}
    </div>
  );
}

function FooterBlockPreview({ block, padding, backgroundColor, textAlign }: { block: FooterBlock; padding: string; backgroundColor: string; textAlign: string }) {
  const fontSize = block.style?.fontSize || "12px";
  const color = block.style?.color || "#6b7280";
  
  return (
    <div style={{ padding, backgroundColor, textAlign: textAlign as React.CSSProperties["textAlign"], fontSize, color }}>
      {block.companyName && <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>{block.companyName}</p>}
      {block.address && <p style={{ margin: "0 0 8px 0" }}>{block.address}</p>}
      {block.unsubscribeLink && (
        <p style={{ margin: 0 }}>
          <span style={{ color, textDecoration: "underline", cursor: "pointer" }}>
            {block.unsubscribeText || "Se désabonner"}
          </span>
        </p>
      )}
    </div>
  );
}
