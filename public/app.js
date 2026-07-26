const state = { scenarios: [], selected: null };

const element = (id) => document.getElementById(id);
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]);

function riskCopy(level) {
  return {
    extreme: ['EXTREME', 'block_pending_owner_approval', 'This is a destructive production change against classified customer data.'],
    high: ['HIGH', 'require_owner_approval', 'This operation has a material downstream impact.'],
    medium: ['REVIEW', 'require_review', 'Review the data contract before changing this asset.'],
    low: ['CLEAR', 'allow_with_audit', 'The requested intent can proceed with the standard audit trail.']
  }[level] ?? ['UNRESOLVED', 'hold', 'Dollar could not establish enough context to allow a write.'];
}

function renderScenarios() {
  element('scenarios').innerHTML = state.scenarios.map((scenario) => `
    <button class="scenario ${state.selected === scenario.id ? 'selected' : ''}" data-id="${escapeHtml(scenario.id)}">${escapeHtml(scenario.title)}</button>
  `).join('');
  document.querySelectorAll('.scenario').forEach((button) => button.addEventListener('click', () => {
    state.selected = button.dataset.id;
    renderScenarios();
  }));
}

function badges(values) {
  return values.length ? values.map((value) => `<span class="badge">${escapeHtml(value)}</span>`).join('') : '<span class="muted">None recorded</span>';
}

function renderDecision(decision) {
  element('empty-state').classList.add('hidden');
  element('results').classList.remove('hidden');
  if (decision.status === 'asset_not_found') {
    element('verdict').innerHTML = `<p class="eyebrow">CONTEXT UNRESOLVED</p><h2>Hold the change.</h2><p>${escapeHtml(decision.message)}</p>`;
    return;
  }

  const [label, action, summary] = riskCopy(decision.policy.level);
  element('verdict').className = `verdict risk-${decision.policy.level}`;
  element('verdict').innerHTML = `
    <div class="risk-label">${label}</div>
    <p class="eyebrow">LOCAL SAFETY VERDICT</p>
    <h2>${escapeHtml(action.replaceAll('_', ' '))}</h2>
    <p>${escapeHtml(summary)}</p>
    <ul>${decision.policy.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>
    <div class="recommendation"><strong>Safer next action</strong><span>${escapeHtml(decision.recommendation)}</span></div>
  `;

  element('asset-name').textContent = decision.asset.name;
  element('metadata').innerHTML = `
    <div><small>Environment</small><strong>${escapeHtml(decision.asset.environment)}</strong></div>
    <div><small>Owners</small><strong>${escapeHtml(decision.asset.owners.join(', ') || 'Unassigned')}</strong></div>
    <div class="tag-row"><small>Classifications</small><span>${badges(decision.asset.tags)}</span></div>
  `;
  element('fields').innerHTML = decision.affectedFields.length
    ? decision.affectedFields.map((field) => `<div class="field"><strong>${escapeHtml(field.name)}</strong><span>${escapeHtml(field.type)}</span>${badges(field.tags)}</div>`).join('')
    : '<p class="muted">The requested intent does not name a field.</p>';
  element('lineage').innerHTML = decision.lineage.downstream.length
    ? decision.lineage.downstream.map((asset) => `<div class="lineage-node"><span>${escapeHtml(asset.type)}</span><strong>${escapeHtml(asset.name)}</strong><small>${escapeHtml(asset.hops)} hop${asset.hops === 1 ? '' : 's'} downstream</small></div>`).join('')
    : '<p class="muted">No downstream assets were returned by DataHub.</p>';
}

async function analyze() {
  if (!state.selected) return;
  const button = element('analyze');
  button.disabled = true;
  button.textContent = 'Reading DataHub context…';
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scenarioId: state.selected })
    });
    renderDecision(await response.json());
  } finally {
    button.disabled = false;
    button.innerHTML = 'Analyze intent <span>→</span>';
  }
}

async function boot() {
  const [status, scenarios] = await Promise.all([
    fetch('/api/status').then((response) => response.json()),
    fetch('/api/scenarios').then((response) => response.json())
  ]);
  element('mode').textContent = status.mode === 'fixture' ? 'Synthetic DataHub catalog · Demo mode' : 'Live DataHub MCP · Read-only mode';
  state.scenarios = scenarios;
  state.selected = scenarios[0]?.id ?? null;
  renderScenarios();
  element('analyze').addEventListener('click', analyze);
}

boot();

