# PLXYGROUND iOS app (v2)

The rebuilt PLXYGROUND app: Expo SDK 57, TypeScript, Expo Router. It talks to the API in [`../backend`](../backend) (live at `https://plxyground.vercel.app`).

Full plan: see the "PLXYGROUND iOS Rebuild Plan" doc. This folder replaces [`../frontend`](../frontend) once it reaches feature parity.

## Run it

```bash
cd mobile
npm install
npx expo start          # press i for the iOS Simulator (macOS), or w for a browser preview
```

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
| `app/(app)` | Signed-in tabs: Feed, Opportunities, Profile, plus opportunity detail |
| `src/api` | Typed API client and endpoint functions |
| `src/auth` | Session store; token kept in the iOS Keychain via SecureStore |
| `src/components` | Shared UI: buttons, fields, cards, states |
| `src/theme` | Colour, spacing and type tokens |
| `src/lib` | Validation rules that mirror the API |

## Building for iPhone

Uses EAS Build (cloud, no Mac needed). Internal TestFlight builds need an Apple Developer Program membership; until then use `eas build --profile development` for the simulator.
