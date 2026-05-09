import './style.css'
import {
  Application,
  Assets,
  Sprite,
  Graphics,
  AnimatedSprite,
  Container
} from 'pixi.js'

/* =======================================================
   CARREGAMENTO DOS ASSETS PELO VITE
======================================================= */

const assetModules = import.meta.glob('./assets/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
})

console.log('ASSETS ENCONTRADOS:', Object.keys(assetModules))

function getAsset(path) {
  const asset = assetModules[`./assets/${path}`]

  if (!asset) {
    console.error(`Asset não encontrado: ./assets/${path}`)
  }

  return asset
}

/* =======================================================
   CONFIGURAÇÕES GERAIS
======================================================= */

const BASE_WIDTH = 1920
const BASE_HEIGHT = 1080

const app = new Application()

await app.init({
  resizeTo: window,
  background: '#000000'
})

document.body.appendChild(app.canvas)

const gameContainer = new Container()
app.stage.addChild(gameContainer)

/* =======================================================
   HELPERS
======================================================= */

async function loadSequence(folder, prefix) {
  const paths = Object.keys(assetModules)
    .filter((path) => path.includes(`./assets/${folder}/`))
    .filter((path) => path.includes(prefix))
    .sort()

  const frames = []

  for (const path of paths) {
    const texture = await Assets.load(assetModules[path])
    frames.push(texture)
  }

  if (frames.length === 0) {
    console.error(`Nenhum frame carregado para: ${folder}/${prefix}`)
  }

  return frames
}

function resizeGame() {
  const scale = Math.min(
    app.screen.width / BASE_WIDTH,
    app.screen.height / BASE_HEIGHT
  )

  gameContainer.scale.set(scale)
  gameContainer.x = (app.screen.width - BASE_WIDTH * scale) / 2
  gameContainer.y = (app.screen.height - BASE_HEIGHT * scale) / 2
}

/* =======================================================
   BACKGROUND
======================================================= */

const backgroundTexture = await Assets.load(
  getAsset('background/BACKGROUND.png')
)

const background = new Sprite(backgroundTexture)
background.width = BASE_WIDTH
background.height = BASE_HEIGHT
gameContainer.addChild(background)

/* =======================================================
   RAPOSA - IDLE
======================================================= */

const foxFrames = await loadSequence(
  'characters/Idle',
  'Fox-Idle'
)

const fox = new AnimatedSprite(foxFrames)

fox.anchor.set(0.5)
fox.width = 440
fox.height = 600
fox.scale.x *= -1

fox.x = BASE_WIDTH * 0.88
fox.y = BASE_HEIGHT * 0.65

fox.animationSpeed = 0.5
fox.play()

gameContainer.addChild(fox)

/* =======================================================
   HUD COMPLETO
======================================================= */

const slotTexture = await Assets.load(
  getAsset('ui/hud completo.png')
)

const slotFrame = new Sprite(slotTexture)

slotFrame.anchor.set(0.5)
slotFrame.width = 1850
slotFrame.height = 1100
slotFrame.x = BASE_WIDTH / 2
slotFrame.y = BASE_HEIGHT / 2

gameContainer.addChild(slotFrame)

/* =======================================================
   ANIMAÇÕES DOS SÍMBOLOS
======================================================= */

const symbolAnimations = {
  bank: await loadSequence('reels/Bank', 'Bank'),
  dynamite: await loadSequence('reels/Dynamit', 'Dynamit'),
  safe: await loadSequence('reels/Safe', 'Safe'),
  handcuffs: await loadSequence('reels/Handcuffs', 'Handcuffs'),
  cell: await loadSequence('reels/Cell', 'Cell'),
  A: await loadSequence('reels/Littera_A', 'Littera_A'),
  K: await loadSequence('reels/Littera_K', 'Littera_K'),
  Q: await loadSequence('reels/Littera_Q', 'Littera_Q'),
  J: await loadSequence('reels/Littera_J', 'Littera_J'),
  ten: await loadSequence('reels/Number_10', 'Number_10')
}

const symbolKeys = Object.keys(symbolAnimations)

/* =======================================================
   ESCALA INDIVIDUAL DOS SÍMBOLOS
======================================================= */

const symbolScaleMap = {
  bank: 1.0,
  dynamite: 1.45,
  safe: 1.15,
  handcuffs: 1.1,
  cell: 1.0,
  A: 0.95,
  K: 0.95,
  Q: 0.95,
  J: 0.95,
  ten: 0.95
}

/* =======================================================
   MATRIZ DOS REELS
======================================================= */

