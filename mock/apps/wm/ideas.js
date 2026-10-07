const { mask, maskEmail } = require('./ops');
const codec = require('./state-codec');

function ideaView(idea, canPii) {
  const submitter = idea.submitter;
  return { ...idea, ...(submitter && !canPii && !submitter.erased ? {
    submitter: { ...submitter, name: mask(submitter.name), email: maskEmail(submitter.email), masked: true },
  } : {}) };
}

function eraseSubmitter(idea, who, now, audit) {
  idea.submitter = { erased: true, privacyVersion: idea.submitter?.privacyVersion ?? '' };
  idea.version += 1;
  idea.history.unshift({ at: now, by: who, action: 'erase' });
  audit.unshift({ at: now, by: who, action: 'idea_erase', entry: idea.id, type: 'idea', version: idea.version });
}

// Scoped to a store generation. Compare the full payload for reused idempotency keys.
function ideaSubmissions(ideas, now = Date.now) {
  const seen = new Map();
  const windowMs = 10 * 60 * 1000;
  return {
    duplicate(body, key) {
      const at = now();
      for (const [k, value] of seen) if (at - value.at >= windowMs || !ideas.has(value.id)) seen.delete(k);
      const payload = JSON.stringify(body);
      const emailMessage = `${body.email.toLowerCase()}|${body.message}`;
      const prior = key ? seen.get(`key:${key}`) : null;
      if (prior && prior.payload !== payload) return { conflict: true };
      const found = prior ?? seen.get(`body:${emailMessage}`);
      return found ? { id: found.id } : null;
    },
    remember(body, key, id) {
      const value = { id, at: now(), payload: JSON.stringify(body) };
      seen.set(`body:${body.email.toLowerCase()}|${body.message}`, value);
      if (key) seen.set(`key:${key}`, value);
    },
    exportState: () => ({ seen: codec.copy([...seen]) }),
    validateState(value) {
      const rows = codec.mapRows(value?.seen, { ids: false });
      if (rows.some(([, row]) => typeof row.id !== 'string' || !Number.isFinite(row.at) || typeof row.payload !== 'string')) throw codec.fail('Website idea submission receipts are incomplete.');
      return { seen: rows };
    },
    importState(value) { const incoming = this.validateState(value); codec.replaceMap(seen, incoming.seen); },
  };
}
module.exports = { ideaView, eraseSubmitter, ideaSubmissions };
