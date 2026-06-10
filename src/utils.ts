const xssPatterns = [
  /<\s*script.*?>/i,
  /<\s*\/\s*script\s*>/i,
  /<\s*img.*?on\w+\s*=/i,
  /<\s*\w+\s*on\w+\s*=.*?>/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /expression\s*\(/i,
  /eval\s*\(/i,
  /alert\s*\(/i,
  /document\.cookie/i,
  /document\.write\s*\(/i,
  /window\.location/i,
  /innerHTML/i,
]

/** Reject obviously malicious "language codes" coming from user input. */
export function hasXSS(input: unknown): boolean {
  if (typeof input !== 'string') return false
  return xssPatterns.some((pattern) => pattern.test(input))
}
