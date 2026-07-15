import type { AttackCategory, EventOutcome } from './types'

export const CATEGORY_META: Record<AttackCategory, { label: string; short: string; color: string }> = {
  ddos: { label: 'DDoS', short: 'DDoS', color: '#ff3366' },
  malware: { label: 'Malware', short: 'MLW', color: '#ffad33' },
  ransomware: { label: 'Ransomware', short: 'RNS', color: '#d66bff' },
  phishing: { label: 'Phishing', short: 'PHS', color: '#24cfff' },
  scanning: { label: 'Scanning', short: 'SCN', color: '#55ffd0' },
  botnet: { label: 'Botnet / C2', short: 'C2', color: '#fff05a' },
}

export const OUTCOME_META: Record<EventOutcome, { label: string; color: string }> = {
  blocked: { label: 'Blocked', color: '#55ffd0' },
  detected: { label: 'Detected', color: '#fff05a' },
  active: { label: 'Active', color: '#ff3366' },
}
