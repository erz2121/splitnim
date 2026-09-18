# SplitNIM

**One bill. Everyone settles.**

SplitNIM is a mobile-first Nimiq Pay Mini App for splitting shared expenses and settling every share directly in NIM. A bill creator divides a total equally or with custom amounts, then sends each participant a personal payment link or QR code. Participants approve their exact payment in Nimiq Pay while the group follows settlement progress from one shared page.

[Open SplitNIM](https://splitnim-pay.dedyerzz.chatgpt.site)

## The problem

Splitting a restaurant bill, trip, event, or shared purchase often means calculating every share manually, copying a wallet address, and sending screenshots as proof. SplitNIM replaces that fragmented process with one simple flow:

1. Create a shared bill.
2. Add 1–12 participants.
3. Divide the total equally or enter custom shares.
4. Share each participant's personal link or QR code.
5. Pay the exact share in Nimiq Pay.
6. Follow verified settlement progress together.

## Nimiq integration

NIM payments are the core of SplitNIM, not an optional add-on.

- Connects to Nimiq Pay through `@nimiq/mini-app-sdk`.
- Selects the creator's receiving account with `listAccounts()`.
- Requests payments with `sendBasicTransactionWithData()`.
- Adds a unique `SplitNIM:<bill>:<participant>` on-chain reference.
- Uses Luna integers for calculations (`1 NIM = 100,000 Luna`).
- Verifies every submitted transaction against the Nimiq blockchain before marking a share as paid.
- Checks the transaction hash, confirmation, execution result, recipient, exact amount, and payment reference.
- Supports both Nimiq testnet and mainnet verification.
- Never receives or stores private keys; approvals remain inside Nimiq Pay.

## Features

- Equal and custom bill splitting
- Personal payment links for every participant
- QR codes and sharing through WhatsApp, Telegram, email, X, or the device share sheet
- Live shared settlement progress
- On-chain payment verification and duplicate transaction protection
- Persistent bills and participant status with Cloudflare D1
- Responsive light and dark modes
- Clear loading, confirmation, error, and paid states

## Technology

- React 19 and Vinext
- TypeScript
- Nimiq Mini App SDK
- Cloudflare Workers and D1
- Nimiq JSON-RPC verification

## Local development

Requirements: Node.js 22.13+ and pnpm.

```bash
pnpm install
pnpm run db:generate
pnpm run build
```

Apply the generated D1 migration to a local database, start the development server, and open its HTTPS URL inside Nimiq Pay to access the injected wallet provider.

## Data and privacy

SplitNIM clearly asks for consent before creating a split. It stores the bill name, participant names, receiving address, participant shares, payment status, and transaction hashes so the shared settlement page can function. It does not request or store private keys. Wallet access and every payment require explicit confirmation in Nimiq Pay.

## Competition

Built for Cycle II of the Nimiq Mini Apps Competition. Submission materials and the demo recording plan are available in [docs/SUBMISSION.md](./docs/SUBMISSION.md).

## License

[MIT](./LICENSE)
