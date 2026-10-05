const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    this.isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  }

  async sendPriceDropAlert(alert, product, oldPrice, newPrice) {
    if (!this.isConfigured) {
      console.log('Email not configured. Price drop alert would be sent to:', alert.email);
      return;
    }

    const savings = oldPrice - newPrice;
    const savingsPercent = ((savings / oldPrice) * 100).toFixed(1);

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Global Price Engine <alerts@globalpriceengine.com>',
        to: alert.email,
        subject: `Price Drop Alert: ${product.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">Price Drop Alert!</h2>
            <p>Great news! The price of <strong>${product.title}</strong> has dropped.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Old Price:</strong> $${oldPrice.toFixed(2)}</p>
              <p><strong>New Price:</strong> <span style="color: #22c55e; font-size: 24px;">$${newPrice.toFixed(2)}</span></p>
              <p><strong>You Save:</strong> $${savings.toFixed(2)} (${savingsPercent}%)</p>
            </div>
            <a href="${product.product_url}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Product</a>
          </div>
        `
      });
      console.log('Price drop email sent to:', alert.email);
    } catch (err) {
      console.error('Failed to send price drop email:', err.message);
    }
  }

  async sendWelcomeEmail(user) {
    if (!this.isConfigured) return;
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Global Price Engine <hello@globalpriceengine.com>',
        to: user.email,
        subject: 'Welcome to Global Price Engine!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">Welcome, ${user.name}!</h2>
            <p>Thank you for joining Global Price Engine. Start saving money on every purchase!</p>
            <ul>
              <li>10 free searches per day</li>
              <li>3 price alerts</li>
              <li>Save your favorite products</li>
            </ul>
            <a href="http://localhost:3000" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Start Searching</a>
          </div>
        `
      });
    } catch (err) {
      console.error('Failed to send welcome email:', err.message);
    }
  }
}

module.exports = new EmailService();
