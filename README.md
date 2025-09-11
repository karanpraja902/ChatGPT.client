# ChatGPT Client

A modern, intelligent AI chat application built with Next.js 15, React 19, and TypeScript. This client application provides a sleek interface for interacting with multiple AI models, document analysis, web search, and more.
-For backend visit - https://github.com/karanpraja902/ChatGPT.server

## 🚀 Features



### 💬 **Intelligent Chat System**
- Natural, context-aware conversations
- Chat history and conversation management
- Message persistence and synchronization
- Real-time typing indicators and responses

### 📄 **Document Analysis**
- PDF upload and analysis capability
- AI-powered document insights and summaries
- Text extraction and processing
- File management with Cloudinary integration

### 🔍 **Web Search Integration**
- Real-time web search capabilities
- Current events and up-to-date information
- Web content analysis and summarization

### 🎨 **Modern UI/UX**
- Beautiful, responsive design with Tailwind CSS
- Dark/light theme support
- Mobile-first responsive layout
- Smooth animations and transitions
- Radix UI components for accessibility

### 🔐 **Authentication & Security**
- Secure user authentication
- JWT token management
- Protected routes and middleware
- User session management

### 💳 **Subscription Management**
- Stripe integration for payments
- Multiple subscription tiers (Free, Pro+, Ultra)
- Trial period management
- Usage tracking and limits

### 🎤 **Voice Features**
- Voice dictation for messages
- Speech-to-text integration
- Audio input support

## 🛠️ Tech Stack

### **Frontend Framework**
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development

### **Styling & UI**
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **Class Variance Authority** - Component variant management

### **AI & ML Integration**
- **AI SDK** - Vercel AI SDK for AI integration
- **LangChain** - AI application framework

- **Google AI** - Gemini model integration

### **File & Media**
- **React PDF** - PDF viewing and processing
- **Cloudinary** - Image and file management
- **PDF.js** - Client-side PDF handling

### **State Management & Data**
- **Zustand** (via chat store) - Lightweight state management
- **React Context** - Authentication and subscription state
- **MongoDB** - Database integration
- **Mongoose** - MongoDB object modeling

### **Payment & Subscriptions**
- **Stripe** - Payment processing
- **Stripe.js** - Client-side payment integration

### **Development Tools**
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Turbopack** - Fast development bundler

## 📁 Project Structure

```
client/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (root)/            # Protected routes
│   │   │   ├── chat/          # Chat interface
│   │   │   │   ├── [id]/      # Individual chat page
│   │   │   │   └── new/       # New chat page
│   │   │   ├── settings/      # User settings & subscriptions
│   │   │   └── page.tsx       # Dashboard/home page
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   └── stripe/        # Payment endpoints
│   │   ├── landing/           # Landing page
│   │   ├── sign-in/           # Authentication pages
│   │   ├── sign-up/           
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── chat/              # Chat-related components
│   │   ├── ui/                # Reusable UI components
│   │   └── weather/           # Weather widget
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── SubscriptionContext.tsx # Subscription state
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   ├── services/              # API service layer
│   │   └── api/               # API client functions
│   ├── store/                 # State management
│   ├── util/                  # Utility functions
│   └── middleware.ts          # Next.js middleware
├── public/                    # Static assets
├── components.json            # Shadcn/ui configuration
├── next.config.ts            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or 20.x
- **npm** or **yarn** or **pnpm**
- **Backend API** running (see server README)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd deepseek.ai.client
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

Create a `.env.local` file in the client directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pub_key
```

## 📜 Available Scripts

- **`npm run dev`** - Start development server with Turbopack
- **`npm run build`** - Build for production
- **`npm run start`** - Start production server
- **`npm run lint`** - Run ESLint
- **`npm run type-check`** - Run TypeScript type checking

## 🎨 UI Components

The application uses a modern component architecture:

### **Core Components**
- `ChatContainer` - Main chat interface
- `ChatInput` - Message input with AI integration
- `AuthGuard` - Route protection
- `LoginForm` - Authentication form

### **UI Components**
- Button, Card, Input - Base UI components
- Sidebar, Header - Navigation components
- ThemeToggle - Dark/light mode switcher
- DictationButton - Voice input component

## 🔐 Authentication Flow

1. **Landing Page** - Unauthenticated users see the landing page
2. **Sign In/Up** - Authentication via Google OAuth or email
3. **Dashboard** - Authenticated users are redirected to chat
4. **Protected Routes** - All app routes require authentication

## 💳 Subscription Tiers

### **Free Trial**
- Limited access to features
- 14-day free trial
- Demo mode capabilities

### **Pro+ ($20/month)**
- Access to all features
- 1000 tokens per day
- Priority support
- OpenRouter API access
- Early access to features

### **Ultra ($40/month)**
- 20x higher limits
- All AI models included
- Early access to features
- Premium support
- Advanced analytics

## 🚀 Deployment

### **Vercel (Recommended)**
 
1. **Connect to Vercel**
   ```bash command
   npm install -g vercel
   vercel
   ```

2. **Set environment variables** in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### **Other Platforms**

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Google Cloud Platform

## 🧪 Development

### **Code Quality**
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting (recommended)

### **Testing**
```bash
# Add your test commands here
npm run test
```

### **Building**
```bash
npm run build
npm run start
```

## 🔧 Configuration

### **Tailwind CSS**
Customize styling in `tailwind.config.js`

### **Next.js**
Configure Next.js in `next.config.ts`

### **TypeScript**
TypeScript configuration in `tsconfig.json`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement responsive design
- Write meaningful commit messages
- Test your changes thoroughly

## 📝 API Integration

The client communicates with the backend API through:

- **Authentication**: JWT token-based authentication
- **Chat Management**: Real-time chat operations
- **File Upload**: Cloudinary integration
- **Payments**: Stripe subscription management
- **AI Models**: OpenRouter and direct model access

## 🐛 Troubleshooting

### **Common Issues**

1. **Build Errors**
   - Check Node.js version compatibility
   - Clear `.next` folder and rebuild
   - Verify environment variables

2. **Authentication Issues**
   - Check API connection
   - Verify JWT token handling
   - Check CORS configuration

3. **Styling Issues**
   - Clear Tailwind cache
   - Check for conflicting CSS
   - Verify component imports

4. **API Connection**
   - Check backend server status
   - Verify API URLs in environment
   - Check network connectivity

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://radix-ui.com)
- [Stripe Documentation](https://stripe.com/docs)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for AI SDK and deployment platform
- OpenRouter for AI model access
- Stripe for payment processing
- All the open-source contributors

---

**Built with ❤️ using Next.js, React, and TypeScript**
