<div align="center">

<img src="assets/icon.png" alt="PrinParty Logo" width="120" height="120" style="border-radius: 24px;" />

# PrinParty

**Random Video Call Matching App**

[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey?style=flat-square)](https://expo.dev)
[![Expo](https://img.shields.io/badge/Expo-54.0-black?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12.9-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Agora](https://img.shields.io/badge/Agora.io-SDK-099DFD?style=flat-square)](https://agora.io)

*Instantly connect with a random stranger via live video — no sign-up, no friction.*

</div>

---

## ✨ Features

- **One-Tap Start** — Firebase Anonymous Auth signs you in silently the moment you tap the button. No account required.
- **Real-Time Matching** — Firebase Realtime Database queue with atomic `runTransaction` ensures race-condition-free pairing even under concurrent load.
- **HD Video Calls** — Agora.io RTC delivers low-latency, high-quality two-way video and audio.
- **Client-Side Token Generation** — Agora AccessToken v006 (HMAC-SHA256 + CRC32) is generated entirely on-device — no token server needed.
- **Recent Contact Avoidance** — The last 3 matched users are excluded from your next match pool, so you always meet someone new.
- **Auto Re-Queue** — After a call ends, you're automatically placed back into the waiting queue without any extra tap.
- **Picture-in-Picture UI** — Your local preview is pinned to the bottom-right corner while the remote feed fills the full screen.
- **Duplicate-Call Guard** — Multiple ref-based guards (`matchFoundRef`, `callEndedRef`, `cancelledRef`) prevent duplicate Firebase writes and Agora operations.

---

## 🏗️ Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | [Expo](https://expo.dev) (React Native) ~54 | Development Build — Expo Go not supported |
| Language | TypeScript 5.9 | Strict mode enabled |
| Video Calls | [Agora.io](https://agora.io) `react-native-agora` ^4.5 | Up to 10,000 free minutes/month |
| Auth | Firebase Anonymous Auth | Zero-friction sign-in |
| Realtime DB | Firebase Realtime Database | Queue + match document storage |
| State | React `useState` | No external state library |
| Navigation | Custom `AppNavigator` (`useState<Screen>`) | No expo-router |
| Icons | `@expo/vector-icons` (Ionicons) | |
| Build | EAS Build | iOS & Android cloud builds |

---

## 📱 Screen Flow

```
IndexScreen  ──▶  WaitingScreen  ──▶  VideoCallScreen
(Tap "Start")     (Queue + Match)      (Live Call)
                        ▲                    │
                        └────────────────────┘
                         Auto re-queue on call end
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9 | bundled with Node |
| Expo CLI | latest | `npm i -g expo-cli` |
| EAS CLI | latest | `npm i -g eas-cli` |
| Xcode | ≥ 15 | Mac App Store (iOS only) |
| Android Studio | latest | [developer.android.com](https://developer.android.com/studio) (Android only) |

### 1. Clone the repository

```bash
git clone https://github.com/your-username/prinparty.git
cd prinparty
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```env
# Firebase — https://console.firebase.google.com
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Agora — https://console.agora.io
EXPO_PUBLIC_AGORA_APP_ID=your_agora_app_id
EXPO_PUBLIC_AGORA_APP_CERTIFICATE=your_agora_certificate  # Optional for test mode
```

> **Note:** `EXPO_PUBLIC_AGORA_APP_CERTIFICATE` is optional. If omitted, the app runs in test mode (empty token). For production, always set this value.

### 4. Firebase setup (one-time)

1. Go to [Firebase Console](https://console.firebase.google.com) → your project → **Authentication** → Enable **Anonymous** sign-in.
2. Go to **Realtime Database** → Create database → Set rules to allow authenticated reads/writes:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### 5. Run the app

> `react-native-agora` requires a **Development Build** — it does not run on Expo Go.

```bash
# iOS simulator (macOS only)
npm run ios

# Android emulator
npm run android

# Start development server only
npm start
```

---

## 📁 Project Structure

```
prinparty/
├── App.tsx                        # Entry point — wraps AppNavigator in SafeAreaProvider
├── index.ts                       # Expo entry registration
├── app.json                       # Expo config (bundle ID, permissions, EAS project ID)
├── eas.json                       # EAS Build profiles (development / preview / production)
├── metro.config.js                # Metro bundler config
├── .env.example                   # Environment variable template
│
├── assets/                        # App icons & splash screen images
│
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx        # Screen state machine (index → waiting → videoCall)
    │
    ├── screens/
    │   ├── IndexScreen.tsx         # Home screen — anonymous login + "Start Matching" button
    │   ├── WaitingScreen.tsx       # Matching queue — animated spinner + cancel button
    │   └── VideoCallScreen.tsx     # Live call — full-screen remote video + PiP local preview
    │
    ├── services/
    │   ├── matchingService.ts      # Firebase queue logic (joinQueue, tryMatch, listenForMatch)
    │   └── agoraService.ts         # Agora RTC engine (initAgora, joinChannel, leaveChannel, token)
    │
    ├── config/
    │   └── firebase.ts             # Firebase app initialization
    │
    └── constants/
        └── colors.ts               # Design system (Colors, Typography, Spacing, Radius, Shadows)
```

---

## 🔄 How Matching Works

The matching pipeline is built to be **atomic and race-condition-free**:

```
User A taps "Start"         User B taps "Start"
       │                           │
  signInAnonymously()         signInAnonymously()
       │                           │
  joinQueue(uidA)             joinQueue(uidB)
  /queue/{uidA} written       /queue/{uidB} written
       │                           │
  tryMatch(uidA) ─────────── tryMatch(uidB)
       └──────── runTransaction ────┘
                      │
              One transaction wins:
              /queue cleaned up
              /matches/{id} created
                      │
          listenForMatch fires on both clients
                      │
              screen → 'videoCall'
```

`runTransaction` on the entire `/queue` node guarantees only **one** match document is ever created per pair, regardless of how many clients call `tryMatch` simultaneously.

---

## 🗄️ Firebase Database Schema

```
Firebase Realtime Database
├── /queue/{uid}
│     ├── uid: string             # Firebase anonymous user ID
│     ├── joinedAt: number        # Unix timestamp (ms) — used for FIFO ordering
│     └── recentContacts: string[] # Last 3 matched UIDs to exclude from pairing
│
└── /matches/{matchId}
      ├── user1: string           # UID of first matched user
      ├── user2: string           # UID of second matched user
      ├── channelName: string     # "channel_{matchId}" — Agora channel name
      └── createdAt: number       # Unix timestamp (ms)
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase project API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth domain |
| `EXPO_PUBLIC_FIREBASE_DATABASE_URL` | ✅ | Realtime Database URL |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | FCM sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `EXPO_PUBLIC_AGORA_APP_ID` | ✅ | Agora project App ID |
| `EXPO_PUBLIC_AGORA_APP_CERTIFICATE` | ⬜ | Agora App Certificate (production token signing) |

> All variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the React Native bundle at runtime.

---

## 🏗️ Building for Production

PrinParty uses [EAS Build](https://docs.expo.dev/build/introduction/) for cloud builds.

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build for iOS (TestFlight / App Store)
eas build --platform ios --profile production

# Build for Android (Play Store)
eas build --platform android --profile production

# Internal distribution build (QR code install)
eas build --platform all --profile preview
```

---

## 🛡️ Duplicate-Call Safeguards

| Location | Prevents | Mechanism |
|----------|----------|-----------|
| `matchingService.ts` | Concurrent double-match | `runTransaction` atomic update |
| `WaitingScreen.tsx` | Match callback fired twice | `matchFoundRef` boolean guard |
| `WaitingScreen.tsx` | `leaveQueue` after match found | `cancelledRef` boolean guard |
| `VideoCallScreen.tsx` | End-call triggered by button AND `onUserOffline` | `callEndedRef` boolean guard |
| `agoraService.ts` | Agora engine re-initialized | `if (!engine)` idempotent pattern |

---

## 📋 Development Commands

```bash
# Start Expo dev server (localhost)
npm start

# Start with tunnel (for physical devices on different network)
npm run start:tunnel

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Type-check (workaround for @expo/cli symlink issue)
node node_modules/typescript/lib/tsc.js --noEmit
```

---

## 🎨 Design System

The app uses a mint-green theme inspired by calm, friendly UX:

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#4ECDC4` | Buttons, loaders, active states |
| `primaryLight` | `#E8F8F5` | Background, splash screen |
| `primaryDark` | `#2DB5AB` | Button pressed state |
| `danger` | `#FF4757` | End call button |
| `darkBg` | `#0F0F1A` | Video call screen background |

Full design tokens (Typography, Spacing, Radius, Shadows) live in `src/constants/colors.ts`.

---

## 📄 License

This project is private and not licensed for public distribution.

---

<div align="center">
  Built with Expo · Firebase · Agora.io
</div>
