/* ============================================================
   Cloudflare Worker behind the static site (see wrangler.jsonc).

   Every request is served from the static assets first; only paths
   with no matching file reach this script. It owns two of them, both
   of which post into Slack's #website-contact as the "Website contact"
   app, and answers everything else with the site's own 404 page:

     POST /api/demo   the contact form on index.html — name, email,
                      message (script.js posts it as FormData)
     POST /api/cal    Cal.com's booking webhook, so a booked demo lands
                      in the same channel

   Secrets (set with `npx wrangler secret put <NAME>`, never committed):
     SLACK_BOT_TOKEN     the app's bot token (xoxb-…)
     CAL_WEBHOOK_SECRET  the secret entered when creating the Cal.com
                         webhook; requests are rejected unless their
                         signature matches. Optional while testing.
   Vars (wrangler.jsonc): SLACK_CHANNEL_ID.
   ============================================================ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/demo') return handleDemo(request, env, url);
    if (url.pathname === '/api/cal') return handleCal(request, env);
    return notFound(request, env);
  },
};

// ---- everything else --------------------------------------------------------
// Static files are served before this script runs, so a GET that lands here
// is a path with nothing behind it: a typo, a stale link, a guessed route.
// Answer with 404.html, fetched from the assets binding (wrangler.jsonc:
// assets.binding), status kept honest. The plain-text fallback covers a
// missing binding (local dev without one) and a failed fetch, so this can
// never itself be the reason a request ends in a 500.
async function notFound(request, env) {
  if (env.ASSETS && (request.method === 'GET' || request.method === 'HEAD')) {
    try {
      const page = await env.ASSETS.fetch(new Request(new URL('/404.html', request.url)));
      if (page.ok) {
        return new Response(request.method === 'HEAD' ? null : page.body, {
          status: 404,
          headers: { 'content-type': page.headers.get('content-type') || 'text/html; charset=utf-8' },
        });
      }
    } catch (err) { /* fall through to the plain response */ }
  }
  return new Response('Not found', { status: 404 });
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

// ---- the demo-request form ------------------------------------------------

async function handleDemo(request, env, url) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  // Only the site itself may post here. Browsers always send Origin on a
  // cross-site POST, so a missing or foreign one is not the form.
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return json({ ok: false, error: 'origin' }, 403);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'body' }, 400);
  }
  // Honeypot: a hidden field people never see. Bots fill it; answer as if
  // it worked so they learn nothing, and post nothing.
  if (String(form.get('_gotcha') || '').trim()) return json({ ok: true });

  const name = String(form.get('name') || '').trim().slice(0, 200);
  const email = String(form.get('email') || '').trim().slice(0, 200);
  const message = String(form.get('message') || '').trim().slice(0, 2000);
  if (!name) return json({ ok: false, error: 'name' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'email' }, 400);
  if (!message) return json({ ok: false, error: 'message' }, 400);

  const text = `פנייה מהאתר · ${name}`;
  const blocks = [
    section(`*פנייה מהאתר*\n*שם:* ${escapeMrkdwn(name)}\n*אימייל:* ${escapeMrkdwn(email)}`),
    // Slack caps a section at 3000 characters; escaping can only lengthen.
    section(escapeMrkdwn(message).slice(0, 2900)),
    context([nowInIsrael(), request.headers.get('cf-ipcountry')].filter(Boolean).join(' · ')),
  ];
  const posted = await postToSlack(env, text, blocks);
  return posted ? json({ ok: true }) : json({ ok: false, error: 'slack' }, 502);
}

// ---- the Cal.com webhook --------------------------------------------------

// Cal.com POSTs JSON with `triggerEvent` and `payload`, and signs the raw
// body as hex HMAC-SHA256 in X-Cal-Signature-256 using the webhook's secret.
async function handleCal(request, env) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  const raw = await request.text();

  if (env.CAL_WEBHOOK_SECRET) {
    const given = request.headers.get('x-cal-signature-256') || '';
    const expected = await hmacHex(env.CAL_WEBHOOK_SECRET, raw);
    if (!timingSafeEqual(given, expected)) return json({ ok: false, error: 'signature' }, 401);
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'body' }, 400);
  }
  const trigger = String(event.triggerEvent || '');
  const p = event.payload || {};
  // Cal.com fires a PING when the webhook is created; answer without posting.
  if (trigger === 'PING' || !trigger) return json({ ok: true });

  const attendee = (p.attendees && p.attendees[0]) || {};
  const heading = {
    BOOKING_CREATED: 'הדגמה נקבעה',
    BOOKING_RESCHEDULED: 'הדגמה הועברה למועד אחר',
    BOOKING_CANCELLED: 'הדגמה בוטלה',
    BOOKING_REJECTED: 'הדגמה נדחתה',
    BOOKING_REQUESTED: 'בקשת הדגמה ממתינה לאישור',
  }[trigger] || `Cal.com: ${trigger}`;

  const lines = [`*${heading}*`];
  if (attendee.name) lines.push(`*שם:* ${escapeMrkdwn(attendee.name)}`);
  if (attendee.email) lines.push(`*אימייל:* ${escapeMrkdwn(attendee.email)}`);
  if (p.startTime) lines.push(`*מועד:* ${formatInIsrael(p.startTime)}`);
  const notes = p.additionalNotes || (p.responses && p.responses.notes && p.responses.notes.value);
  if (notes) lines.push(`*הערות:* ${escapeMrkdwn(String(notes).slice(0, 500))}`);
  if (p.cancellationReason) lines.push(`*סיבה:* ${escapeMrkdwn(p.cancellationReason)}`);

  const text = `${heading} · ${attendee.name || ''}`.trim();
  const blocks = [section(lines.join('\n')), context(p.title ? escapeMrkdwn(p.title) : 'Cal.com')];
  const posted = await postToSlack(env, text, blocks);
  return posted ? json({ ok: true }) : json({ ok: false, error: 'slack' }, 502);
}

// ---- Slack ------------------------------------------------------------------

async function postToSlack(env, text, blocks) {
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_ID) {
    console.error('SLACK_BOT_TOKEN or SLACK_CHANNEL_ID is not set');
    return false;
  }
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel: env.SLACK_CHANNEL_ID, text, blocks, unfurl_links: false }),
  });
  const body = await res.json().catch(() => ({}));
  if (!body.ok) console.error('chat.postMessage failed', body.error);
  return !!body.ok;
}

const section = (mrkdwn) => ({ type: 'section', text: { type: 'mrkdwn', text: mrkdwn } });
const context = (mrkdwn) => ({ type: 'context', elements: [{ type: 'mrkdwn', text: mrkdwn }] });

// Slack's mrkdwn treats & < > as markup; user-typed text must not.
function escapeMrkdwn(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ISRAEL = { timeZone: 'Asia/Jerusalem', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
function formatInIsrael(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString('he-IL', ISRAEL);
}
function nowInIsrael() {
  return new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', dateStyle: 'short', timeStyle: 'short' });
}

// ---- crypto -----------------------------------------------------------------

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
