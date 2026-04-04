# KPI Chatbot Frontend

Modern admin dashboard built with Next.js 16 with fully integrated authentication system.

## ✨ Features

- 🔐 JWT-based authentication with role validation
- 📱 Responsive design with Tailwind CSS
- 🎨 Dark mode support
- 🔔 Toast notifications system
- 🛡️ Protected routes with role-based access control
- 📊 Dashboard with charts and analytics
- ⚡ Next.js 16 with React 19
- 📦 TypeScript support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Backend API running at `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Update NEXT_PUBLIC_API_URL if needed

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

## 🔐 Authentication

The application includes a complete authentication system:

- **Sign In:** Email/username + password
- **Role Validation:** Only admin/superadmin users can access
- **Session Persistence:** Tokens stored in localStorage
- **Protected Routes:** Dashboard requires authentication

### Login

1. Open `http://localhost:3000`
2. Auto-redirects to `/signin`
3. Enter admin credentials
4. Success → Redirected to dashboard

## 📁 Project Structure

```
src/
├── app/                   # Next.js app directory
│  ├── layout.tsx         # Root layout with providers
│  ├── page.tsx           # Dashboard (protected)
│  └── (auth)/            # Auth routes
├── components/           # React components
│  ├── auth/              # Authentication components
│  ├── ui/                # UI components
│  └── common/            # Common components
├── context/              # React Context providers
│  ├── AuthContext.tsx    # Auth state management
│  └── ToastContext.tsx   # Toast notifications
├── services/             # API services
│  └── authService.ts     # Authentication API
└── layout/               # Layout components
```

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, update the backend URL accordingly.

## 📚 Documentation

Comprehensive documentation is available:

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[AUTH_INTEGRATION_GUIDE.md](./AUTH_INTEGRATION_GUIDE.md)** - Detailed technical guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment procedures
- **[ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)** - System architecture
- **[PROJECT_COMPLETION_SUMMARY.md](./PROJECT_COMPLETION_SUMMARY.md)** - Project status

## 🧪 Testing

### Login Test
```bash
npm run dev
# Open http://localhost:3000
# Login with admin credentials
# Should redirect to dashboard
```

### Build Test
```bash
npm run build
npm start
```

## 🚀 Deployment

For production deployment, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Quick Deploy (Vercel)
```bash
npm install -g vercel
vercel --prod
```

## 🔐 Security

- JWT token-based authentication
- Role-based access control (RBAC)
- Protected routes
- CORS configuration
- Password masking
- Secure session management

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## 📦 Dependencies

- **next** - React framework
- **react** - UI library
- **tailwindcss** - Styling
- **axios** - HTTP client
- **apexcharts** - Charts library
- **fullcalendar** - Calendar component

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📞 Support

For issues or questions:
1. Check the documentation
2. Review troubleshooting guides
3. Check browser console for errors
4. Verify backend is running

## 📄 License

[See LICENSE file](./LICENSE)

## 👨‍💻 Author

Created with ❤️ by Ahmad Fauzan Naji

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** April 4, 2026