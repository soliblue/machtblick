import sharp from 'sharp'

export const encodeCandidatePortraitJpeg = (input, width = 320) => sharp(input)
  .rotate()
  .resize({ width, height: width, fit: 'cover', position: 'attention', withoutEnlargement: false })
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .jpeg({ quality: 82, mozjpeg: true })
  .toBuffer()
