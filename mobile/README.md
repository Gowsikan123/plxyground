# PLXYGROUND iOS app (v2)

The rebuilt PLXYGROUND app: Expo SDK 57, TypeScript, Expo Router. It talks to the API in [`../backend`](../backend) (live at `https://plxyground.vercel.app`).

Full plan: see the "PLXYGROUND iOS Rebuild Plan" doc. This folder replaces [`../frontend`](../frontend) once it reaches feature parity.

## Run it

```bash
cd mobile
npm install
npx expo start          # press i for the iOS Simulator (macOS), or w for a browser preview
```

**On your own iPhone, free:** install **Expo Go** from the App Store, make sure the phone and computer are on the same Wi-Fi, run `npx expo start` and scan the QR code with the iPhone camera. No Apple Developer account needed. Or open the browser preview at [plxyground-beta.vercel.app](https://plxyground-beta.vercel.app).

Point it at a local API with `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:3011 npx expo start`.

## Checks

```bash
npm run typecheck       # TypeScript, strict mode
npm test                # Jest (jest-expo)
npm run doctor          # verifies package versions match the Expo SDK
```

CI runs all three plus an iOS bundle export on every push.

## Structure

| Path | What it holds |
| --- | --- |
| `app/(auth)` | Welcome, log in, sign up (creator or brand) |
| `app/(app)` | Signed-in tabs: Feed, Opportunities, Applications (creators) or Listings (brands), Inbox, Profile; plus detail, chat, new post, report, blocked accounts and delete-account screens |
| `app/legal` | Terms of use and privacy notice, readable signed in or out |
| `src/api` | Typed API client and endpoint functions |
| `src/auth` | Session store; token kept in the iOS Keychain via SecureStore |
| `src/components` | Shared UI: buttons, fields, cards, states |
| `src/theme` | Colour, spacing and type tokens |
| `src/lib` | Validation rules that mirror the API, photo upload, paging, chat and report helpers, legal text |
| `scripts/make-icons.py` | Regenerates the app icon, splash and favicon (`python3 scripts/make-icons.py assets`) |

## Features

- Creators: photo posts (reviewed before they go live), browse and filter opportunities, apply, track applications
- Brands: post opportunities, review applicants, accept or decline, open and close listings
- Everyone: messaging, in-app notifications with an unread badge, profile photo or logo
- Safety: report posts, opportunities, messages and accounts; block; delete account in the app
- Polish: infinite scrolling, loading placeholders, pull to refresh, crash screen with retry, VoiceOver labels and 44pt touch targets

## Building for iPhone

Uses EAS Build (cloud, no Mac needed; the free tier is enough). TestFlight and App Store builds need the paid Apple Developer Program, so that waits until release. Until then use Expo Go (above) or `eas build --profile development` for the iOS Simulator.
