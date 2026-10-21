// Readable prefixed IDs: EMP-0001, TRN-000123 … The Counter table holds the last number per prefix.
import { prisma } from '../db.ts'
import { ENTITIES } from '../../shared/entities.ts'

const PAD: Record<string, number> = Object.fromEntries(ENTITIES.map((e) => [e.prefix, e.pad]))
PAD.LOG = 6

export function formatId(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(PAD[prefix] ?? 4, '0')}`
}

/** Reserve `count` consecutive IDs. Pass a transaction client when inside a transaction. */
export async function nextIds(prefix: string, count = 1, tx: any = prisma): Promise<string[]> {
  if (count <= 0) return []
  const row = await tx.counter.upsert({
    where: { prefix },
    create: { prefix, value: count },
    update: { value: { increment: count } },
  })
  const last = row.value
  return Array.from({ length: count }, (_, i) => formatId(prefix, last - count + 1 + i))
}
export const nextId = async (prefix: string, tx: any = prisma) => (await nextIds(prefix, 1, tx))[0]

/** Make every counter at least as high as the highest existing ID (after imports or manual edits). */
export async function syncCounters() {
  const tables = [...ENTITIES.map((e) => ({ table: e.table, prefix: e.prefix })), { table: 'ChangeLog', prefix: 'LOG' }]
  for (const { table, prefix } of tables) {
    const rows: { m: number | null }[] = await prisma.$queryRawUnsafe(
      `SELECT MAX(CAST(SUBSTR(id, ${prefix.length + 2}) AS INTEGER)) AS m FROM "${table}" WHERE id LIKE '${prefix}-%'`)
    const max = Number(rows[0]?.m ?? 0)
    const cur = await prisma.counter.findUnique({ where: { prefix } })
    if (!cur || cur.value < max) await prisma.counter.upsert({ where: { prefix }, create: { prefix, value: max }, update: { value: max } })
  }
}
