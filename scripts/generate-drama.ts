import 'dotenv/config'
import { prisma } from '../src/lib/db'
import { generateWithAI } from '../src/lib/ai/orchestrator'

const projectId = 3 // 霸道总裁爱上我

async function generateCharacters() {
  console.log('=== 生成角色设定 ===')

  const prompt = `
请根据以下短剧简介生成角色设定。

短剧简介：讲述一个平凡的女孩不小心闯入了霸道总裁的世界，从相知相爱到经历种种误会和困难，最终收获真爱的浪漫故事。共10集。

请生成主要角色（4个），每个角色包含：
1. 姓名
2. 年龄
3. 性格特点
4. 外貌描述
5. 角色背景

以JSON数组格式输出，不要其他内容。
`

  const result = await generateWithAI(prompt)
  console.log('角色:', result)

  // 解析并保存
  const characters = JSON.parse(result)

  for (const char of characters) {
    await prisma.character.create({
      data: {
        projectId,
        name: char.姓名 || char.name,
        description: char.角色背景 || char.background,
        traits: {
          age: char.年龄 || char.age,
          personality: char.性格特点 || char.personality,
          appearance: char.外貌描述 || char.appearance
        }
      }
    })
    console.log(`✓ 创建角色: ${char.姓名 || char.name}`)
  }

  return characters
}

async function generateScenes() {
  console.log('\n=== 生成场景设定 ===')

  const prompt = `
请根据以下短剧简介生成场景设定。

短剧简介：讲述一个平凡的女孩不小心闯入了霸道总裁的世界，从相知相爱到经历种种误会和困难，最终收获真爱的浪漫故事。共10集。

请生成主要场景（5个），每个场景包含：
1. 场景名称
2. 地点描述
3. 时间段（MORNING/AFTERNOON/EVENING/NIGHT）
4. 场景氛围

以JSON数组格式输出，不要其他内容。
`

  const result = await generateWithAI(prompt)
  console.log('场景:', result)

  const scenes = JSON.parse(result)

  for (const scene of scenes) {
    await prisma.scene.create({
      data: {
        projectId,
        name: scene.场景名称 || scene.name,
        description: scene.场景氛围 || scene.atmosphere,
        location: scene.地点描述 || scene.location,
        timeOfDay: scene.时间段 || scene.timeOfDay
      }
    })
    console.log(`✓ 创建场景: ${scene.场景名称 || scene.name}`)
  }

  return scenes
}

async function generateEpisodes() {
  console.log('\n=== 生成剧集大纲 ===')

  const prompt = `
请根据以下信息生成10集短剧大纲。

总简介：讲述一个平凡的女孩不小心闯入了霸道总裁的世界，从相知相爱到经历种种误会和困难，最终收获真爱的浪漫故事。

角色：霸道总裁冷峻轩，平凡女孩林小暖，富二代千金苏美莲，暖男医生顾晨

场景：盛世集团总部、星光咖啡厅、林小暖的公寓、冷峻轩的豪华别墅、苏家大宅

请为每一集生成：
1. episode: 集号
2. title: 集标题
3. synopsis: 本集简介（50-100字）

以JSON数组格式输出，不要其他内容。共10集。
`

  const result = await generateWithAI(prompt)
  console.log('剧集大纲:', result)

  const episodes = JSON.parse(result)

  for (const ep of episodes) {
    await prisma.episode.create({
      data: {
        projectId,
        episodeNumber: ep.episode,
        title: ep.title,
        synopsis: ep.synopsis,
        status: 'COMPLETED'
      }
    })
    console.log(`✓ 创建第${ep.episode}集: ${ep.title}`)
  }

  return episodes
}

async function generateShots() {
  console.log('\n=== 生成分镜 ===')

  // 获取所有剧集
  const episodes = await prisma.episode.findMany({
    where: { projectId },
    orderBy: { episodeNumber: 'asc' }
  })

  const characters = await prisma.character.findMany({ where: { projectId } })
  const scenes = await prisma.scene.findMany({ where: { projectId } })

  for (const episode of episodes) {
    console.log(`\n生成分镜: 第${episode.episodeNumber}集`)

    const prompt = `
请根据以下信息生成分镜脚本。

集标题：${episode.title}
集简介：${episode.synopsis}

角色：${characters.map(c => c.name).join('、')}
场景：${scenes.map(s => s.name).join('、')}

请为这一集生成4-6个分镜，包含：
1. shotNumber: 分镜序号
2. shotType: 镜头类型（MEDIUM_SHOT/CLOSE_UP/WIDE_SHOT/MEDIUM_CLOSE_UP/TWO_SHOT）
3. shotDescription: 分镜描述
4. videoPrompt: 视频提示词（英文，用于AI生成视频）

选择最合适的角色和场景。

以JSON数组格式输出，不要其他内容。
`

    const result = await generateWithAI(prompt)
    // console.log('分镜:', result)

    try {
      const shots = JSON.parse(result)

      for (let i = 0; i < shots.length; i++) {
        const shot = shots[i]
        // 匹配角色和场景
        const character = characters.find(c => c.name.includes(shot.character) || (shot.character && c.name.includes(shot.character)))
        const scene = scenes.find(s => s.name.includes(shot.scene) || (shot.scene && s.name.includes(shot.scene)))

        await prisma.shot.create({
          data: {
            episodeId: episode.id,
            shotNumber: shot.shotNumber || (i + 1),
            shotType: shot.shotType || 'MEDIUM_SHOT',
            shotDescription: shot.shotDescription,
            videoPrompt: shot.videoPrompt,
            characterId: character?.id,
            sceneId: scene?.id,
            status: 'PENDING'
          }
        })
        console.log(`✓ 分镜${shot.shotNumber || (i+1)}: ${shot.shotDescription?.substring(0, 30)}...`)
      }
    } catch (e) {
      console.error('解析分镜失败:', e)
      // 创建默认分镜
      await prisma.shot.create({
        data: {
          episodeId: episode.id,
          shotNumber: 1,
          shotType: 'MEDIUM_SHOT',
          shotDescription: episode.synopsis,
          videoPrompt: 'A romantic scene in a modern office',
          status: 'PENDING'
        }
      })
    }
  }
}

async function main() {
  try {
    console.log('开始生成短剧数据...\n')

    await generateCharacters()
    await generateScenes()
    await generateEpisodes()
    await generateShots()

    console.log('\n=== 完成！===')
    console.log('短剧数据已全部生成！')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
