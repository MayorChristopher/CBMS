# CBMS - Customer Behavior Monitoring System

A comprehensive web analytics platform for tracking and analyzing customer behavior across multiple websites.

## 🚀 Features

### Core Analytics
- **Real-time Tracking**: Monitor user behavior in real-time
- **Session Analytics**: Track user sessions, duration, and engagement
- **Event Tracking**: Capture clicks, form submissions, scroll events, and custom events
- **Page Analytics**: Monitor page views, bounce rates, and conversion rates
- **Device Analytics**: Track device types, screen resolutions, and user agents

### Multi-Website Support
- **Website Management**: Add and manage multiple websites
- **Website Verification**: Secure ownership verification system
- **API Key Management**: Generate and manage API keys per website
- **Cross-Domain Tracking**: Track analytics across different domains

### Role-Based Access
- **Admin Dashboard**: Full access to all features and data
- **Analyst Dashboard**: Advanced analytics and reporting capabilities
- **Customer Dashboard**: Basic analytics for website owners

### Integration
- **Easy Integration**: Simple JavaScript snippet for website integration
- **CORS Support**: Cross-origin request support for external websites
- **Batch Processing**: Efficient event batching for better performance
- **Error Handling**: Robust error handling and retry mechanisms

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel-ready
- **Real-time**: Supabase real-time subscriptions

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/MayorChristopher/CBMS.git
cd CBMS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Set Up Database

Run the SQL scripts in the `scripts/` directory in order:

1. `01-create-tables.sql` - Core tables
2. `02-rls-policies.sql` - Row Level Security
3. `03-seed-data.sql` - Initial data
4. `04-create-demo-user.sql` - Demo user
5. `05-create-profiles-table.sql` - User profiles
6. `06-admin-functions.sql` - Admin functions
7. `07-create-websites-table.sql` - Websites table
8. `08-create-tracking-events-table.sql` - Tracking events
9. `09-create-api-keys-table.sql` - API keys

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Dashboard Overview

### Admin Dashboard
- Complete system overview
- User management
- System settings
- All analytics data

### Analyst Dashboard
- Advanced analytics
- Data export capabilities
- Detailed reporting
- Trend analysis

### Customer Dashboard
- Basic website analytics
- Integration management
- API key management
- Website verification

## 🔌 Integration Guide

### 1. Add Your Website
1. Go to Integration page
2. Add your website URL
3. Verify website ownership

### 2. Create API Key
1. Select your verified website
2. Generate an API key
3. Copy the key securely

### 3. Add Tracking Script
Add this script to your website's `<head>` section:

```html
<script src="https://your-cbms-domain.com/tracking.js?key=YOUR_API_KEY&api=https://your-cbms-domain.com/api/track"></script>
```

### 4. Monitor Analytics
View your analytics in the dashboard!

## 🏗️ Project Structure

```
CBMS/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication pages
│   └── signup/
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── ui/               # UI components
│   └── auth/             # Authentication components
├── lib/                  # Utility libraries
├── public/               # Static files
├── scripts/              # Database scripts
└── supabase/             # Supabase configuration
```

## 🔐 Security Features

- **Row Level Security**: Database-level access control
- **API Key Authentication**: Secure API key validation
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Built-in rate limiting for API endpoints

## 📈 Analytics Features

### Automatic Tracking
- Page views
- Click events
- Form submissions
- Scroll events
- Session tracking
- Device information

### Custom Events
```javascript
// Track custom events
window.CBMS.track('custom_event', {
  category: 'user_action',
  value: 100,
  metadata: { custom: 'data' }
});
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel
4. Deploy!

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

## 🔄 Updates

Stay updated with the latest features and improvements by watching this repository.

---

**Built with ❤️ for better customer insights** "# CBMS" 
