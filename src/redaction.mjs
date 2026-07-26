const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{16,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  /(?<=password\s*[=:]\s*)[^\s,;]+/gi,
  /(?<=token\s*[=:]\s*)[^\s,;]+/gi,
  /(?<=api[_-]?key\s*[=:]\s*)[^\s,;]+/gi
];

const WINDOWS_HOME = /[A-Z]:\\Users\\[^\\\s]+/gi;
const POSIX_HOME = /\/(?:Users|home)\/[^/\s]+/g;

export function redactText(value) {
  if (typeof value !== 'string') return value;

  let redacted = value;
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }
  return redacted
    .replace(WINDOWS_HOME, '[USER_HOME]')
    .replace(POSIX_HOME, '[USER_HOME]');
}

export function redactIntent(intent) {
  return {
    assetQuery: redactText(intent.assetQuery ?? ''),
    environment: redactText(intent.environment ?? ''),
    operation: redactText(intent.operation ?? ''),
    requestedBy: redactText(intent.requestedBy ?? 'agent'),
    rationale: redactText(intent.rationale ?? ''),
    fields: Array.isArray(intent.fields) ? intent.fields.map(redactText) : []
  };
}

