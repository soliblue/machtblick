export function ensureTextColumn(db, table, column) {
  const exists = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)
  if (exists) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
    if (!columns.includes(column)) db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} text`).run()
  }
}