const reelMatrix = [
  ['dynamite', 'handcuffs', 'dynamite', 'cell', 'safe', 'bank'],
  ['bank', 'J', 'A', 'K', 'Q', 'ten'],
  ['Q', 'handcuffs', 'cell', 'safe', 'bank', 'safe'],
  ['bank', 'ten', 'K', 'dynamite', 'J', 'handcuffs'],
  ['safe', 'dynamite', 'handcuffs', 'cell', 'A', 'ten']
]

const COLS = 6
const ROWS = 5

const REEL_AREA_WIDTH = 1000
const REEL_AREA_HEIGHT = 750

const REEL_OFFSET_X = 0
const REEL_OFFSET_Y = -5

const GAP_X = REEL_AREA_WIDTH / COLS
const GAP_Y = REEL_AREA_HEIGHT / ROWS

const SYMBOL_SIZE = Math.min(GAP_X, GAP_Y) * 1.1

const startX =
  BASE_WIDTH / 2 - REEL_AREA_WIDTH / 2 + GAP_X / 2 + REEL_OFFSET_X

const REEL_CENTER_Y = BASE_HEIGHT / 2 + 15

const startY =
  REEL_CENTER_Y - REEL_AREA_HEIGHT / 2 + GAP_Y / 2 + REEL_OFFSET_Y

const reelSymbols = []

function applySymbolSize(symbol, symbolKey) {
  const individualScale = symbolScaleMap[symbolKey] || 1
  const finalSize = SYMBOL_SIZE * individualScale

  const textureWidth = symbol.texture.width
  const textureHeight = symbol.texture.height
  const ratio = textureWidth / textureHeight

  if (ratio >= 1) {
    symbol.width = finalSize
    symbol.height = finalSize / ratio
  } else {
    symbol.height = finalSize
    symbol.width = finalSize * ratio
  }
}

function getRandomSymbolKey() {
  const randomIndex = Math.floor(Math.random() * symbolKeys.length)
  return symbolKeys[randomIndex]
}

/* =======================================================
   CRIAÇÃO DOS REELS
======================================================= */

reelMatrix.forEach((row, rowIndex) => {
  row.forEach((symbolKey, colIndex) => {
    const symbol = new AnimatedSprite(symbolAnimations[symbolKey])

    symbol.anchor.set(0.5)
    symbol.animationSpeed = 0.5
    symbol.play()

    applySymbolSize(symbol, symbolKey)

    symbol.x = startX + colIndex * GAP_X
    symbol.y = startY + rowIndex * GAP_Y

    reelSymbols.push(symbol)
    gameContainer.addChild(symbol)
  })
})

/* =======================================================
   RAPOSA POR CIMA
======================================================= */

gameContainer.setChildIndex(fox, gameContainer.children.length - 1)

/* =======================================================
   ÁREA INVISÍVEL DO BOTÃO SPIN
======================================================= */

const spinArea = new Graphics()

spinArea.rect(-200, 50, 150, 150)
spinArea.fill({
  color: 0xffffff,
  alpha: 0.001
})

spinArea.x = BASE_WIDTH * 0.81
spinArea.y = BASE_HEIGHT * 0.805

spinArea.eventMode = 'static'
spinArea.cursor = 'pointer'

gameContainer.addChild(spinArea)

/* =======================================================
   SPIN
======================================================= */

let isSpinning = false

function spinReels() {
  if (isSpinning) return

  isSpinning = true

  let spinCount = 0

  const maxSpinCount = 30
  const spinSpeed = 55

  const spinInterval = setInterval(() => {
    reelSymbols.forEach((symbol) => {
      const randomKey = getRandomSymbolKey()

      symbol.textures = symbolAnimations[randomKey]
      symbol.gotoAndPlay(0)

      applySymbolSize(symbol, randomKey)
    })

    spinCount++

    if (spinCount >= maxSpinCount) {
      clearInterval(spinInterval)

      reelSymbols.forEach((symbol) => {
        const finalKey = getRandomSymbolKey()

        symbol.textures = symbolAnimations[finalKey]
        symbol.gotoAndPlay(0)

        applySymbolSize(symbol, finalKey)
      })

      isSpinning = false
      console.log('SPIN finalizado')
    }
  }, spinSpeed)
}

/* =======================================================
   EVENTOS DO BOTÃO SPIN
======================================================= */

spinArea.on('pointerdown', () => {
  spinArea.scale.set(0.97)
})

spinArea.on('pointerup', () => {
  spinArea.scale.set(1)
  spinReels()
})

spinArea.on('pointerupoutside', () => {
  spinArea.scale.set(1)
})

/* =======================================================
   RESPONSIVIDADE
======================================================= */

resizeGame()
window.addEventListener('resize', resizeGame)