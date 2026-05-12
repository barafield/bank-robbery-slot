import {
  Application,
  Assets,
  Sprite,
  Graphics,
  AnimatedSprite,
  Container,
  Text
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
  getAsset('ui/HUD_.png')
)

const slotFrame = new Sprite(slotTexture)

slotFrame.anchor.set(0.5)
slotFrame.width = 1590
slotFrame.height = 1000
slotFrame.x = BASE_WIDTH / 2
slotFrame.y = BASE_HEIGHT / 2

gameContainer.addChild(slotFrame)

/* =======================================================
   INICIO DA FUNÇÃO BET (VALOR DA APOSTA)
======================================================= */
let betAmount = 100

const betText = new Text({
  text: `$ ${betAmount}`,
  style: {
  fill: '#7CFF4F',
  fontSize: 40,
  fontWeight: 'bold',
  stroke: '#000000',
  strokeThickness: 6,
  dropShadow: true,
  dropShadowBlur: 4
  }
})

betText.anchor.set(0.5)

betText.x = BASE_WIDTH * 0.667
betText.y = BASE_HEIGHT * 0.92

gameContainer.addChild(betText)

function updateBetText() {
  betText.text = `$ ${betAmount}`
}

/* =======================================================
   AUMENTAR E BAIXAR A POSTA
======================================================= */

const decreaseBetArea = new Graphics()

decreaseBetArea.circle(0, 0, 55)

decreaseBetArea.fill({
  color: 0xffffff,
  alpha: 0.001
})

decreaseBetArea.x = BASE_WIDTH * 0.76
decreaseBetArea.y = BASE_HEIGHT * 0.92

decreaseBetArea.eventMode = 'static'
decreaseBetArea.cursor = 'pointer'

gameContainer.addChild(decreaseBetArea)

const increaseBetArea = new Graphics()

increaseBetArea.circle(0, 0, 55)

increaseBetArea.fill({
  color: 0xffffff,
  alpha: 0.001
})

increaseBetArea.x = BASE_WIDTH * 0.92
increaseBetArea.y = BASE_HEIGHT * 0.92

increaseBetArea.eventMode = 'static'
increaseBetArea.cursor = 'pointer'

/* =======================================================
   VALOR DA APOSTA (ESTABELECIDO 50 A 50)
======================================================= */

gameContainer.addChild(increaseBetArea)

decreaseBetArea.on('pointerdown', () => {
   betAmount -= 50

  if (betAmount < 50) {
    betAmount = 50
  }

  updateBetText()
})

increaseBetArea.on('pointerdown', () => {
  betAmount += 50

  if (betAmount > 5000) {
    betAmount = 5000
  }

  updateBetText()
})

/* =======================================================
   BOTÃO SPIN APERTADO E NORMAL
======================================================= */

const spinNormalTexture = await Assets.load(
  getAsset('ui/spin_button_normal.png')
)

const spinPressedTexture = await Assets.load(
  getAsset('ui/spin_button_pressed.png')
)

const spinButton = new Sprite(spinNormalTexture)

spinButton.anchor.set(0.5)
spinButton.x = BASE_WIDTH * 0.84
spinButton.y = BASE_HEIGHT * 0.92
spinButton.width = 380
spinButton.height = 280

spinButton.eventMode = 'none'

gameContainer.addChild(spinButton)

/* =======================================================
   ÁREA INVISÍVEL DO BOTÃO SPIN
======================================================= */
const spinHitArea = new Graphics()

spinHitArea.circle(0, 0, 85)

spinHitArea.fill({
  color: 0xffffff,
  alpha: 0.001
})

spinHitArea.x = spinButton.x
spinHitArea.y = spinButton.y + 10

spinHitArea.eventMode = 'static'
spinHitArea.cursor = 'pointer'

gameContainer.addChild(spinHitArea)

gameContainer.setChildIndex(fox, gameContainer.children.length - 2)
gameContainer.setChildIndex(spinButton, gameContainer.children.length - 1)

const SPIN_BUTTON_X = BASE_WIDTH * 0.84
const SPIN_BUTTON_Y = BASE_HEIGHT * 0.92

function pressSpinButton() {
  spinButton.texture = spinPressedTexture
  spinButton.x = SPIN_BUTTON_X
  spinButton.y = SPIN_BUTTON_Y + 10
}

function releaseSpinButton() {
  spinButton.texture = spinNormalTexture
  spinButton.x = SPIN_BUTTON_X
  spinButton.y = SPIN_BUTTON_Y
}

spinHitArea.on('pointerdown', () => {
  if (isSpinning) return

  pressSpinButton()
  spinReels()
   
})
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
  bank: 0.90,
  dynamite: 1.45,
  safe: 1.15,
  handcuffs: 0.95,
  cell: 0.95,
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

