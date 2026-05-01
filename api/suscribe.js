export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Not allowed');

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const LIST_ID = process.env.MAILCHIMP_LIST_ID || '783bf90581';
  const DC      = 'us1';

  const { email, name, rating, comment } = req.body;
  if (!email) return res.status(200).json({ ok: true, skipped: 'no email' });
  if (!API_KEY) return res.status(200).json({ ok: true, skipped: 'no key' });

  const auth = Buffer.from(`key:${API_KEY}`).toString('base64');
  try {
    const mc = await fetch(`https://${DC}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME:   name    || '',
          RATING:  String(rating  || ''),
          COMMENT: (comment || '').slice(0, 255),
          SOURCE:  'Silver Bridge Feedback Form',
        },
        tags: ['silver-bridge-reader', `rating-${rating}-stars`],
      }),
    });
    const data = await mc.json();
    if (mc.ok || data.title === 'Member Exists') return res.status(200).json({ ok: true });
    return res.status(200).json({ ok: false });
  } catch {
    return res.status(200).json({ ok: false });
  }
}
