/**
 * Ghép nội dung TTS cho đơn KDS — đọc đủ bàn + từng món.
 */

function cleanNoteForSpeech(note) {
  if (!note) return ''
  return String(note)
    .replace(/%/g, ' phần trăm')
    .replace(/\s*\|\s*/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

function itemLine(item) {
  const qty = Number(item?.quantity) || 1
  const name = (
    item?.product?.name
    || item?.productName
    || item?.name
    || 'món'
  ).toString().trim()

  let line = `${qty} ${name}`
  const note = cleanNoteForSpeech(item?.note)
  if (note) {
    line += `, ${note}`
  } else {
    const extras = []
    if (item?.icePercent != null && item?.icePercent !== '') {
      extras.push(`đá ${item.icePercent} phần trăm`)
    }
    if (item?.sugarPercent != null && item?.sugarPercent !== '') {
      extras.push(`đường ${item.sugarPercent} phần trăm`)
    }
    if (extras.length) line += `, ${extras.join(', ')}`
  }
  return line
}

/**
 * @param {'new' | 'pending'} kind
 */
export function buildOrderAnnounceText({ tableName, items = [] } = {}, kind = 'new') {
  const table = (tableName || 'Có bàn').toString().trim()
  const lines = (items || []).map(itemLine).filter(Boolean)
  const head = kind === 'pending'
    ? `Có đơn chờ pha chế tại ${table}`
    : `${table} có đơn mới`

  if (!lines.length) {
    const count = (items || []).reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0) || 1
    return `${head}. ${count} món.`
  }
  return `${head}. ${lines.join('. ')}.`
}
