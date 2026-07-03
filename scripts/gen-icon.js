#!/usr/bin/env node
/**
 * Generates assets/icon.png — 1024×1024 Bubble MCP app icon.
 * Design: purple gradient rounded-square (iOS style) + clean geometric white "B".
 * Pure Node.js built-ins only (zlib).
 */
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

const SIZE = 1024
const img  = new Uint8Array(SIZE * SIZE * 4)  // RGBA, transparent

// ── Helpers ───────────────────────────────────────────────────────────────────

function blendPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
  const i   = (y * SIZE + x) * 4
  const sa  = a / 255
  const da  = img[i + 3] / 255
  const oa  = sa + da * (1 - sa)
  if (oa === 0) return
  img[i]     = Math.round((r * sa + img[i]     * da * (1 - sa)) / oa)
  img[i + 1] = Math.round((g * sa + img[i + 1] * da * (1 - sa)) / oa)
  img[i + 2] = Math.round((b * sa + img[i + 2] * da * (1 - sa)) / oa)
  img[i + 3] = Math.round(oa * 255)
}

// Anti-aliased filled circle
function fillCircle(cx, cy, radius, r, g, b, a = 255) {
  const lo = Math.max(0,         Math.floor(cy - radius - 2))
  const hi = Math.min(SIZE - 1,  Math.ceil (cy + radius + 2))
  for (let y = lo; y <= hi; y++) {
    const dy = y - cy
    const hw = Math.sqrt(Math.max(0, radius * radius - dy * dy))
    const x0 = cx - hw, x1 = cx + hw
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      const cov = Math.max(0, Math.min(1, x1 - x, x - x0 + 1, 1))
      blendPixel(x, y, r, g, b, Math.round(cov * a))
    }
  }
}

function fillRect(x0, y0, x1, y1, r, g, b, a = 255) {
  for (let y = Math.max(0, y0); y <= Math.min(SIZE - 1, y1); y++)
    for (let x = Math.max(0, x0); x <= Math.min(SIZE - 1, x1); x++)
      blendPixel(x, y, r, g, b, a)
}

// Rounded rectangle (filled)
function fillRoundRect(x0, y0, x1, y1, cr, r, g, b, a = 255) {
  fillRect  (x0 + cr, y0,      x1 - cr, y1,      r, g, b, a)  // centre slab
  fillRect  (x0,      y0 + cr, x0 + cr, y1 - cr, r, g, b, a)  // left slab
  fillRect  (x1 - cr, y0 + cr, x1,      y1 - cr, r, g, b, a)  // right slab
  fillCircle(x0 + cr, y0 + cr, cr, r, g, b, a)                 // TL corner
  fillCircle(x1 - cr, y0 + cr, cr, r, g, b, a)                 // TR corner
  fillCircle(x0 + cr, y1 - cr, cr, r, g, b, a)                 // BL corner
  fillCircle(x1 - cr, y1 - cr, cr, r, g, b, a)                 // BR corner
}

// ── 1. Background: gradient purple rounded square ─────────────────────────────
// Draw a gradient by sweeping diagonal bands, then mask to a rounded rect.

const MARGIN = 40
const CORNER = 210

// Build gradient mask: paint gradient into the rounded rect area
for (let y = MARGIN; y < SIZE - MARGIN; y++) {
  for (let x = MARGIN; x < SIZE - MARGIN; x++) {
    // Inside rounded rect?
    const inCornerTL = x < MARGIN + CORNER && y < MARGIN + CORNER
    const inCornerTR = x > SIZE - MARGIN - CORNER && y < MARGIN + CORNER
    const inCornerBL = x < MARGIN + CORNER && y > SIZE - MARGIN - CORNER
    const inCornerBR = x > SIZE - MARGIN - CORNER && y > SIZE - MARGIN - CORNER
    if (inCornerTL) {
      const dx = x - (MARGIN + CORNER), dy = y - (MARGIN + CORNER)
      if (dx * dx + dy * dy > CORNER * CORNER) continue
    }
    if (inCornerTR) {
      const dx = x - (SIZE - MARGIN - CORNER), dy = y - (MARGIN + CORNER)
      if (dx * dx + dy * dy > CORNER * CORNER) continue
    }
    if (inCornerBL) {
      const dx = x - (MARGIN + CORNER), dy = y - (SIZE - MARGIN - CORNER)
      if (dx * dx + dy * dy > CORNER * CORNER) continue
    }
    if (inCornerBR) {
      const dx = x - (SIZE - MARGIN - CORNER), dy = y - (SIZE - MARGIN - CORNER)
      if (dx * dx + dy * dy > CORNER * CORNER) continue
    }

    // Diagonal gradient: top-left = #7c6ff7, bottom-right = #4833c8
    const t = (x + y) / (2 * (SIZE - 1))
    const r = Math.round(0x7c + (0x48 - 0x7c) * t)
    const g = Math.round(0x6f + (0x33 - 0x6f) * t)
    const b = Math.round(0xf7 + (0xc8 - 0xf7) * t)
    blendPixel(x, y, r, g, b, 255)
  }
}

