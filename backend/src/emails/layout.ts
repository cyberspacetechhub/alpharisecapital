const BRAND_NAME = "Alpha Rise Global";
const BRAND_COLOR = "#1a3a2a";
const BRAND_ACCENT = "#2d6a4f";
const BRAND_LIGHT = "#f0f7f4";
const SUPPORT_EMAIL = "support@alphariseglobal.com";
const WEBSITE_URL = "https://alphariseglobal.com";

export const emailLayout = (title: string, content: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background-color: #f4f4f4; font-family: 'Segoe UI', Arial, sans-serif; color: #222; }
    a { color: ${BRAND_ACCENT}; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:${BRAND_COLOR}; padding: 28px 40px; text-align:center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 12px auto;">
                <tr>
                  <td align="center" valign="middle">
                    <img src="${WEBSITE_URL}/branding/arglogo.jpeg" alt="${BRAND_NAME}" width="48" height="48" style="display:block; width:48px; height:48px; border-radius:12px; border:0; outline:none; text-decoration:none;" />
                  </td>
                </tr>
              </table>
              <h1 style="color:#ffffff; font-size:24px; font-weight:700; letter-spacing:1.5px; margin:0;">
                ${BRAND_NAME}
              </h1>
              <p style="color:#a8c5b5; font-size:12px; margin-top:4px; letter-spacing:0.5px;">
                SECURE CRYPTO TRADING PLATFORM
              </p>
            </td>
          </tr>

          <!-- ACCENT BAR -->
          <tr>
            <td style="background:${BRAND_ACCENT}; height:4px;"></td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding: 40px 40px 32px; background:#ffffff;">
              ${content}
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border:none; border-top:1px solid #e8e8e8;" />
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:${BRAND_LIGHT}; padding: 28px 40px; text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${WEBSITE_URL}" style="color:${BRAND_COLOR}; font-weight:600; font-size:14px;">${BRAND_NAME}</a>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <a href="${WEBSITE_URL}/dashboard" style="color:${BRAND_ACCENT}; font-size:13px;">Dashboard</a>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_ACCENT}; font-size:13px;">Support</a>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <a href="${WEBSITE_URL}/privacy" style="color:${BRAND_ACCENT}; font-size:13px;">Privacy Policy</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="font-size:12px; color:#888; line-height:1.6;">
                      &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.<br/>
                      This email was sent to you because you have an account on ${BRAND_NAME}.<br/>
                      If you did not request this, please contact
                      <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_ACCENT};">${SUPPORT_EMAIL}</a> immediately.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:12px;">
                    <p style="font-size:11px; color:#aaa;">
                      ${BRAND_NAME} &bull; Crypto Trading Platform &bull; ${WEBSITE_URL}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export { BRAND_NAME, BRAND_COLOR, BRAND_ACCENT };
