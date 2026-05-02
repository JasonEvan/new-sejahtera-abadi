import { transporter } from "@/lib/mailer";

export async function sendApprovalEmail(payload: {
  approvalToken: string;
  userName: string;
  deviceLabel: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const approveUrl = `${baseUrl}/api/auth/approve/${payload.approvalToken}`;
  const declineUrl = `${baseUrl}/api/auth/decline/${payload.approvalToken}`;

  await transporter.sendMail({
    from: `"POS Security" <${process.env.SMTP_USER}>`,
    to: process.env.OWNER_EMAIL,
    subject: `[POS] Login Request — ${payload.userName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff;">
        <div style="background: #1e293b; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Security Alert</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #0f172a; margin-top: 0;">Login Request</h2>
          <p style="color: #475569; line-height: 1.6;">
            Akun <strong>${payload.userName}</strong> mencoba login
            dari device yang belum dikenal sebelumnya.
          </p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 4px 0; color: #64748b;"><strong>Device:</strong> ${payload.deviceLabel}</p>
            <p style="margin: 4px 0; color: #64748b;"><strong>Time:</strong> ${new Date().toLocaleString("id-ID")}</p>
            <p style="margin: 4px 0; color: #64748b;"><strong>Expired:</strong> 1 jam dari sekarang</p>
          </div>
          <div style="display: flex; gap: 20px; margin-top: 32px;">
            <a href="${approveUrl}"
               style="display: inline-block; padding: 12px 24px; background: #16a34a; color: #fff;
                      border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; flex: 1;">
              ✅ Approve Login
            </a>
            <a href="${declineUrl}"
               style="display: inline-block; padding: 12px 24px; background: #dc2626; color: #fff;
                      border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; flex: 1;">
              ❌ Decline
            </a>
          </div>
          <p style="margin-top: 32px; color: #94a3b8; font-size: 14px;">
            Jika Anda tidak mengharapkan permintaan ini, segera klik <strong>Decline</strong>
            dan pertimbangkan untuk mengganti password akun tersebut.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 16px; text-align: center; color: #64748b; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Sejahtera Abadi POS. All rights reserved.
        </div>
      </div>
    `,
  });
}