// ── 2. White geometric "B" ────────────────────────────────────────────────────
// Each bump is a proper D-shape: filled rectangle (left flat face) + semicircle (right curved cap).
// Circle centers are placed at BUMP_X + radius so they never bleed left of the stem.

const WR = 255, WG = 255, WB = 255

const TOTAL_H  = 520         // total letter height (bigger for logo feel)
const STEM_W   = 96          // stem width

// Bump dimensions — top is slightly smaller than bottom (classic B proportion)
const TOP_H    = 228         // top D height  (44 % of total)
const TOP_R    = TOP_H / 2   // 114  — radius of top semicircle

const GAP      = 20          // gap between the two bumps
const BOT_H    = TOTAL_H - TOP_H - GAP  // 272  (53 %)
const BOT_R    = BOT_H / 2              // 136

// Letter total pixel width = STEM_W + 2 * max_R (semicircle spans 2×radius)
// Centre the letter horizontally
const LETTER_W  = STEM_W + 2 * BOT_R    // 96 + 272 = 368
const STEM_X    = Math.round((SIZE - LETTER_W) / 2)   // ≈ 328
const LETTER_Y  = Math.round((SIZE - TOTAL_H) / 2)    // ≈ 252

const BUMP_X   = STEM_X + STEM_W        // right edge of stem
const BOT_Y    = LETTER_Y + TOP_H + GAP

// ── Draw stem ──────────────────────────────────────────────────────────────
fillRect(STEM_X, LETTER_Y, STEM_X + STEM_W, LETTER_Y + TOTAL_H, WR, WG, WB)

// ── Top D-shape: flat rect + right semicircle ──────────────────────────────
// Rect fills from BUMP_X to circle centre (so left face of D is solid)
fillRect(BUMP_X, LETTER_Y, BUMP_X + TOP_R, LETTER_Y + TOP_H, WR, WG, WB)
// Semicircle: centre at (BUMP_X + TOP_R, LETTER_Y + TOP_R) → leftmost at BUMP_X (no bleed)
fillCircle(BUMP_X + TOP_R, LETTER_Y + TOP_R, TOP_R, WR, WG, WB)

// ── Bottom D-shape: flat rect + right semicircle ───────────────────────────
fillRect(BUMP_X, BOT_Y, BUMP_X + BOT_R, BOT_Y + BOT_H, WR, WG, WB)
fillCircle(BUMP_X + BOT_R, BOT_Y + BOT_R, BOT_R, WR, WG, WB)

// ── PNG encode ────────────────────────────────────────────────────────────────

function crc32(buf) {
  if (!crc32.t) {
    crc32.t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
      crc32.t[i] = c
    }
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crc32.t[(crc ^ buf[i]) & 0xff]
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const t   = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8; ihdr[9] = 6  // 8-bit RGBA

const rows = Buffer.alloc(SIZE * (1 + SIZE * 4))
for (let y = 0; y < SIZE; y++) {
  rows[y * (1 + SIZE * 4)] = 0
  for (let x = 0; x < SIZE; x++) {
    const s = (y * SIZE + x) * 4
    const d = y * (1 + SIZE * 4) + 1 + x * 4
    rows[d] = img[s]; rows[d+1] = img[s+1]; rows[d+2] = img[s+2]; rows[d+3] = img[s+3]
  }
}

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(rows, { level: 6 })),
  chunk('IEND', Buffer.alloc(0)),
])

const out = path.join(__dirname, '..', 'assets', 'icon.png')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, png)
console.log(`Icon → ${out}  (${(png.length/1024).toFixed(0)} KB)`)
