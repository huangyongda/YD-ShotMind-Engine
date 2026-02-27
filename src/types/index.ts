import type { Project, Character, Scene, Episode, Shot, Storyboard, Asset, Task, ProjectStatus, TimeOfDay, ShotType, ShotStatus, AssetType, AssetSource, TaskType, TaskStatus, EpisodeStatus } from '@prisma/client'

export type { Project, Character, Scene, Episode, Shot, Storyboard, Asset, Task, ProjectStatus, TimeOfDay, ShotType, ShotStatus, AssetType, AssetSource, TaskType, TaskStatus, EpisodeStatus }

export type ProjectWithRelations = Project & {
  characters?: Character[]
  scenes?: Scene[]
  episodes?: Episode[]
}

export type EpisodeWithShots = Episode & {
  shots?: Shot[]
}

export type StoryboardWithShots = Storyboard & {
  shots?: Shot[]
}

export type EpisodeWithStoryboards = Episode & {
  storyboards?: StoryboardWithShots[]
  shots?: Shot[]
}

export type ShotWithRelations = Shot & {
  character?: Character | null
  scene?: Scene | null
  storyboard?: Storyboard | null
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Form types
export interface CreateProjectInput {
  name: string
  description?: string
  totalEpisodes?: number
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  totalEpisodes?: number
  status?: ProjectStatus
  coverImage?: string
}

export interface CreateCharacterInput {
  projectId: number
  name: string
  description?: string
  avatarPath?: string
  traits?: {
    age?: string
    personality?: string
    appearance?: string
  }
  voiceId?: string
}

export interface CreateSceneInput {
  projectId: number
  name: string
  description?: string
  backgroundPath?: string
  location?: string
  timeOfDay?: TimeOfDay
}

export interface CreateEpisodeInput {
  projectId: number
  episodeNumber: number
  title?: string
  synopsis?: string
}

export interface CreateShotInput {
  episodeId: number
  storyboardId?: number
  shotNumber: number
  shotType?: ShotType
  shotDescription?: string
  videoPrompt?: string
  characterId?: number
  sceneId?: number
  characterImage?: string
  sceneImage?: string
}

export interface CreateStoryboardInput {
  episodeId: number
  boardNumber: number
  title?: string
  description?: string
}

// Generation types
export interface GenerateOutlineInput {
  projectId: number
  description: string
  totalEpisodes: number
}

export interface GenerateCharactersInput {
  projectId: number
  description: string
}

export interface GenerateScenesInput {
  projectId: number
}

export interface GenerateEpisodeInput {
  projectId: number
  episodeNumber: number
  previousEpisodeSummary?: string
}

export interface GenerateShotsInput {
  episodeId: number
  dialogueText: string
}
