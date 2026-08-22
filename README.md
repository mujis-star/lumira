# ✦ Lumira — Where Moments Illuminate

> A modern, ultra-sleek, production-grade social media platform designed for creative visual artists, photographers, and technologists. Built with **Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion, and Firebase**.

---

## 💎 Brand Identity & Visual Language

- **Original Brand**: Lumira (Radiant Prism Mark `✦`)
- **Aesthetic**: Luminous Cyber-Elegance with frosted glassmorphism (`backdrop-blur-xl`), radiant gradient accents (Electric Amethyst `#8B5CF6`, Neon Cyan `#06B6D4`, Sunset Rose `#F43F5E`), and tactile micro-interactions.
- **Dynamic Themes**:
  - **Cosmic Slate**: Deep void dark mode with cyber glows
  - **Arctic Pearl**: Crisp high-contrast light mode
  - **OLED Midnight**: Pure zero-emission black

---

## 🚀 Core Features

### 1. 🌟 Authentication & 1-Click Persona Switcher
- Full Firebase Authentication integration.
- Built-in resilient **Local Reactive Demo Store** active by default so you can test all features immediately without requiring API keys.
- **Instant Persona Switcher**: Seamlessly switch between realistic creators (*Elena Vance*, *Marcus Thorne*, *Aria Chen*, *Kai Rivera*, *Maya Lin*, *Leo Rossi*, *Chloé Dubois*) to test live interactions, direct messaging, followers, and comments in real-time.

### 2. 📸 Home Feed Experience
- **For You & Following** algorithmic tab filters.
- **Multi-Media Carousels**: Swipeable images with aspect ratio preservation (4:5, 1:1, 16:9).
- **Double-Tap to Like**: Particle heart burst animation with Web Audio synthesized feedback.
- **Interactive Comment Drawer**: Nested replies, comment liking, and quick emoji bar.
- **Audio Track Tags**: Ambient soundtrack tags with animated equalizer pulses.
- **Bookmark & Share Modals**: Save to collections, direct message sharing, and link copying.

### 3. 🔮 24-Hour Stories (Lumira Moments)
- Gradient glowing story rings indicating unseen moments.
- Full-screen Story Viewer with multi-step progress timers, gesture pauses on hold, tap left/right navigation, and emoji reaction bursts.
- **Story Creator Studio**: Upload media or choose radiant presets, write captions, and publish 24h ephemeral stories.

### 4. 🧭 Explore & Discovery Hub
- Real-time search across accounts, hashtags, locations, and captions.
- Category filters (*Generative Art, Photography, Spatial UI, Brutalism, Cinematography, Fashion*).
- Dynamic Masonry Explore Grid with hover metrics and modal popups.
- Featured Visionaries shelf with quick-follow buttons.

### 5. 💬 Lumira Direct (Messaging)
- Split-screen responsive messenger on desktop; fluid thread navigation on mobile.
- Active presence indicator (Green online badge) and unread counters.
- Rich messaging: text messages, photo attachments, simulated voice audio notes with waveforms, and emoji reactions on any message.
- "New Message" creator selector modal.

### 6. 👤 User Profiles & Highlights
- Custom cover banner, avatar with story ring, verified creator badges, pronouns, bio, and website links.
- Creator Spark engagement metrics.
- Story Highlights tray with custom covers.
- Tabbed views: **Moments (Grid)**, **Clips (Vertical)**, **Saved (Bookmarks)**, and **Tagged**.
- Interactive "Edit Profile" modal and "Followers / Following" search modals.

### 7. 🔔 Notifications Center
- Grouped activity feed with category filters (*All, Likes, Comments, Follows, Mentions*).
- "Follow Back" quick action buttons and post thumbnail previews.
- Real-time unread badge counter in desktop sidebar and mobile navigation.

