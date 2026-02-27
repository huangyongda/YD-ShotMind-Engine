export const CHARACTER_ANGLES = [
  'front',
  'front_left',
  'left',
  'back_left',
  'back',
  'back_right',
  'right',
  'front_right',
  'top',
  'bottom'
] as const

export type CharacterAngle = (typeof CHARACTER_ANGLES)[number]

export const CHARACTER_ANGLE_LABELS: Record<CharacterAngle, string> = {
  front: '正面',
  front_left: '左前',
  left: '左侧',
  back_left: '左后',
  back: '背面',
  back_right: '右后',
  right: '右侧',
  front_right: '右前',
  top: '俯视',
  bottom: '仰视'
}

export function isCharacterAngle(value: string): value is CharacterAngle {
  return (CHARACTER_ANGLES as readonly string[]).includes(value)
}

export type CharacterAngleImageLike = {
  angle: string
  filePath: string
}

export function getCharacterImageStats(angleImages: CharacterAngleImageLike[]) {
  const uploadedAngles = new Set(angleImages.map((item) => item.angle))
  const missingAngles = CHARACTER_ANGLES.filter((angle) => !uploadedAngles.has(angle))

  return {
    uploadedCount: uploadedAngles.size,
    missingAngles
  }
}
