import assert from 'node:assert/strict'
import test from 'node:test'
import sharp from 'sharp'
import { encodeMemberPhotoJpeg } from './member-photo-jpeg.mjs'

test('encodes transparent PNG input as an opaque JPEG', async () => {
  const input = await sharp({
    create: {
      width: 4,
      height: 4,
      channels: 4,
      background: { r: 16, g: 32, b: 64, alpha: 0 },
    },
  })
    .png()
    .toBuffer()

  const output = await encodeMemberPhotoJpeg(input)
  const metadata = await sharp(output).metadata()
  const { data } = await sharp(output).raw().toBuffer({ resolveWithObject: true })

  assert.equal(metadata.format, 'jpeg')
  assert.equal(metadata.hasAlpha, false)
  assert.ok(data.every((channel) => channel > 240))
})