### 8. 🎨 Post Creation Studio
- 3-Step Creation Workflow:
  1. **Upload & Aspect Ratio**: Drag & drop media or select inspiration presets (4:5 Portrait, 1:1 Square, 16:9 Wide).
  2. **Color Grading & Filters**: Live CSS filter presets (*Aurora Glow, Cyberpunk, Velvet Film, Sol Sunset, Noir Luxe, Prism Crisp*).
  3. **Publishing**: Caption editor with hashtag taggers, location tagging, ambient soundtrack attachment, comment toggles, and privacy controls.

### 9. ⚙️ Settings & Privacy
- Theme selector (Cosmic Slate, Arctic Pearl, OLED Midnight).
- Privacy controls: Private Account mode, Activity Status toggle, Read receipts toggle.
- Notification preferences.
- Firebase status viewer and `.env.local` template.

---

## 🛠️ Project Structure

```
lumira/
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout with Theme, Auth, Post, Story, Chat, Notif Providers
│   │   ├── page.tsx                  # Home Feed Page
│   │   ├── explore/page.tsx          # Explore & Discovery Page
│   │   ├── direct/page.tsx           # Direct Messaging Page
│   │   ├── profile/[username]/page.tsx # User Profile Page
│   │   ├── notifications/page.tsx    # Notifications Page
│   │   ├── settings/page.tsx         # Settings & Customization Page
│   │   ├── auth/page.tsx             # Login & Sign Up Page
│   │   └── globals.css               # Design system, glassmorphism, animations
│   ├── components/
│   │   ├── brand/
│   │   │   └── LumiraLogo.tsx        # Original vector prism emblem
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # Layout wrapper
│   │   │   ├── Sidebar.tsx           # Desktop Navigation Sidebar
│   │   │   ├── MobileNav.tsx         # Mobile Bottom Navigation
│   │   │   ├── Header.tsx            # App Header with Persona Switcher
│   │   │   └── RightWidgetPanel.tsx  # Suggested Creators & Trending Tags
│   │   ├── feed/
│   │   │   ├── PostCard.tsx          # Post card with reactions
│   │   │   ├── PostCarousel.tsx      # Media carousel with double-tap like
│   │   │   ├── CommentsDrawer.tsx    # Comment thread drawer
│   │   │   ├── ShareModal.tsx        # Share & copy link modal
│   │   │   └── PostOptionsModal.tsx  # Post options dropdown
│   │   ├── stories/
│   │   │   ├── StoryBar.tsx          # Story rings bar
│   │   │   ├── StoryViewerModal.tsx  # Fullscreen story viewer
│   │   │   └── StoryCreatorModal.tsx # 24h story creator
│   │   ├── create/
│   │   │   └── CreatePostModal.tsx   # 3-step Post Creation Studio
│   │   └── ui/
│   │       ├── Avatar.tsx            # Avatar with story rings & verified badge
│   │       ├── Button.tsx            # Luminous glass & gradient buttons
│   │       ├── Modal.tsx             # Animated modal overlay
│   │       └── PersonaSwitcher.tsx   # Instant 1-click persona switcher
│   ├── context/
│   │   ├── AuthContext.tsx           # Dual-mode Auth & Persona switcher
│   │   ├── PostContext.tsx           # Real-time posts, likes, comments, bookmarks
│   │   ├── StoryContext.tsx          # 24h stories system
│   │   ├── ChatContext.tsx           # Direct messaging and reactions
│   │   ├── NotificationContext.tsx   # Notifications feed and badges
│   │   └── ThemeContext.tsx          # Theme switcher (dark/light/midnight)
│   ├── lib/
│   │   ├── firebase.ts               # Firebase initialization & fallback detection
│   │   ├── seedData.ts               # Curated creator personas, moments, stories, chats
│   │   ├── types.ts                  # Comprehensive TypeScript definitions
│   │   └── utils.ts                  # Web Audio synthesizer sounds, formatting, confetti
├── firestore.rules                   # Production Firestore security rules
├── storage.rules                     # Production Firebase Storage security rules
├── .env.example                      # Environment variables template
├── package.json
└── next.config.ts
```

---

## ⚡ Getting Started

### 1. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Connect Live Firebase (Optional)
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```
Deploy security rules:
```bash
firebase deploy --only firestore:rules,storage
```
"# lumira" 
