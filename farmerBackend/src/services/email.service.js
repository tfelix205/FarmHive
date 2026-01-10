// farmerBackend/src/services/email.service.js
// This service handles sending emails for order confirmations

const sendOrderConfirmationEmail = async (orderData) => {
  try {
    // Email configuration
    const emailConfig = {
      to: orderData.customerEmail,
      subject: `Order Confirmed - ${orderData.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
            }
            .order-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .item {
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .item:last-child {
              border-bottom: none;
            }
            .total {
              font-size: 1.2em;
              font-weight: bold;
              color: #16a34a;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 2px solid #16a34a;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 0.9em;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #16a34a;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed! 🎉</h1>
              <p>Your order is on its way</p>
            </div>
            
            <div class="content">
              <p>Dear ${orderData.customerName},</p>
              
              <p>Thank you for your order! We're pleased to confirm that your order has been confirmed and is being prepared for delivery.</p>
              
              <div class="order-details">
                <h2>Order Details</h2>
                <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress.fullAddress || orderData.deliveryAddress}</p>
                <p><strong>Phone:</strong> ${orderData.customerPhone}</p>
                
                <h3 style="margin-top: 20px;">Items Ordered:</h3>
                ${orderData.items.map(item => `
                  <div class="item">
                    <strong>${item.name}</strong><br>
                    Quantity: ${item.quantity} ${item.unit} × N${item.price}<br>
                    <span style="color: #16a34a;">Subtotal: N${item.subtotal.toFixed(2)}</span>
                  </div>
                `).join('')}
                
                <div class="total">
                  Total Amount: N${orderData.finalAmount.toFixed(2)}
                </div>
              </div>
              
              <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
              
              <p>We will contact you shortly to arrange the delivery. Your fresh produce will be delivered to your doorstep.</p>
              
              <p>If you have any questions about your order, please don't hesitate to contact us at <strong>+234 123 456 7890</strong> or <strong>info@farmersmarket.com</strong>.</p>
              
              <p>Thank you for supporting local farmers!</p>
              
              <p>Best regards,<br>
              <strong>Farmer's Market Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Farmer's Market. All rights reserved.</p>
              <p>Lagos, Nigeria | +234 123 456 7890 | info@farmersmarket.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // For production, use a service like SendGrid, Mailgun, or Nodemailer
    // Here's an example with a generic email service:
    
    console.log('Sending order confirmation email to:', orderData.customerEmail);
    console.log('Email config:', emailConfig);
    
    // Uncomment this when you have email credentials configured:
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    await transporter.sendMail({
      from: '"Farmer\'s Market" <noreply@farmersmarket.com>',
      to: emailConfig.to,
      subject: emailConfig.subject,
      html: emailConfig.html
    });
    */
    
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: 'Failed to send email', error };
  }
};

module.exports = {
  sendOrderConfirmationEmail
};