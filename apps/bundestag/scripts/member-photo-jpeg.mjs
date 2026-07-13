import sharp from 'sharp'

export const encodeMemberPhotoJpeg = (input, width = 320) => sharp(input)
  .rotate()
  .resize({ width, withoutEnlargement: true })
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .jpeg({ quality: 80, mozjpeg: true })
  .toBuffer()
