/** Minimal IPv4/IPv6 CIDR matching, dependency-free so it runs on edge runtimes. */

function parseIPv4(ip: string): bigint | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let value = 0n
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const n = Number(part)
    if (n > 255) return null
    value = (value << 8n) | BigInt(n)
  }
  return value
}

function parseIPv6(ip: string): bigint | null {
  // Strip zone id, e.g. fe80::1%eth0
  ip = ip.split('%')[0]!
  // Embedded IPv4 tail, e.g. ::ffff:1.2.3.4
  const lastColon = ip.lastIndexOf(':')
  const tail = ip.slice(lastColon + 1)
  if (tail.includes('.')) {
    const v4 = parseIPv4(tail)
    if (v4 === null) return null
    ip = `${ip.slice(0, lastColon + 1)}${(v4 >> 16n).toString(16)}:${(v4 & 0xffffn).toString(16)}`
  }
  const halves = ip.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - rest.length
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null
  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill('0'), ...rest]
  let value = 0n
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) return null
    value = (value << 16n) | BigInt(parseInt(group, 16))
  }
  return value
}

export interface ParsedIP {
  version: 4 | 6
  value: bigint
}

export function parseIP(ip: string): ParsedIP | null {
  ip = ip.trim()
  if (ip.includes(':')) {
    const v6 = parseIPv6(ip)
    if (v6 === null) return null
    // Treat IPv4-mapped IPv6 (::ffff:a.b.c.d) as IPv4.
    if (v6 >> 32n === 0xffffn) return { version: 4, value: v6 & 0xffffffffn }
    return { version: 6, value: v6 }
  }
  const v4 = parseIPv4(ip)
  return v4 === null ? null : { version: 4, value: v4 }
}

export interface CIDR {
  version: 4 | 6
  network: bigint
  prefix: number
}

export function parseCIDR(cidr: string): CIDR | null {
  const [addr, prefixStr] = cidr.trim().split('/')
  const ip = addr ? parseIP(addr) : null
  if (!ip) return null
  const bits = ip.version === 4 ? 32 : 128
  const prefix = prefixStr === undefined ? bits : Number(prefixStr)
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > bits) return null
  const shift = BigInt(bits - prefix)
  return { version: ip.version, network: (ip.value >> shift) << shift, prefix }
}

export function ipInCIDR(ip: ParsedIP, cidr: CIDR): boolean {
  if (ip.version !== cidr.version) return false
  const shift = BigInt((ip.version === 4 ? 32 : 128) - cidr.prefix)
  return ip.value >> shift === cidr.network >> shift
}

export function ipInRanges(ip: string, ranges: readonly CIDR[]): boolean {
  const parsed = parseIP(ip)
  if (!parsed) return false
  return ranges.some((range) => ipInCIDR(parsed, range))
}
