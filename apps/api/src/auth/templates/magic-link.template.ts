export function getMagicLinkEmailTemplate(otp: string, magicLink: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Fettl Login Code</title>
  <style>
    /* Reset and Base styles */
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f6f7f9;
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }
    
    .wrapper {
      width: 100%;
      background-color: #f6f7f9;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }
    
    .header {
      padding: 32px 32px 0;
      text-align: center;
    }
    
    /* Simulate a logo if you don't have an image hosted yet */
    .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #111827;
      margin: 0;
    }
    
    .logo span {
      color: #f59e0b;
    }
    
    .content {
      padding: 24px 32px 32px;
      text-align: center;
    }
    
    .title {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 16px;
      color: #111827;
    }
    
    .text {
      font-size: 15px;
      line-height: 24px;
      color: #4b5563;
      margin: 0 0 24px;
    }
    
    .otp-container {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    
    .otp-code {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #d97706;
      margin: 0;
    }
    
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 24px 0;
      position: relative;
    }
    
    .divider span {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #ffffff;
      padding: 0 12px;
      color: #9ca3af;
      font-size: 12px;
      font-weight: 500;
    }
    
    .button {
      display: inline-block;
      background-color: #111827;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      width: 100%;
      box-sizing: border-box;
      transition: background-color 0.2s;
    }
    
    .footer {
      padding: 24px;
      text-align: center;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer-text {
      font-size: 12px;
      line-height: 16px;
      color: #9ca3af;
      margin: 0;
    }
    
    @media (prefers-color-scheme: dark) {
      .button {
        background-color: #f59e0b !important;
        color: #000000 !important;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <p class="logo">fettl<span>.</span></p>
      </div>
      
      <div class="content">
        <h1 class="title">Secure Login Code</h1>
        <p class="text">Here is your one-time password to access your Fettl account. This code expires in 15 minutes.</p>
        
        <div class="otp-container">
          <p class="otp-code">${otp}</p>
        </div>
        
        <div class="divider">
          <span>OR</span>
        </div>
        
        <p class="text" style="margin-bottom: 16px;">Click the button below to instantly log in on this device.</p>
        <a href="${magicLink}" class="button">Log in to Fettl</a>
      </div>
      
      <div class="footer">
        <p class="footer-text">If you didn't request this email, you can safely ignore it.</p>
        <p class="footer-text" style="margin-top: 8px;">&copy; ${new Date().getFullYear()} Fettl. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
