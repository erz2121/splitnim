# SplitNIM

**Split the bill. Pay your share. Done.**

## Live app

Open SplitNIM: **https://splitnim-pay.dedyerzz.chatgpt.site**

SplitNIM is a mobile-first Nimiq Pay Mini App for shared expenses. One person creates a bill, chooses equal or custom shares, and sends every participant a personal payment link or QR code. Each participant approves their NIM payment inside Nimiq Pay, and the settlement screen updates for the whole group.

## Why it exists

Group payments often end with copied wallet addresses, manual calculations, and screenshots used as proof. SplitNIM turns that into one short flow:

1. Create a bill.
2. Add participants and divide the total.
3. Share each participant's personal link or QR code.
4. Pay the exact share through Nimiq Pay.
5. Follow settlement progress in one place.

## Nimiq integration

- Uses `@nimiq/mini-app-sdk`.
- Lets the creator select a receiving account with `listAccounts()`.
- Sends NIM with an attached split reference through `sendBasicTransactionWithData()`.
- Uses Luna integers for all calculations (`1 NIM = 100,000 Luna`) to avoid floating-point payment errors.
- Private keys never leave Nimiq Pay.

## Features

- Equal or custom bill splitting for 2–12 people
- Personal payment links and QR codes
- Live shared settlement status
- Transaction-hash receipts
- Persistent bills and participants with Cloudflare D1
- Responsive interface for Nimiq Pay's mobile WebView
- Clear error, loading, empty, and paid states

## Local development

Requirements: Node.js 22.13+ and pnpm.

```bash
pnpm install
pnpm run db:generate
pnpm run build
```

Apply the generated D1 migration to your local database, then run the development server. Open the local URL from Nimiq Pay to test wallet-provider requests.

## Data and privacy

SplitNIM stores the bill name, participant names, receiving address, participant shares, payment status, and transaction hashes so the shared settlement page can work. It does not request or store wallet private keys. Wallet access and every payment require explicit confirmation in Nimiq Pay.

## License

[MIT](./LICENSE)
