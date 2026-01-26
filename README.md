# CIXIO - Advanced AI Software Solutions Landing Page

A modern, responsive landing page for CIXIO - an AI software company offering advanced solutions with end-to-end encryption and data privacy.

## 🚀 Features

- **Responsive Design**: Fully responsive across all devices (mobile, tablet, desktop)
- **Modern UI/UX**: Clean, professional design with smooth animations and transitions
- **Interactive Components**:
  - Dynamic navigation with mobile menu
  - Modal-based login and registration forms
  - Contact form with validation
  - Newsletter subscription (email/mobile)
  - Animated scroll effects
  
- **Functional Sections**:
  - Hero section with company branding
  - Services showcase
  - Product offerings (Healthcare, E-commerce Platform, Enterprise Data)
  - Technology features (AI/ML, Encryption, Data Privacy)
  - Pricing plans (Starter, Professional, Enterprise)
  - Contact section with form
  - Newsletter subscription
  - Footer with social links

## 📁 Project Structure

```
landing1/
├── public/
│   ├── index.html          # Main HTML file
│   ├── css/
│   │   └── styles.css      # Main stylesheet
│   ├── js/
│   │   └── main.js         # JavaScript functionality
│   └── assets/
│       └── *.svg           # Logo and icon files
├── Logo_and_Banner/        # Original branding assets
├── company-details/        # Company documentation (PDFs)
└── README.md              # This file
```

## 🛠️ Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid, Flexbox, and Custom Properties
- **Vanilla JavaScript**: No framework dependencies for better performance
- **Font Awesome**: Icon library
- **Google Fonts**: Inter font family

## 🎨 Design Features

- **Color Scheme**: 
  - Primary: #0066FF (Blue)
  - Secondary: #00D9FF (Cyan)
  - Accent: #FF6B35 (Orange)
  - Dark: #0A0E27
  
- **Typography**: Inter font family with various weights
- **Animations**: Smooth transitions, scroll animations, modal effects
- **Responsive Breakpoints**:
  - Mobile: < 576px
  - Tablet: 576px - 992px
  - Desktop: > 992px

## 🔧 Setup & Installation

1. Clone the repository:
```bash
git clone https://github.com/admin-cixio/landing1.git
cd landing1
```

2. Open the landing page:
```bash
# Simply open public/index.html in your browser
# Or use a local server (recommended):
python -m http.server 8000 --directory public
# OR
npx serve public
```

3. Access the site at `http://localhost:8000`

## 📋 Form Functionality

### Contact Form
- Name, Email (required)
- Phone, Company (optional)
- Subject, Message (required)
- Email validation
- Currently logs to console (implement backend API for production)

### Login Form
- Email/Mobile number
- Password
- Remember me checkbox
- Forgot password link
- Social authentication placeholders (Google, Microsoft)

### Registration Form
- First Name, Last Name
- Email (required)
- Mobile Number (optional)
- Password with validation (min 8 chars, uppercase, lowercase, number)
- Confirm Password
- Terms & Conditions checkbox

### Newsletter Subscription
- Accepts email or mobile number
- Validation for both formats
- Success notification

## 🔐 Security Features Highlighted

- End-to-End Encryption (256-bit)
- Data Privacy First approach
- GDPR & HIPAA Compliance
- Secure authentication flows

## 📱 Responsive Design

The website is fully responsive and tested on:
- Desktop (1920px, 1440px, 1024px)
- Tablet (768px, 992px)
- Mobile (375px, 414px, 576px)

## 🚀 Production Deployment

### Backend Integration Required

For production use, implement these backend endpoints:

```javascript
// Contact Form
POST /api/contact
Body: { name, email, phone, company, subject, message }

// Newsletter Subscription
POST /api/subscribe
Body: { contact, type }

// User Authentication
POST /api/login
Body: { email, password }

POST /api/register
Body: { firstName, lastName, email, mobile, password }
```

### Email Service Integration

Integrate with email service providers:
- SendGrid
- Mailgun
- AWS SES
- Custom SMTP

### Deployment Options

- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **Cloud**: AWS S3 + CloudFront, Google Cloud Storage
- **Traditional**: Apache, Nginx

## 📧 Contact Information

- **Email**: info@cixio.com, support@cixio.com
- **Phone**: +1 (555) 123-4567
- **Address**: 123 Innovation Drive, Tech Valley, CA 94000

## 🔄 Future Enhancements

- [ ] Backend API integration
- [ ] Database for user management
- [ ] Email service integration
- [ ] Blog section
- [ ] Customer testimonials
- [ ] Case studies
- [ ] Live chat support
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Analytics integration

## 📄 License

© 2024 CIXIO. All rights reserved.

## 🤝 Contributing

This is a private company repository. For internal contributions, please follow the company's development guidelines.

## 📞 Support

For support and inquiries, please contact:
- Technical Support: support@cixio.com
- Sales: sales@cixio.com
- General: info@cixio.com

---

**Built with ❤️ for CIXIO**
