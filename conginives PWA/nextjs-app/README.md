# CognivusLabs PWA - Next.js

A Progressive Web App for real-time patient monitoring built with Next.js 14.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd nextjs-app
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
nextjs-app/
├── public/
│   ├── icons/              # PWA icons
│   ├── manifest.json       # PWA manifest
│   └── sw.js              # Service Worker
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── health/
│   │   │   ├── patients/
│   │   │   ├── push/
│   │   │   └── vitals/
│   │   ├── dashboard/     # Dashboard page
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Home page
│   │   └── providers.tsx  # Context providers
│   ├── components/
│   │   ├── dashboard/     # Dashboard components
│   │   ├── InstallPrompt.tsx
│   │   ├── LoginPage.tsx
│   │   └── SplashScreen.tsx
│   └── hooks/             # Custom hooks
├── next.config.js         # Next.js config with PWA
├── tailwind.config.js     # Tailwind CSS config
└── package.json
```

## ✨ Features

- ⚡ **Next.js 14** - App Router, Server Components
- 🎨 **Tailwind CSS** - Utility-first styling
- 📱 **PWA Ready** - Installable, offline support
- 🔔 **Push Notifications** - Real-time alerts
- 🌙 **Dark Theme** - Beautiful dark UI
- 📊 **Real-time Vitals** - Live patient monitoring
- 🔒 **TypeScript** - Full type safety

## 🧪 Test Patient IDs

- `PT001` - John Silva (Normal)
- `PT002` - Sarah Fernando (Normal)
- `PT003` - Kumar Jayawardena (ICU - Critical)

## 📲 Installing as PWA

1. Open the app in Chrome/Edge
2. Click the install button in the address bar
3. Or use the install prompt that appears

## 🔧 Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/patients/:id` | GET | Get patient info |
| `/api/vitals/:patientId` | GET | Get patient vitals |
| `/api/push/subscribe` | POST | Subscribe to push |
| `/api/push/subscribe` | DELETE | Unsubscribe |

## 🛠️ Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📄 License

MIT License