const SYMBOL_SIZE = Math.min(GAP_X, GAP_Y) * 1.0

const startX =
  BASE_WIDTH / 2 - REEL_AREA_WIDTH / 2 + GAP_X / 2 + REEL_OFFSET_X

const REEL_CENTER_Y = BASE_HEIGHT / 2.05 + 15

const startY =
  REEL_CENTER_Y - REEL_AREA_HEIGHT / 2 + GAP_Y / 2 + REEL_OFFSET_Y

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
   MÁSCARA DA ÁREA DOS REELS
   -------------------------------------------------------
   Esconde símbolos que passam para fora da roleta.
======================================================= */

const reelsMask = new Graphics()

reelsMask.rect(
  startX - GAP_X / 2,
  startY - GAP_Y / 2,
  REEL_AREA_WIDTH,
  REEL_AREA_HEIGHT
)

reelsMask.fill({
  color: 0xffffff,
  alpha: 1
})

gameContainer.addChild(reelsMask)

/* =======================================================
   CRIAÇÃO DOS REELS COM CONTAINERS
   -------------------------------------------------------
   Agora cada coluna é um Container independente.
   Isso permite criar efeito de rolo/esteira de cassino.
======================================================= */

const reelContainers = []
const reelSymbols = []

const EXTRA_SYMBOLS = 2
const SYMBOLS_PER_COLUMN = ROWS + EXTRA_SYMBOLS

for (let col = 0; col < COLS; col++) {
  const reelContainer = new Container()

  reelContainer.x = startX + col * GAP_X
  reelContainer.y = startY

  reelContainer.mask = reelsMask

  reelContainers.push(reelContainer)
  gameContainer.addChild(reelContainer)

  const columnSymbols = []

  for (let row = 0; row < SYMBOLS_PER_COLUMN; row++) {
    const symbolKey =
      reelMatrix[row % ROWS][col]

    const symbol = new AnimatedSprite(symbolAnimations[symbolKey])

    symbol.anchor.set(0.5)
    symbol.animationSpeed = 0.5
    symbol.play()

    applySymbolSize(symbol, symbolKey)

    symbol.x = 0
    symbol.y = row * GAP_Y

    symbol.currentKey = symbolKey

    columnSymbols.push(symbol)
    reelContainer.addChild(symbol)
  }

  reelSymbols.push(columnSymbols)
}

/* =======================================================
   CONTROLE DE SPIN
======================================================= */

let isSpinning = false

/* =======================================================
   SPIN COM EFEITO DE ROLO
======================================================= */

function spinColumn(reelContainer, columnSymbols, columnIndex, onFinish) {
  let elapsed = 0

  const duration = 1200 + columnIndex * 300
  const speed = 42

  const originalY = reelContainer.y

  const spinTicker = () => {
    elapsed += app.ticker.deltaMS

    columnSymbols.forEach((symbol) => {
      symbol.y += speed

      if (symbol.y >= GAP_Y * SYMBOLS_PER_COLUMN) {
        symbol.y -= GAP_Y * SYMBOLS_PER_COLUMN

        const randomKey = getRandomSymbolKey()

        symbol.textures = symbolAnimations[randomKey]
        symbol.gotoAndPlay(0)

        applySymbolSize(symbol, randomKey)
        symbol.currentKey = randomKey
      }
    })

    if (elapsed >= duration) {
      app.ticker.remove(spinTicker)

      columnSymbols.forEach((symbol, index) => {
        const finalKey = getRandomSymbolKey()

        symbol.textures = symbolAnimations[finalKey]
        symbol.gotoAndPlay(0)

        applySymbolSize(symbol, finalKey)
        symbol.currentKey = finalKey

        symbol.y = index * GAP_Y
      })

      reelContainer.y = originalY + 10

      setTimeout(() => {
        reelContainer.y = originalY
        onFinish()
      }, 90)
    }
  }

  app.ticker.add(spinTicker)
}

function spinReels() {
  if (isSpinning) return

  isSpinning = true

  let finishedColumns = 0

  reelContainers.forEach((reelContainer, columnIndex) => {
    spinColumn(
      reelContainer,
      reelSymbols[columnIndex],
      columnIndex,
      () => {
        finishedColumns++

        if (finishedColumns === reelContainers.length) {
          isSpinning = false
          releaseSpinButton()
          console.log('SPIN finalizado com efeito de rolo')
        }
      }
    )
  })
}



/* =======================================================
   EVENTOS DO BOTÃO SPIN - Atualizar
======================================================= */

spinHitArea.on('pointerdown', () => {
  console.log('CLICOU NO SPIN')

  if (isSpinning) return

  pressSpinButton()
  spinReels()
})

/* =======================================================
   RESPONSIVIDADE
======================================================= */

resizeGame()
window.addEventListener('resize', resizeGame)

