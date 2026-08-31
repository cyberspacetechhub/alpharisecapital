import { BRAND_COLOR, BRAND_ACCENT } from "./layout";

export const emailButton = (text: string, url: string) => `
  <table cellpadding="0" cellspacing="0" style="margin: 24px auto;">
    <tr>
      <td align="center" style="background:${BRAND_COLOR}; border-radius:6px; padding: 14px 32px;">
        <a href="${url}" style="color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; letter-spacing:0.5px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

export const emailAlert = (message: string, type: "success" | "warning" | "danger" = "success") => {
  const colors = {
    success: { bg: "#f0f7f4", border: BRAND_ACCENT, text: "#1a3a2a" },
    warning: { bg: "#fffbea", border: "#d4a017", text: "#7a5c00" },
    danger:  { bg: "#fff0f0", border: "#c0392b", text: "#7a0000" },
  };
  const c = colors[type];
  return `
    <div style="background:${c.bg}; border-left:4px solid ${c.border}; padding:14px 18px; border-radius:4px; margin:16px 0;">
      <p style="color:${c.text}; font-size:14px; margin:0;">${message}</p>
    </div>
  `;
};

export const emailInfoRow = (label: string, value: string) => `
  <tr>
    <td style="padding:8px 0; font-size:13px; color:#666; width:40%;">${label}</td>
    <td style="padding:8px 0; font-size:13px; color:#222; font-weight:600;">${value}</td>
  </tr>
`;

export const emailInfoTable = (rows: string) => `
  <table width="100%" cellpadding="0" cellspacing="0"
    style="background:#f9f9f9; border-radius:6px; padding:16px 20px; margin:20px 0; border:1px solid #eee;">
    <tbody>${rows}</tbody>
  </table>
`;

export const emailHeading = (text: string) => `
  <h2 style="font-size:20px; color:#1a3a2a; font-weight:700; margin-bottom:8px;">${text}</h2>
`;

export const emailParagraph = (text: string) => `
  <p style="font-size:14px; color:#444; line-height:1.7; margin:10px 0;">${text}</p>
`;
