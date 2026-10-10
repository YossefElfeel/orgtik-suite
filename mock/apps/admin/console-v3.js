const crypto = require('node:crypto');
const { preferences, savePreferences } = require('../../lib/workspace-suite');
const { DEFINITIONS } = require('../../lib/connectors');
const clone = value => JSON.parse(JSON.stringify(value));
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const hash = value => crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');

function create({ getStore, identity, principal }) {
  const S = () => getStore();
  function authority(permission, write = false) {
    const p = principal(), rights = p?.context.staffAccess?.permissions.admin || [];
    if (!p || p.claims.mode !== 'staff' || p.claims.aud !== 'staff:admin' || !rights.includes(permission) && !(permission.endsWith(':edit') && rights.includes(permission.replace(':edit', ':full')))) throw fail(403, 'staff_permission_required', 'Your current staff role cannot use this Console action.');
    if (write && p.readOnly) throw fail(423, 'view_as_read_only', 'View-as is read-only.');
    return p;
  }
  const state = () => S().db.consoleV3 || { version: 1, readMarks: {}, security: {}, releases: [], invitations: [], documents: {}, series: {}, manualRetryPauses: {}, taxChecks: [], payLinks: [], ticketSLAs: {} };
  function mutable() {
    S().db.consoleV3 ??= clone(state());
    if (S().db.consoleV3.version !== 1) throw fail(503, 'console_state_unavailable', 'Console configuration could not be loaded.');
    return S().db.consoleV3;
  }
  function recorded(req, permission, action) {
    const p = authority(permission, true), operationId = req.get('idempotency-key');
    if (!/^[\w.:-]{1,200}$/.test(operationId || '')) throw fail(422, 'operation_id_required', 'Use the original action reference.');
    const data = mutable(); data.operations ??= {};
    const key = `${p.actor.id}:${operationId}`, fingerprint = hash({ path: req.path, body: req.body });
    const prior = data.operations[key];
    if (prior) {
      if (prior.fingerprint !== fingerprint) throw fail(409, 'operation_conflict', 'This reference belongs to a different action.');
      return clone(prior.result);
    }
    const result = action(p, data);
    data.operations[key] = { fingerprint, result: clone(result) };
    return result;
  }
  function actor() { return identity.findUser(principal()?.user.id); }
  const at = () => S().iso(S().now());
  const log = (p, action, target, details = {}) => S().log(p.actor.key, action, String(target), details);
  function search(query) {
    const p = authority('overview:view'), rights = p.context.staffAccess.permissions.admin, rows = [];
    const push = (permission, type, values, label, path) => {
      if (!rights.includes(permission)) return;
      for (const row of values) rows.push({ id: `console:${type}:${row.id || row.key}`, tool: 'admin', title: label(row), path: path(row) });
    };
    push('workspaces:view', 'workspace', S().db.workspaces.filter(row => row.state !== 'deleted'), row => row.name, row => `/workspaces/${encodeURIComponent(row.id)}`);
    push('tools:view', 'tool', S().db.tools, row => row.name.en, row => `/tools/${encodeURIComponent(row.key)}`);
    push('plans:view', 'plan', S().db.plans.filter(row => row.tool), row => row.name.en, row => `/plans/${encodeURIComponent(row.id)}`);
    push('billing:view', 'invoice', S().db.invoices, row => `${row.number} · ${S().workspace(row.workspaceId)?.name || ''}`, row => `/invoices/${encodeURIComponent(row.id)}`);
    push('tickets:view', 'ticket', S().db.tickets, row => `${row.number} · ${row.subject}`, row => `/tickets/${encodeURIComponent(row.id)}`);
    if (query.length > 200) throw fail(422, 'invalid_query', 'Use a shorter search.');
    return query ? rows.filter(row => row.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())).slice(0, 50) : [];
  }
  function notifications() {
    const p = authority('overview:view'), rights = p.context.staffAccess.permissions.admin, marks = state().readMarks[p.user.id] || [], rows = [];
    if (rights.includes('billing:view')) for (const invoice of S().db.invoices.filter(row => row.state === 'past_due')) rows.push({ id: `billing:${invoice.id}`, tool: 'admin', category: 'billing', title: `${invoice.number} · ${S().workspace(invoice.workspaceId)?.name || ''}`, path: `/invoices/${encodeURIComponent(invoice.id)}`, at: invoice.dueAt || invoice.issuedAt });
    if (rights.includes('tickets:view')) for (const ticket of S().db.tickets.filter(row => row.state === 'open')) rows.push({ id: `support:${ticket.id}`, tool: 'admin', title: `${ticket.number} · ${ticket.subject}`, path: `/tickets/${encodeURIComponent(ticket.id)}`, at: ticket.createdAt });
    const prefs = preferences(actor()).notificationPreferences || {};
    return prefs.inApp === false ? [] : rows.filter(row => !row.category || prefs[row.category] !== false).map(row => ({ ...row, read: marks.includes(row.id) })).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 100);
  }
  function metrics() {
    authority('reports:view');
    const current = S(), workspaces = current.db.workspaces.filter(row => !['deleted', 'cancelled'].includes(row.state)), paying = line => ['active', 'cancelling', 'past_due', 'read_only'].includes(line.state);
    const mrr = workspace => workspace.lines.filter(line => paying(line) && current.db.plans.some(plan => plan.id === line.planId && plan.tool)).reduce((sum, line) => sum + current.pricing.monthlyAmount(line) / current.usdRate(line.snapshot.currency || workspace.currency), 0);
    const cohorts = new Map();
    for (const workspace of current.db.workspaces.filter(row => row.state !== 'deleted')) {
      const month = String(workspace.createdAt).slice(0, 7), cohort = cohorts.get(month) || { month, workspaces: 0, paying: 0, mrrUsd: 0 };
      cohort.workspaces++; if (mrr(workspace) > 0 && workspace.state !== 'cancelled') cohort.paying++; cohort.mrrUsd += workspace.state === 'cancelled' ? 0 : mrr(workspace); cohorts.set(month, cohort);
    }
    return { mrrUsd: workspaces.reduce((sum, workspace) => sum + mrr(workspace), 0), activeWorkspaces: workspaces.length, trials: workspaces.reduce((sum, workspace) => sum + workspace.lines.filter(line => line.state === 'trialing').length, 0), activation: { activated: workspaces.filter(workspace => workspace.lines.some(line => line.tool !== 'general' && ['active', 'trialing', 'free'].includes(line.state))).length, eligible: workspaces.length }, cohorts: [...cohorts.values()].sort((a, b) => a.month.localeCompare(b.month)), movements: clone(state().movements || []), definitions: { currency: 'USD', conversion: 'current platform reporting rate', mrr: 'Current recurring tool lines; services excluded. Website term lines use the native monthlyAmount function.', cohorts: 'Workspace creation month and current paying state; no invented historic retention periods.' } };
  }
  function routes(app, prefix = '/v1/admin/console') {
    const read = fn => (req, res, next) => { try { res.set('Cache-Control', 'private, no-store').json({ data: fn(req), meta: {} }); } catch (error) { next(error); } };
    app.get(prefix + '/frame', read(() => {
      const p = authority('overview:view');
      return { staff: { id: p.user.id, name: identity.fullName(p.user) }, preferences: preferences(actor()), now: at(), scope: 'staff:admin' };
    }));
    app.patch(prefix + '/preferences', read(req => { authority('overview:view', true); return savePreferences(actor(), req.body); }));
    app.get(prefix + '/search', read(req => search(String(req.query.q || '').trim())));
    app.get(prefix + '/notifications', read(notifications));
    app.post(prefix + '/notifications/read', read(req => {
      const p = authority('overview:view', true), visible = notifications(), ids = req.body.all === true ? visible.map(row => row.id) : req.body.ids;
      if (!Array.isArray(ids) || ids.length > 100 || ids.some(id => !visible.some(row => row.id === id))) throw fail(422, 'invalid_notifications', 'Choose your current notices.');
      mutable().readMarks[p.user.id] = [...new Set([...(state().readMarks[p.user.id] || []), ...ids])].slice(-1000);
      return notifications();
    }));
    app.get(prefix + '/metrics', read(metrics));
    app.get(prefix + '/software-catalog', read(() => {
      authority('tools:view');
      return { managedIn: 'console', offers: S().db.websiteOffers.filter(row => row.kind === 'software').map(row => ({ ...clone(row), toolStatus: row.tool ? S().db.tools.find(tool => tool.key === row.tool)?.status : S().db.services.find(service => service.id === row.serviceId)?.status })), bundles: clone(S().db.websiteOfferBundles.filter(row => row.kind === 'software')) };
    }));
    app.post(prefix + '/software-catalog/:id', read(req => recorded(req, 'tools:edit', (p) => {
      const offer = S().db.websiteOffers.find(row => row.id === req.params.id && row.kind === 'software'), body = req.body;
      if (!offer) throw fail(404, 'software_offer_not_found', 'Choose an actual software offer.');
      if (!body || Object.keys(body).some(key => !['name', 'description', 'capabilities', 'department', 'departmentName', 'icon'].includes(key))) throw fail(422, 'invalid_software_metadata', 'Edit supported software catalog metadata.');
      for (const key of ['name', 'description', 'departmentName']) if (body[key] !== undefined && (!body[key] || ['en', 'ar', 'de', 'fr', 'it'].some(locale => typeof body[key][locale] !== 'string' || !body[key][locale].trim() || body[key][locale].length > 2000))) throw fail(422, 'invalid_catalog_translation', 'Provide each supported catalog translation.');
      if (body.capabilities !== undefined && ['en', 'ar', 'de', 'fr', 'it'].some(locale => !Array.isArray(body.capabilities[locale]) || body.capabilities[locale].length > 20 || body.capabilities[locale].some(value => typeof value !== 'string' || !value.trim() || value.length > 300))) throw fail(422, 'invalid_capabilities', 'Use up to twenty capability lines per language.');
      for (const key of ['department', 'icon']) if (body[key] !== undefined && (typeof body[key] !== 'string' || !body[key].trim() || body[key].length > 100)) throw fail(422, 'invalid_catalog_metadata', 'Use a supported short metadata value.');
      Object.assign(offer, clone(body), { publishedAt: at(), publishedBy: p.actor.key });
      if (body.name && offer.tool) S().db.tools.find(tool => tool.key === offer.tool).name = clone(body.name);
      log(p, 'software_catalog_metadata_published', offer.id, { applyMode: 'new_public_quotes' });
      return clone(offer);
    })));
    app.get(prefix + '/setup', read(() => {
      const p = authority('overview:view'), rights = p.context.staffAccess.permissions.admin;
      const reviews = state().setupReviews?.[p.user.id] || [];
      return [{ id: 'catalog', permission: 'tools:view', path: '/tools', ready: S().db.tools.length > 0 && S().db.plans.some(plan => plan.tool) }, { id: 'pricing', permission: 'pricing:view', path: '/pricing', ready: Object.keys(S().db.currencies).length > 0 && S().db.zones.length > 0 }, { id: 'security', permission: 'overview:view', path: '/staff/security', ready: state().security[p.user.id]?.enabled === true }, { id: 'billing', permission: 'billing:view', path: '/billing', ready: Boolean(S().db.settings.dunning) }].filter(step => rights.includes(step.permission)).map(step => ({ ...step, complete: step.ready && reviews.includes(step.id) }));
    }));
    app.post(prefix + '/setup/review', read(req => recorded(req, 'overview:view', (p, data) => {
      const step = String(req.body.step || ''), permission = { catalog: 'tools:view', pricing: 'pricing:view', security: 'overview:view', billing: 'billing:view' }[step];
      if (!permission) throw fail(422, 'invalid_setup_step', 'Choose a current setup step.');
      authority(permission);
      if (step === 'catalog' && (!S().db.tools.length || !S().db.plans.some(plan => plan.tool)) || step === 'pricing' && (!Object.keys(S().db.currencies).length || !S().db.zones.length) || step === 'billing' && !S().db.settings.dunning) throw fail(409, 'setup_step_pending', 'Finish the current configuration before completing this step.');
      if (step === 'security' && data.security[p.user.id]?.enabled !== true) throw fail(409, 'security_step_pending', 'Enable the displayed mock verification before completing this step.');
      data.setupReviews ??= {}; data.setupReviews[p.user.id] = [...new Set([...(data.setupReviews[p.user.id] || []), step])];
      log(p, 'console_setup_reviewed', step); return { step, complete: true };
    })));
    app.get(prefix + '/ecosystem', read(() => {
      authority('workspaces:view');
      return { managedIn: 'account', connectors: DEFINITIONS.map(definition => ({ ...clone(definition), workspaces: S().db.workspaces.filter(workspace => !['deleted', 'cancelled'].includes(workspace.state) && workspace.lines.some(line => line.tool === definition.source && !['ended', 'deleted'].includes(line.state)) && workspace.lines.some(line => line.tool === definition.target && !['ended', 'deleted'].includes(line.state))).map(workspace => ({ id: workspace.id, name: workspace.name, enabled: workspace.suite?.connectors?.[definition.id] !== false })) })) };
    }));
    app.get(prefix + '/releases', read(() => { authority('tools:view'); return clone(state().releases); }));
    app.post(prefix + '/releases', read(req => recorded(req, 'tools:edit', (p, data) => {
      const tool = S().db.tools.find(row => row.key === req.body.tool);
      if (!tool || !['release', 'changelog', 'announcement'].includes(req.body.kind) || !req.body.title?.trim() || !req.body.body?.trim() || req.body.title.length > 150 || req.body.body.length > 5000) throw fail(422, 'invalid_release', 'Choose an actual tool and enter its publication text.');
      const row = { id: S().id('release'), tool: tool.key, kind: req.body.kind, title: req.body.title.trim(), body: req.body.body.trim(), version: String(req.body.version || '').slice(0, 50), publishedAt: at(), by: p.actor.key, status: tool.status };
      data.releases.unshift(row); log(p, 'tool_publication', tool.key, { releaseId: row.id, kind: row.kind }); return clone(row);
    })));
    app.get(prefix + '/billing', read(() => {
      authority('billing:view');
      return { invoices: S().db.invoices.map(invoice => ({ ...clone(invoice), workspace: S().workspace(invoice.workspaceId)?.name, manualRetryPaused: state().manualRetryPauses[invoice.id] === true })), cardWarnings: S().db.workspaces.flatMap(workspace => (workspace.paymentMethods || []).filter(method => method.kind === 'card' && (method.expired || expirySoon(method.expires, S().now()))).map(method => ({ workspaceId: workspace.id, workspace: workspace.name, id: method.id, last4: method.last4, expires: method.expires, expired: Boolean(method.expired) }))), mailbox: S().db.mailbox.filter(row => /billing|payment|invoice|card|dunning/.test(row.kind || row.template || '')), payLinks: clone(state().payLinks), series: clone(state().series), documents: Object.values(state().documents) };
    }));
    app.post(prefix + '/billing/notice', read(req => recorded(req, 'billing:edit', (p) => {
      const workspace = S().workspace(req.body.workspaceId), invoice = req.body.invoiceId && S().db.invoices.find(row => row.id === req.body.invoiceId && row.workspaceId === workspace?.id);
      if (!workspace || !['dunning', 'card_expiry'].includes(req.body.kind) || req.body.invoiceId && !invoice) throw fail(422, 'invalid_notice', 'Choose an actual workspace and invoice.');
      if (req.body.kind === 'card_expiry' && !(workspace.paymentMethods || []).some(method => method.expired || expirySoon(method.expires, S().now()))) throw fail(409, 'card_notice_not_due', 'No current card expiry warning is due.');
      const id = S().id('console_notice'); S().notifyOwner(workspace, req.body.kind, { title: `${req.body.kind === 'dunning' ? 'Payment reminder' : 'Card expiry reminder'} · ${workspace.name}`, invoiceId: invoice?.id, initiatedBy: p.actor.id }, id);
      log(p, 'billing_mock_notice', workspace.id, { noticeId: id, invoiceId: invoice?.id }); return { id, workspaceId: workspace.id, delivery: 'mock' };
    })));
    app.post(prefix + '/billing/manual-retry', read(req => recorded(req, 'billing:edit', (p, data) => {
      const invoice = S().db.invoices.find(row => row.id === req.body.invoiceId);
      if (!invoice || !['open', 'past_due'].includes(invoice.state) || typeof req.body.paused !== 'boolean') throw fail(422, 'invalid_retry_policy', 'Choose an unpaid invoice and manual retry policy.');
      data.manualRetryPauses[invoice.id] = req.body.paused; log(p, 'manual_retry_policy', invoice.id, { paused: req.body.paused }); return { invoiceId: invoice.id, paused: req.body.paused, scope: 'manual_staff_attempts' };
    })));
    app.get(prefix + '/billing/invoices/:id/document', read(req => {
      authority('billing:view'); const invoice = S().db.invoices.find(row => row.id === req.params.id && row.state !== 'draft');
      if (!invoice) throw fail(404, 'invoice_document_unavailable', 'Issue this actual invoice before opening its document.');
      return clone(state().documents[invoice.id] || { invoiceId: invoice.id, number: invoice.number, invoice, workspace: S().workspace(invoice.workspaceId)?.name, issuedAt: invoice.issuedAt, prototype: true, regulatorySubmission: 'not_submitted' });
    }));
    app.post(prefix + '/billing/series', read(req => recorded(req, 'billing:edit', (p, data) => {
      const entity = String(req.body.entity || '').toUpperCase(), prefix = String(req.body.prefix || '').trim();
      if (!S().db.countries[entity] || !/^[A-Za-z0-9-]{1,30}$/.test(prefix) || !Number.isSafeInteger(req.body.nextNumber) || req.body.nextNumber < 1 || req.body.nextNumber > 999999999) throw fail(422, 'invalid_series', 'Use a billing country, prefix and positive whole next number.');
      const existing = data.series[entity]; if (existing && req.body.nextNumber < existing.nextNumber) throw fail(409, 'series_number_used', 'Issued document numbers cannot be reused.');
      data.series[entity] = { entity, prefix, nextNumber: req.body.nextNumber }; log(p, 'invoice_series_configured', entity); return clone(data.series[entity]);
    })));
    app.post(prefix + '/billing/invoices/:id/document', read(req => recorded(req, 'billing:edit', (p, data) => {
      const invoice = S().db.invoices.find(row => row.id === req.params.id && row.state !== 'draft'), workspace = invoice && S().workspace(invoice.workspaceId);
      if (!invoice || !workspace) throw fail(404, 'invoice_document_unavailable', 'Issue this actual invoice first.');
      if (data.documents[invoice.id]) return clone(data.documents[invoice.id]);
      const entity = workspace.billing?.country || workspace.country, series = data.series[entity], documentNumber = series ? `${series.prefix}-${String(series.nextNumber++).padStart(6, '0')}` : invoice.number;
      if (Object.values(data.documents).some(row => row.documentNumber === documentNumber)) throw fail(409, 'document_number_used', 'Choose an unused document series.');
      const row = { invoiceId: invoice.id, documentNumber, number: invoice.number, entity, invoice: clone(invoice), workspace: workspace.name, billing: clone(workspace.billing), issuedAt: at(), prototype: true, regulatorySubmission: 'not_submitted' };
      data.documents[invoice.id] = row; log(p, 'invoice_document_recorded', invoice.id, { documentNumber }); return clone(row);
    })));
    app.post(prefix + '/tax/verify', read(req => recorded(req, 'tax:edit', (p, data) => {
      const workspace = S().workspace(req.body.workspaceId), taxId = String(req.body.taxId || '').trim();
      if (!workspace || !taxId || taxId.length > 100) throw fail(422, 'invalid_tax_check', 'Choose an actual workspace and tax ID.');
      const row = { id: S().id('tax_check'), workspaceId: workspace.id, taxId, at: at(), state: ['CH-DEMO-001', 'SA-DEMO-001'].includes(taxId) ? 'accepted_mock' : 'rejected_mock', submitted: false, provider: 'mock' };
      data.taxChecks.unshift(row); log(p, 'tax_mock_check', workspace.id, { checkId: row.id }); return clone(row);
    })));
    app.get(prefix + '/tax/checks', read(() => { authority('tax:view'); return clone(state().taxChecks); }));
    app.get(prefix + '/staff/security', read(() => { const p = authority('overview:view'); return clone(state().security[p.user.id] || { enabled: false, simulated: true }); }));
    app.post(prefix + '/staff/security', read(req => recorded(req, 'overview:view', (p, data) => {
      if (typeof req.body.enabled !== 'boolean' || req.body.enabled && req.body.code !== '246810') throw fail(422, 'mock_verification_required', 'Use the displayed mock verification code.');
      data.security[p.user.id] = { enabled: req.body.enabled, simulated: true, updatedAt: at() }; log(p, 'staff_mock_2fa', p.user.id, { enabled: req.body.enabled }); return clone(data.security[p.user.id]);
    })));
  }
  return { routes, metrics, notifications, search };
}
function expirySoon(value, now) {
  const match = /^(\d{2})\/(\d{2}|\d{4})$/.exec(String(value || ''));
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) return false;
  const year = Number(match[2]) + (match[2].length === 2 ? 2000 : 0), expiresAt = Date.UTC(year, Number(match[1]), 1);
  return expiresAt >= now && expiresAt <= now + 45 * 86400000;
}
module.exports = { create, expirySoon };
