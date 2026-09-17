"use client";

import { init } from "@nimiq/mini-app-sdk";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Loader2,
  Mail,
  MessageCircle,
  Minus,
  Moon,
  MoreHorizontal,
  Plus,
  QrCode,
  ReceiptText,
  Share2,
  Send,
  Sparkles,
  Sun,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

type Participant = {
  id: string;
  name: string;
  amountLuna: number;
  status: "pending" | "paid";
  txHash: string | null;
  paidAt: string | null;
};

type Bill = {
  id: string;
  title: string;
  totalLuna: number;
  recipientAddress: string;
  createdAt: string;
  participants: Participant[];
};

type DraftPerson = { id: string; name: string; amount: string };
type Screen = "home" | "create" | "bill";

const LUNA_PER_NIM = 100_000;
const newDraftPerson = (index: number): DraftPerson => ({
  id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
  name: "",
  amount: "",
});

function nim(luna: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5,
  }).format(luna / LUNA_PER_NIM);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function shortenAddress(address: string) {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [bill, setBill] = useState<Bill | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [qrPerson, setQrPerson] = useState<Participant | null>(null);
  const [sharePerson, setSharePerson] = useState<Participant | null>(null);
  const [showExtraShareOptions, setShowExtraShareOptions] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [total, setTotal] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [consent, setConsent] = useState(false);
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [people, setPeople] = useState<DraftPerson[]>([newDraftPerson(0)]);

  useEffect(() => {
    const saved = window.localStorage.getItem("splitnim-theme");
    const nextTheme = saved === "dark" || saved === "light"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("splitnim-theme", nextTheme);
  }

  const loadBill = useCallback(async (
    id: string,
    personId?: string | null,
    options: { background?: boolean } = {},
  ) => {
    const background = options.background === true;
    if (!background) {
      setLoading(true);
      setError("");
    }
    try {
      const response = await fetch(`/api/bills/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as { bill?: Bill; error?: string };
      if (!response.ok || !data.bill) throw new Error(data.error || "Split not found.");
      setBill(data.bill);
      setSelectedPersonId(personId || null);
      setScreen("bill");
    } catch (value) {
      if (!background) {
        setError(value instanceof Error ? value.message : "Could not load this split.");
        setScreen("home");
      }
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billId = params.get("bill");
    if (billId) void loadBill(billId, params.get("person"));
    else setLoading(false);
  }, [loadBill]);

  useEffect(() => {
    if (screen !== "bill" || !bill) return;
    const interval = window.setInterval(
      () => void loadBill(bill.id, selectedPersonId, { background: true }),
      7_000,
    );
    return () => window.clearInterval(interval);
  }, [bill?.id, loadBill, screen, selectedPersonId]);

  const activePerson = useMemo(
    () => bill?.participants.find((person) => person.id === selectedPersonId) || null,
    [bill, selectedPersonId],
  );

  const paidCount = bill?.participants.filter((person) => person.status === "paid").length || 0;
  const paidLuna =
    bill?.participants
      .filter((person) => person.status === "paid")
      .reduce((sum, person) => sum + person.amountLuna, 0) || 0;

  function navigate(next: Screen) {
    setError("");
    setNotice("");
    setScreen(next);
    if (next === "home") {
      setBill(null);
      setSelectedPersonId(null);
      window.history.pushState({}, "", window.location.pathname);
    }
  }

  function updatePerson(id: string, field: "name" | "amount", value: string) {
    setPeople((current) =>
      current.map((person) => (person.id === id ? { ...person, [field]: value } : person)),
    );
  }

  async function useWalletAddress() {
    setWalletLoading(true);
    setError("");
    try {
      const nimiq = await init({ timeout: 8_000 });
      const accounts = await nimiq.listAccounts();
      if (!Array.isArray(accounts) || !accounts.length) {
        throw new Error("No Nimiq account was selected.");
      }
      setRecipientAddress(accounts[0]);
      setNotice("Receiving wallet selected.");
      window.setTimeout(() => setNotice(""), 2200);
    } catch (value) {
      const message = value instanceof Error ? value.message : "Could not access your wallet.";
      setError(
        /timeout|provider|injected/i.test(message)
          ? "Open SplitNIM inside Nimiq Pay to select your receiving wallet."
          : message,
      );
    } finally {
      setWalletLoading(false);
    }
  }

  async function createSplit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const totalNim = Number(total);
    const namedPeople = people.filter((person) => person.name.trim());
    if (!title.trim() || !recipientAddress.trim() || !Number.isFinite(totalNim) || totalNim <= 0) {
      setError("Add a title, total amount, and your receiving Nimiq address.");
      return;
    }
    if (namedPeople.length < 1) {
      setError("Add at least one person to receive a payment link.");
      return;
    }
    if (!consent) {
      setError("Please confirm the data notice before creating the split.");
      return;
    }

    const totalLuna = Math.round(totalNim * LUNA_PER_NIM);
    let amounts: number[];
    if (splitMode === "equal") {
      const base = Math.floor(totalLuna / namedPeople.length);
      amounts = namedPeople.map((_, index) => base + (index < totalLuna % namedPeople.length ? 1 : 0));
    } else {
      amounts = namedPeople.map((person) => Math.round(Number(person.amount) * LUNA_PER_NIM));
      if (amounts.some((amount) => !Number.isFinite(amount) || amount <= 0)) {
        setError("Enter a valid custom amount for every person.");
        return;
      }
      if (amounts.reduce((sum, amount) => sum + amount, 0) !== totalLuna) {
        setError("Custom shares must add up exactly to the total.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          totalLuna,
          recipientAddress: recipientAddress.trim(),
          participants: namedPeople.map((person, index) => ({
            name: person.name.trim(),
            amountLuna: amounts[index],
          })),
        }),
      });
      const data = (await response.json()) as { bill?: Bill; error?: string };
      if (!response.ok || !data.bill) throw new Error(data.error || "Could not create the split.");
      setBill(data.bill);
      setSelectedPersonId(null);
      setScreen("bill");
      window.history.pushState({}, "", `?bill=${encodeURIComponent(data.bill.id)}`);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not create the split.");
    } finally {
      setSubmitting(false);
    }
  }

  function participantUrl(person: Participant) {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("bill", bill!.id);
    url.searchParams.set("person", person.id);
    return url.toString();
  }

  async function copyLink(person: Participant) {
    const url = participantUrl(person);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setNotice(`${person.name}’s payment link copied.`);
    window.setTimeout(() => setNotice(""), 2500);
  }

  async function shareMore(person: Participant) {
    const url = participantUrl(person);
    const shareData = {
      title: `${bill!.title} · SplitNIM`,
      text: `${person.name}, your share is ${nim(person.amountLuna)} NIM.`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setNotice(`${person.name}’s payment link shared.`);
        window.setTimeout(() => setNotice(""), 2500);
        setSharePerson(null);
        return;
      } catch (value) {
        if (value instanceof DOMException && value.name === "AbortError") return;
      }
    }
    setShowExtraShareOptions(true);
  }

  function shareMessage(person: Participant) {
    return `${person.name}, your share for ${bill!.title} is ${nim(person.amountLuna)} NIM.`;
  }

  function shareHref(service: "whatsapp" | "telegram" | "email" | "x", person: Participant) {
    const url = participantUrl(person);
    const message = shareMessage(person);
    if (service === "whatsapp") return `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`;
    if (service === "telegram") return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
    if (service === "email") return `mailto:?subject=${encodeURIComponent(`${bill!.title} · SplitNIM`)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
  }

  function extraShareHref(service: "facebook" | "line" | "sms", person: Participant) {
    const url = participantUrl(person);
    const message = `${shareMessage(person)}\n${url}`;
    if (service === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (service === "line") return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
    return `sms:?body=${encodeURIComponent(message)}`;
  }

  async function payShare(person: Participant) {
    if (!bill || person.status === "paid") return;
    setPayingId(person.id);
    setError("");
    setNotice("");
    try {
      const nimiq = await init({ timeout: 8_000 });
      const result = await nimiq.sendBasicTransactionWithData({
        recipient: bill.recipientAddress,
        value: person.amountLuna,
        data: `SplitNIM:${bill.id}:${person.id}`,
      });
      if (typeof result !== "string") {
        const message =
          typeof result === "object" && result && "error" in result
            ? String((result as { error?: { message?: string } }).error?.message || "Payment failed.")
            : "Payment failed.";
        throw new Error(message);
      }
      let network: "testnet" | "mainnet" | undefined;
      try {
        const info = await nimiq.request<{ data?: { networkId?: number }; networkId?: number }>({
          method: "getTransactionByHash",
          params: [result],
        });
        const networkId = info?.data?.networkId ?? info?.networkId;
        if (networkId === 5) network = "testnet";
        else if (typeof networkId === "number") network = "mainnet";
      } catch {
        // The server checks both Nimiq networks when the wallet cannot provide a hint.
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await fetch(`/api/bills/${encodeURIComponent(bill.id)}/pay`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ participantId: person.id, txHash: result, network }),
        });
        const data = (await response.json()) as { bill?: Bill; error?: string; pending?: boolean };
        if (response.status === 202 && data.pending) {
          setNotice("Payment sent. Waiting for blockchain confirmation…");
          await new Promise((resolve) => window.setTimeout(resolve, 2_000));
          continue;
        }
        if (!response.ok || !data.bill) throw new Error(data.error || "Payment sent, but status could not update.");
        setBill(data.bill);
        setNotice("Payment verified on-chain. Your share is settled!");
        return;
      }
      throw new Error("Payment was sent, but confirmation is taking longer than expected. Reopen this link shortly.");
    } catch (value) {
      const message = value instanceof Error ? value.message : "Payment could not be completed.";
      if (/timeout|provider|injected/i.test(message)) {
        const target = `${window.location.host}${window.location.pathname}${window.location.search}`;
        window.location.href = `https://nimpay.app/miniapps/open/${target}`;
        return;
      }
      setError(message);
    } finally {
      setPayingId(null);
    }
  }

  useEffect(() => {
    const modelContext = (document as Document & {
      modelContext?: { registerTool?: (tool: unknown, options?: unknown) => void | Promise<void> };
    }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      modelContext.registerTool(
        {
          name: "start_split_creation",
          title: "Start a new split",
          description: "Open the SplitNIM form for creating a shared NIM bill.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: () => {
            navigate("create");
            return { screen: "create" };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  if (loading) {
    return (
      <main className="app-shell grid place-items-center">
        <div className="loading-mark" aria-label="Loading SplitNIM">
          <span />
          <span />
          <span />
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="phone-stage">
        <header className="topbar">
          <button className="brand" onClick={() => navigate("home")} aria-label="Go to SplitNIM home">
            <span className="brand-mark" aria-hidden="true">
              <img src="/favicon-new.svg" alt="" />
            </span>
            <span>SplitNIM</span>
          </button>
          <div className="topbar-actions">
            <span className="network-pill"><i /> Nimiq Pay</span>
            <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`${theme === "dark" ? "Light" : "Dark"} mode`}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {screen === "home" && (
          <div className="screen home-screen">
            <div className="eyebrow"><Sparkles size={15} /> Simple group payments</div>
            <h1>One bill.<br /><span>Everyone settles.</span></h1>
            <p className="lead">Create a shared bill, send each person their link, and watch payments settle in NIM.</p>
            <button className="primary hero-action" onClick={() => navigate("create")}>
              Create a split <ArrowRight size={20} />
            </button>
            <div className="transfer-visual" aria-label="SplitNIM payment flow">
              <div className="transfer-orbit transfer-orbit-one" />
              <div className="transfer-orbit transfer-orbit-two" />
              <div className="transfer-node split-node">
                <img src="/favicon-new.svg" alt="" />
              </div>
              <div className="transfer-route" aria-hidden="true">
                <i /><i /><i />
                <span><Send size={22} strokeWidth={2.4} /></span>
                <i /><i /><i />
              </div>
              <div className="transfer-node settled-node">
                <Check size={27} strokeWidth={2.8} />
              </div>
              <div className="transfer-caption">
                <b>Split. Share. Settled.</b>
                <span>One simple payment flow</span>
              </div>
            </div>
            <section className="how-it-works" aria-labelledby="how-it-works-title">
              <h2 id="how-it-works-title">How it works</h2>
              <ol>
                <li>
                  <span className="work-icon"><ReceiptText size={21} strokeWidth={2.2} /></span>
                  <div><b>Create</b><small>Split the total</small></div>
                </li>
                <li>
                  <span className="work-icon"><Share2 size={21} strokeWidth={2.2} /></span>
                  <div><b>Share</b><small>Send personal links</small></div>
                </li>
                <li>
                  <span className="work-icon"><CheckCircle2 size={21} strokeWidth={2.2} /></span>
                  <div><b>Settle</b><small>Pay in Nimiq Pay</small></div>
                </li>
              </ol>
            </section>
          </div>
        )}

        {screen === "create" && (
          <form className="screen form-screen" onSubmit={createSplit}>
            <button type="button" className="back-link" onClick={() => navigate("home")}><ArrowLeft size={18} /> Back</button>
            <div className="section-heading">
              <span>NEW SPLIT</span><h1>What are we splitting?</h1>
              <p>Set the total, add everyone, and choose how to divide it.</p>
            </div>
            <label className="field">
              <span>Bill name</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Dinner, trip, studio rent…" maxLength={60} />
            </label>
            <div className="two-fields">
              <label className="field amount-field">
                <span>Total</span>
                <div><input inputMode="decimal" value={total} onChange={(event) => setTotal(event.target.value)} placeholder="0" /><b>NIM</b></div>
              </label>
              <label className="field">
                <span>Split method</span>
                <div className="segmented">
                  <button type="button" className={splitMode === "equal" ? "active" : ""} onClick={() => setSplitMode("equal")}>Equal</button>
                  <button type="button" className={splitMode === "custom" ? "active" : ""} onClick={() => setSplitMode("custom")}>Custom</button>
                </div>
              </label>
            </div>
            <label className="field">
              <span>Your receiving Nimiq address</span>
              <input value={recipientAddress} onChange={(event) => setRecipientAddress(event.target.value.toUpperCase())} placeholder="NQ…" autoCapitalize="characters" />
              <div className="wallet-field-foot">
                <small>Each share is paid directly to this address.</small>
                <button type="button" onClick={() => void useWalletAddress()} disabled={walletLoading}>
                  {walletLoading ? <Loader2 className="spin" size={14} /> : <WalletCards size={14} />}
                  Use my wallet
                </button>
              </div>
            </label>
            <div className="participants-editor">
              <div className="editor-title"><span>People</span><b>{people.length}</b></div>
              {people.map((person, index) => (
                <div className="person-input-row" key={person.id}>
                  <span className="person-number">{String(index + 1).padStart(2, "0")}</span>
                  <input value={person.name} onChange={(event) => updatePerson(person.id, "name", event.target.value)} placeholder="Name" maxLength={30} />
                  {splitMode === "custom" && (
                    <div className="mini-amount"><input inputMode="decimal" value={person.amount} onChange={(event) => updatePerson(person.id, "amount", event.target.value)} placeholder="0" /><b>NIM</b></div>
                  )}
                  {people.length > 1 && <button type="button" aria-label={`Remove person ${index + 1}`} onClick={() => setPeople((current) => current.filter((item) => item.id !== person.id))}><Minus size={17} /></button>}
                </div>
              ))}
              {people.length < 12 && (
                <button type="button" className="add-person" onClick={() => setPeople((current) => [...current, newDraftPerson(current.length)])}><Plus size={17} /> Add person</button>
              )}
            </div>
            {notice && <div className="success-toast" role="status"><Check size={17} /> {notice}</div>}
            <label className="consent-row" htmlFor="data-consent">
              <Checkbox id="data-consent" checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} />
              <span>
                I understand that the bill name, participant names, receiving address, and payment transaction hashes are stored to run this split. SplitNIM never receives private keys.
              </span>
            </label>
            {error && <div className="error-banner" role="alert">{error}</div>}
            <button className="primary submit-button" disabled={submitting}>
              {submitting ? <><Loader2 className="spin" size={19} /> Creating…</> : <>Create payment links <ArrowRight size={19} /></>}
            </button>
          </form>
        )}

        {screen === "bill" && bill && (
          <div className="screen bill-screen">
            <button className="back-link" onClick={() => navigate("home")}><ArrowLeft size={18} /> New split</button>
            <div className="bill-hero">
              <span className="receipt-label">{activePerson ? "YOUR SHARE" : "LIVE SPLIT"}</span>
              <h1>{bill.title}</h1>
              {activePerson ? (
                <div className="share-total"><strong>{nim(activePerson.amountLuna)}</strong><span>NIM</span></div>
              ) : (
                <div className="share-total"><strong>{nim(bill.totalLuna)}</strong><span>NIM total</span></div>
              )}
              <div className="recipient-chip"><WalletCards size={15} /> To {shortenAddress(bill.recipientAddress)}</div>
            </div>
            {activePerson && activePerson.status === "pending" && (
              <>
                <button className="primary pay-button" onClick={() => void payShare(activePerson)} disabled={payingId === activePerson.id}>
                  {payingId === activePerson.id ? <><Loader2 className="spin" size={20} /> Waiting for approval…</> : <>Pay {nim(activePerson.amountLuna)} NIM <ChevronRight size={21} /></>}
                </button>
                <p className="payment-note">Paying stores the transaction hash so everyone can see that this share is settled. Your private keys always stay in Nimiq Pay.</p>
              </>
            )}
            {activePerson?.status === "paid" && (
              <div className="paid-banner"><CheckCircle2 size={25} /><div><b>Share settled</b><span>Thanks, {activePerson.name}!</span></div></div>
            )}
            {notice && <div className="success-toast" role="status"><Check size={17} /> {notice}</div>}
            {error && <div className="error-banner" role="alert">{error}</div>}
            <div className="settlement-card">
              <div className="settlement-head">
                <div><span>SETTLEMENT</span><strong>{paidCount}/{bill.participants.length} paid</strong></div>
                <div className="round-progress" style={{ "--progress": `${(paidCount / bill.participants.length) * 360}deg` } as React.CSSProperties}><span>{Math.round((paidCount / bill.participants.length) * 100)}%</span></div>
              </div>
              <div className="progress-track"><i style={{ width: `${(paidCount / bill.participants.length) * 100}%` }} /></div>
              <div className="settled-amount"><span>Collected</span><b>{nim(paidLuna)} / {nim(bill.totalLuna)} NIM</b></div>
            </div>
            <div className="participant-list">
              <div className="list-title"><span>People</span>{!activePerson && <small>Share a personal payment link</small>}</div>
              {bill.participants.map((person) => (
                <div className={`participant-row ${person.id === activePerson?.id ? "selected" : ""}`} key={person.id}>
                  <span className={`avatar ${person.status === "paid" ? "done" : ""}`}>{person.status === "paid" ? <Check size={17} /> : initials(person.name)}</span>
                  <div className="participant-name"><b>{person.name}</b><span>{person.status === "paid" ? "Paid" : "Waiting"}</span></div>
                  <strong>{nim(person.amountLuna)} NIM</strong>
                  {!activePerson && person.status === "pending" && (
                    <div className="row-actions">
                      <button title="Copy link" aria-label={`Copy ${person.name}'s link`} onClick={() => void copyLink(person)}><Copy size={16} /></button>
                      <button title="Show QR code" aria-label={`Show ${person.name}'s QR code`} onClick={() => setQrPerson(person)}><QrCode size={16} /></button>
                      <button title="Share link" aria-label={`Share ${person.name}'s link`} onClick={() => setSharePerson(person)}><Share2 size={16} /></button>
                    </div>
                  )}
                  {!activePerson && person.status === "paid" && person.txHash && <span className="tx-check" title={person.txHash}><CheckCircle2 size={18} /></span>}
                </div>
              ))}
            </div>
            {!activePerson && (
              <div className="share-hint"><QrCode size={20} /><div><b>Send each person their own link</b><span>The amount and payment reference are filled automatically.</span></div></div>
            )}
          </div>
        )}
      </section>
      <footer>Built for fast, direct payments on Nimiq.</footer>
      <Dialog open={Boolean(qrPerson)} onOpenChange={(open) => !open && setQrPerson(null)}>
        <DialogContent className="qr-dialog">
          <DialogHeader>
            <DialogTitle>{qrPerson?.name}&apos;s payment QR</DialogTitle>
            <DialogDescription>
              Scan inside Nimiq Pay to open the exact share and amount.
            </DialogDescription>
          </DialogHeader>
          {qrPerson && bill && (
            <>
              <div className="qr-frame">
                <QRCodeSVG
                  value={participantUrl(qrPerson)}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#0a1738"
                  level="M"
                  marginSize={1}
                />
              </div>
              <div className="qr-person">
                <span>{qrPerson.name}</span>
                <strong>{nim(qrPerson.amountLuna)} NIM</strong>
              </div>
              <button className="primary" onClick={() => void copyLink(qrPerson)}>
                <Copy size={17} /> Copy payment link
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(sharePerson)} onOpenChange={(open) => {
        if (!open) {
          setSharePerson(null);
          setShowExtraShareOptions(false);
        }
      }}>
        <DialogContent className="share-dialog">
          <DialogHeader>
            <DialogTitle>Share {sharePerson?.name}&apos;s payment link</DialogTitle>
            <DialogDescription>
              Send the personal link through the app you prefer.
            </DialogDescription>
          </DialogHeader>
          {sharePerson && bill && (
            <div className="share-options">
              <a href={shareHref("whatsapp", sharePerson)} target="_blank" rel="noreferrer"><MessageCircle size={20} /><span>WhatsApp</span></a>
              <a href={shareHref("telegram", sharePerson)} target="_blank" rel="noreferrer"><Send size={20} /><span>Telegram</span></a>
              <a href={shareHref("email", sharePerson)}><Mail size={20} /><span>Email</span></a>
              <a href={shareHref("x", sharePerson)} target="_blank" rel="noreferrer"><span className="x-mark">X</span><span>X</span></a>
              <button onClick={() => void copyLink(sharePerson)}><Copy size={20} /><span>Copy link</span></button>
              <button onClick={() => void shareMore(sharePerson)}><MoreHorizontal size={20} /><span>More apps</span></button>
              {showExtraShareOptions && (
                <>
                  <p className="share-fallback-note">The device share menu is unavailable here. Choose another app:</p>
                  <a href={extraShareHref("facebook", sharePerson)} target="_blank" rel="noreferrer"><span className="share-brand">f</span><span>Facebook</span></a>
                  <a href={extraShareHref("line", sharePerson)} target="_blank" rel="noreferrer"><span className="share-brand line">LINE</span><span>LINE</span></a>
                  <a href={extraShareHref("sms", sharePerson)}><MessageCircle size={20} /><span>SMS</span></a>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
