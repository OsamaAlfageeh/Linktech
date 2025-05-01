import { MailerSend, EmailParams, Recipient, Sender } from "mailersend";

// Check if API key is set
const apiKey = process.env.MAILERSEND_API_KEY;
if (!apiKey) {
  console.error("MAILERSEND_API_KEY is not set in environment variables");
  process.exit(1);
}

// Create MailerSend instance
const mailerSend = new MailerSend({ apiKey });

// Create sender
// Using a standard mail service domain that's likely verified
const sender = new Sender("password-reset@mailersend.com", "تِكلينك");

// Test function
async function testMailerSend() {
  try {
    console.log("Creating recipient...");
    const recipient = new Recipient("test@example.com", "Test User");
    const recipients = [recipient];
    
    console.log("Creating email params...");
    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject("Test Email")
      .setHtml("<p>This is a test email.</p>")
      .setText("This is a test email.");
    
    console.log("Sending email...");
    const response = await mailerSend.email.send(emailParams);
    console.log("Email sent successfully:", response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Run the test
testMailerSend();