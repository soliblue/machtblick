import assert from 'node:assert/strict'
import test from 'node:test'
import sharp from 'sharp'
import { encodeCandidatePortraitJpeg } from './candidate-portrait-jpeg.mjs'

test('encodes a square 320 pixel JPEG', async () => {
  const output = await encodeCandidatePortraitJpeg(await sharp({
    create: {
      width: 640,
      height: 480,
      channels: 3,
      background: { r: 120, g: 80, b: 40 }
    }
  }).png().toBuffer())
  const metadata = await sharp(output).metadata()
  assert.equal(metadata.format, 'jpeg')
  assert.equal(metadata.width, 320)
  assert.equal(metadata.height, 320)
})
