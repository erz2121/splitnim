# SplitNIM Submission Pack

## Submission description — 166 words

SplitNIM is a Nimiq Pay Mini App that makes group expenses simple: one person creates a shared bill, divides the total equally or with custom amounts, and sends every participant a personal payment link or QR code. Each participant sees only their exact share and approves the NIM payment securely inside Nimiq Pay. The shared settlement page updates as payments arrive, so everyone can see who has paid and how much has been collected.

SplitNIM is designed for friends, families, travel groups, event organizers, roommates, and small teams that need a clear way to settle shared costs without copying wallet addresses, calculating amounts manually, or exchanging payment screenshots.

Nimiq is central to the experience. SplitNIM uses the Nimiq Mini App SDK for wallet selection and NIM payments, attaches a unique reference to every transfer, and independently verifies the transaction on-chain before marking a share as paid. It checks the recipient, exact amount, confirmation, execution result, and payment reference while private keys always remain inside Nimiq Pay.

## Short description

Split a shared bill, send personal payment links, and track every verified NIM payment together.

## Suggested category

Food & Dining / Productivity

## Required links

- Live Mini App: https://splitnim-pay.dedyerzz.chatgpt.site
- Public repository: https://github.com/erz2121/splitnim
- License: MIT

## Demo video plan — 55 seconds

Record vertically inside Nimiq Pay on BlueStacks. Use a fresh testnet bill so the complete journey is visible.

| Time | Screen recording | Optional caption |
|---:|---|---|
| 0–4s | Open the SplitNIM home screen | `Split a bill. Settle in NIM.` |
| 4–12s | Tap **Create a split** and enter `Dinner with friends`, `250 NIM`, Leo and Arga | `Create one shared bill` |
| 12–17s | Select **Use my wallet**, keep **Equal**, and create the links | `Equal or custom shares` |
| 17–23s | Show the live split page and Leo's personal link/QR controls | `One personal link per person` |
| 23–28s | Open Leo's payment link | `The exact share is filled automatically` |
| 28–38s | Tap **Pay 125 NIM** and approve it in the native Nimiq Pay dialog | `Approve securely in Nimiq Pay` |
| 38–46s | Show the confirmed transaction | `Confirmed on Nimiq testnet` |
| 46–52s | Return to SplitNIM and show **1/2 paid**, **50%**, and Leo marked **Paid** | `Verified on-chain` |
| 52–55s | End on the logo and live URL | `One bill. Everyone settles.` |

### Recording notes

- Record at 720×1280 or 1080×1920.
- Keep the video between 45 and 60 seconds.
- Use hard cuts or very short transitions so the payment flow remains credible.
- Do not hide the native Nimiq Pay confirmation screen.
- Show **Testnet** clearly at least once so viewers know no real funds are being used.
- Do not show a recovery phrase, private key, password, or unrelated notification.
- Background music is optional; keep interface sounds and taps audible if possible.
- Use only short captions—no voice-over is required.

## Screenshot checklist

Export clean PNG or JPG screenshots without the BlueStacks desktop frame when possible.

1. **Home** — logo, headline, Create button, example bill, and How it works.
2. **Create split** — bill name, total, Equal/Custom control, wallet address, and participants.
3. **Live settlement** — total, recipient, progress, participant list, and sharing controls.
4. **Personal payment** — participant name, exact share, and Pay button.
5. **Payment success** — Share settled, verified status, and updated progress.
6. **Nimiq transaction** — Confirmed status, amount, network, and recipient.

## Social post

I built **SplitNIM** for the Nimiq Mini Apps Competition.

Create one shared bill, divide it equally or with custom amounts, send everyone a personal link, and watch each NIM payment settle in real time. Every payment is verified on-chain before a share is marked as paid.

Try it: https://splitnim-pay.dedyerzz.chatgpt.site

Code: https://github.com/erz2121/splitnim

#Nimiq #NimiqPay #MiniApps #Web3

## Final submission checklist

- [x] Functional public Mini App
- [x] Nimiq Pay integration
- [x] NIM testnet payment tested successfully
- [x] Server-side on-chain verification
- [x] Public GitHub repository
- [x] MIT license
- [x] Written description under 250 words
- [ ] Record and upload the demo video
- [ ] Capture final screenshots
- [ ] Publish the promotional post and add its link
- [ ] Add the lead name or pseudonym, GitHub profile, and Nimiq payout wallet in the submission portal
- [ ] Submit through the official Registration Dashboard before the Cycle II deadline
