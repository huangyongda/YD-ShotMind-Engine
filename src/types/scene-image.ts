export const SCENE_ANGLES = [
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

export type SceneAngle = (typeof SCENE_ANGLES)[number]

export const SCENE_ANGLE_LABELS: Record<SceneAngle, string> = {
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

export function isSceneAngle(value: string): value is SceneAngle {
  return (SCENE_ANGLES as readonly string[]).includes(value)
}

export type SceneAngleImageLike = {
  angle: string
  filePath: string
}

export function getSceneImageStats(angleImages: SceneAngleImageLike[]) {
  const uploadedAngles = new Set(angleImages.map((item) => item.angle))
  const missingAngles = SCENE_ANGLES.filter((angle) => !uploadedAngles.has(angle))

  return {
    uploadedCount: uploadedAngles.size,
    missingAngles
  }
}
