const nodemailer = require("nodemailer");

/**
 * Creates and returns an Outlook SMTP transport.
 * Configured for Outlook/Office365 service (smtp.office365.com on port 587).
 */
const createOutlookTransporter = () => {
  const host = process.env.OUTLOOK_SMTP_HOST || "smtp.office365.com";
  const port = parseInt(process.env.OUTLOOK_SMTP_PORT || "587", 10);
  const user = process.env.OUTLOOK_EMAIL || process.env.EMAIL_USER;
  const pass = process.env.OUTLOOK_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("⚠️ Outlook mailer credentials missing (OUTLOOK_EMAIL & OUTLOOK_PASSWORD). Emails will be logged locally as simulated dispatch.");
    return null;
  }

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: false, // TLS via STARTTLS
    requireTLS: true,
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false
    },
  });
};

/**
 * Sends missing diary email reminder to student via Outlook Mail Service.
 */
const sendMissingDiaryEmail = async (studentEmail, studentName, missingDates = []) => {
  const datesText = Array.isArray(missingDates) ? missingDates.join(", ") : missingDates;
  const subject = `⚠️ LNBTI Internship Alert: Missing Daily Diary Entry (${datesText})`;
  const senderEmail = process.env.OUTLOOK_EMAIL || "internships@lnbti.edu.lk";

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #6366f1;">🎓 LNBTI Internship Program</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Official Outlook Mail Service Notification</p>
      </div>

      <div style="padding: 28px; color: #334155; line-height: 1.6;">
        <h2 style="color: #ef4444; margin-top: 0; font-size: 18px;">⚠️ Immediate Action Required: Daily Internship Diary Update</h2>
        <p>Dear <strong>${studentName}</strong>,</p>
        
        <p>Our automated monitoring system detected that you have <strong>not submitted your daily internship diary</strong> for the following date(s):</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 6px; margin: 18px 0; color: #991b1b; font-weight: 600;">
          📅 Missing Date(s): ${datesText}
        </div>

        <p>As per LNBTI Internship policy, every Year 3 intern student is required to log their daily activities, learnings, and hours worked throughout their 6-month internship period.</p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; display: inline-block;">Open Student Dashboard & Update Log</a>
        </div>

        <p style="font-size: 13px; color: #64748b;">Failure to maintain daily records may affect your supervisor's evaluation score and internship completion certificate.</p>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
        Sent via LNBTI Outlook Mail Service • LNBTI Career Path System
      </div>
    </div>
  `;

  const transporter = createOutlookTransporter();

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`📧 [OUTLOOK MAIL SERVICE SIMULATION]`);
    console.log(`TO: ${studentEmail}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`MISSING DATES: ${datesText}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true, message: "Simulated email logged successfully (add OUTLOOK_EMAIL and OUTLOOK_PASSWORD to .env to send real emails via Outlook SMTP)" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"LNBTI Internship Portal" <${senderEmail}>`,
      to: studentEmail,
      subject: subject,
      html: htmlContent,
    });

    console.log("✅ Outlook email dispatched successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Failed to send Outlook email:", err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendMissingDiaryEmail
};
