import emailjs from '@emailjs/browser';

// ✅ YOUR REAL KEYS
const SERVICE_ID = "service_xk4mjq2";       
const TEMPLATE_ID = "template_ibdicnr";     
const PUBLIC_KEY = "c8_PULDo3-y-2RBWs";    

export const sendNotification = async (studentName, studentEmail, companyName) => {
  try {
    const templateParams = {
      to_name: studentName,
      to_email: studentEmail,
      company_name: companyName,
    };

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log("📧 Email sent successfully to:", studentEmail);
    return true;
  } catch (error) {
    console.error("❌ Email failed:", error);
    return false;
  }
};