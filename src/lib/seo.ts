export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function autoDescription(input: string, maxLen = 160): string {
  const t = stripHtml(input)
  if (t.length <= maxLen) return t
  return t.slice(0, maxLen - 1).trimEnd() + '…'
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

