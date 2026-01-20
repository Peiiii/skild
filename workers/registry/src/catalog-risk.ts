type RiskCheck = { label: string; pattern: RegExp };

const RISK_CHECKS: RiskCheck[] = [
  { label: "rm -rf", pattern: /rm\s+-rf\b/i },
  { label: "sudo", pattern: /\bsudo\b/i },
  { label: "curl|bash", pattern: /\bcurl\b[^\n]*\b(bash|sh)\b/i },
  { label: "wget|bash", pattern: /\bwget\b[^\n]*\b(bash|sh)\b/i },
  { label: "chmod", pattern: /\bchmod\b/i },
  { label: "chown", pattern: /\bchown\b/i },
  { label: "/etc", pattern: /\/etc\//i },
  { label: "~/.ssh", pattern: /~\/\.ssh\b/i },
  { label: "token|secret|apikey", pattern: /\b(token|secret|apikey)\b/i },
  { label: "eval", pattern: /\beval\b/i },
  { label: "exec", pattern: /\bexec\b/i },
];

export function detectCatalogRisk(contents: Array<string | null | undefined>): { hasRisk: boolean; evidence: string[] } {
  const evidence: string[] = [];

  for (const input of contents) {
    if (!input) continue;
    for (const check of RISK_CHECKS) {
      const match = input.match(check.pattern);
      if (match) {
        const sample = match[0].trim();
        evidence.push(`${check.label}: ${sample}`);
      }
    }
  }

  if (evidence.length === 0) return { hasRisk: false, evidence: [] };
  return { hasRisk: true, evidence: evidence.slice(0, 5) };
}
