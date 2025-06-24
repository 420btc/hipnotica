"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Brain, Eye, Layers, Zap, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react"

interface DreamLevel {
  level: number
  name: string
  description: string
  timeMultiplier: number
  wordDistortion: number
  color: string
  effects: string[]
}

interface InceptionGameProps {
  onBack: () => void
  theme: string
}

const DREAM_LEVELS: DreamLevel[] = [
  {
    level: 0,
    name: "Realidad",
    description: "El mundo consciente donde todo es claro",
    timeMultiplier: 1,
    wordDistortion: 0,
    color: "from-blue-600 to-cyan-600",
    effects: ["clarity", "logic"],
  },
  {
    level: 1,
    name: "Primer Sueño",
    description: "Las palabras comienzan a cambiar sutilmente",
    timeMultiplier: 5,
    wordDistortion: 0.2,
    color: "from-purple-600 to-blue-600",
    effects: ["subtle-shift", "mild-distortion"],
  },
  {
    level: 2,
    name: "Sueño Profundo",
    description: "La realidad se vuelve más fluida y simbólica",
    timeMultiplier: 20,
    wordDistortion: 0.5,
    color: "from-indigo-600 to-purple-600",
    effects: ["fluid-reality", "symbolic-thinking"],
  },
  {
    level: 3,
    name: "Limbo Onírico",
    description: "Las palabras se transforman completamente",
    timeMultiplier: 100,
    wordDistortion: 0.8,
    color: "from-violet-600 to-indigo-600",
    effects: ["complete-transformation", "time-dilation"],
  },
  {
    level: 4,
    name: "Limbo Profundo",
    description: "Realidad fragmentada, palabras como símbolos puros",
    timeMultiplier: 500,
    wordDistortion: 1.0,
    color: "from-pink-600 to-violet-600",
    effects: ["fragmented-reality", "pure-symbols"],
  },
]

const BASE_WORDS = [
  "realidad",
  "tiempo",
  "espacio",
  "memoria",
  "identidad",
  "verdad",
  "ilusión",
  "percepción",
  "conciencia",
  "subconsciente",
  "despertar",
  "dormir",
  "soñar",
  "existir",
  "pensar",
  "sentir",
  "crear",
  "destruir",
  "construir",
  "imaginar",
  "recordar",
  "olvidar",
  "conocer",
  "ignorar",
  "luz",
  "sombra",
  "color",
  "forma",
  "sonido",
  "silencio",
  "movimiento",
  "quietud",
  "amor",
  "miedo",
  "esperanza",
  "desesperación",
  "alegría",
  "tristeza",
  "paz",
  "caos",
]

const WORD_TRANSFORMATIONS: { [key: string]: string[] } = {
  realidad: ["ilusión", "espejismo", "ficción", "simulacro", "fantasía"],
  tiempo: ["eternidad", "instante", "bucle", "fragmento", "eco"],
  memoria: ["olvido", "nostalgia", "fantasma", "huella", "reflejo"],
  despertar: ["hundirse", "flotar", "disolverse", "fragmentarse", "multiplicarse"],
  verdad: ["mentira", "misterio", "enigma", "paradoja", "contradicción"],
  luz: ["penumbra", "destello", "brillo", "resplandor", "fulgor"],
  amor: ["anhelo", "vacío", "eco", "susurro", "latido"],
  miedo: ["vértigo", "abismo", "laberinto", "espiral", "caída"],
}

export default function InceptionGame({ onBack, theme }: InceptionGameProps) {
  const [currentLevel, setCurrentLevel] = useState(0)
  const [currentWord, setCurrentWord] = useState("realidad")
  const [userInput, setUserInput] = useState("")
  const [score, setScore] = useState(0)
  const [timeInLevel, setTimeInLevel] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [wordHistory, setWordHistory] = useState<string[]>(["realidad"])
  const [gamePhase, setGamePhase] = useState<"intro" | "playing" | "transition" | "limbo">("intro")
  const [kicks, setKicks] = useState(0)
  const [maxDepthReached, setMaxDepthReached] = useState(0)

  const timerRef = useRef<NodeJS.Timeout>()
  const wordChangeRef = useRef<NodeJS.Timeout>()

  // Transformar palabra según el nivel de distorsión
  const transformWord = (word: string, level: number): string => {
    const distortion = DREAM_LEVELS[level]?.wordDistortion || 0

    if (distortion === 0) return word

    // Si hay transformaciones específicas para la palabra
    if (WORD_TRANSFORMATIONS[word] && Math.random() < distortion) {
      const transformations = WORD_TRANSFORMATIONS[word]
      return transformations[Math.floor(Math.random() * transformations.length)]
    }

    // Distorsión general basada en el nivel
    if (Math.random() < distortion) {
      const chars = word.split("")

      // Diferentes tipos de distorsión según el nivel
      switch (level) {
        case 1:
          // Cambios sutiles
          if (chars.length > 3) {
            const pos = Math.floor(Math.random() * chars.length)
            chars[pos] = chars[pos].toUpperCase()
          }
          break
        case 2:
          // Inversiones parciales
          if (chars.length > 4) {
            const start = Math.floor(chars.length / 3)
            const end = Math.floor((chars.length * 2) / 3)
            chars.splice(start, end - start, ...chars.slice(start, end).reverse())
          }
          break
        case 3:
          // Fragmentación
          return chars.filter((_, i) => i % 2 === 0).join("") + "..." + chars.filter((_, i) => i % 2 === 1).join("")
        case 4:
          // Símbolos puros
          return "◊".repeat(Math.min(word.length, 3)) + "∞" + "◊".repeat(Math.min(word.length, 3))
        default:
          return word
      }

      return chars.join("")
    }

    return word
  }

  // Generar nueva palabra
  const generateNewWord = () => {
    const baseWord = BASE_WORDS[Math.floor(Math.random() * BASE_WORDS.length)]
    const transformedWord = transformWord(baseWord, currentLevel)
    setCurrentWord(transformedWord)
    setWordHistory((prev) => [...prev.slice(-10), transformedWord])
  }

  // Ir más profundo en el sueño
  const goDeeper = () => {
    if (currentLevel < DREAM_LEVELS.length - 1) {
      setCurrentLevel((prev) => {
        const newLevel = prev + 1
        setMaxDepthReached(Math.max(maxDepthReached, newLevel))
        return newLevel
      })
      setGamePhase("transition")
      generateNewWord()

      setTimeout(() => {
        setGamePhase("playing")
      }, 2000)
    }
  }

  // Despertar (kick)
  const kick = () => {
    if (currentLevel > 0) {
      setCurrentLevel((prev) => prev - 1)
      setKicks((prev) => prev + 1)
      setGamePhase("transition")
      generateNewWord()

      setTimeout(() => {
        setGamePhase("playing")
      }, 1500)
    }
  }

  // Verificar respuesta del usuario
  const checkAnswer = () => {
    if (!userInput.trim()) return

    const input = userInput.toLowerCase().trim()
    const target = currentWord.toLowerCase()

    // Diferentes criterios de éxito según el nivel
    let isCorrect = false

    if (currentLevel === 0) {
      // En realidad, debe ser exacto
      isCorrect = input === target
    } else if (currentLevel <= 2) {
      // En sueños ligeros, similitud parcial
      isCorrect = input.includes(target.slice(0, 3)) || target.includes(input.slice(0, 3))
    } else {
      // En limbo, cualquier interpretación creativa cuenta
      isCorrect = input.length > 2
    }

    if (isCorrect) {
      const levelMultiplier = DREAM_LEVELS[currentLevel].timeMultiplier
      setScore((prev) => prev + 10 * levelMultiplier)
      generateNewWord()
    }

    setUserInput("")
  }

  // Iniciar juego
  const startGame = () => {
    setIsActive(true)
    setGamePhase("playing")
    setTimeInLevel(0)
    generateNewWord()

    // Timer principal
    timerRef.current = setInterval(() => {
      setTimeInLevel((prev) => prev + 1)
    }, 1000)

    // Cambio automático de palabras
    wordChangeRef.current = setInterval(
      () => {
        generateNewWord()
      },
      8000 / (currentLevel + 1),
    ) // Más rápido en niveles profundos
  }

  // Detener juego
  const stopGame = () => {
    setIsActive(false)
    setGamePhase("intro")

    if (timerRef.current) clearInterval(timerRef.current)
    if (wordChangeRef.current) clearInterval(wordChangeRef.current)
  }

  // Reiniciar juego
  const resetGame = () => {
    stopGame()
    setCurrentLevel(0)
    setScore(0)
    setTimeInLevel(0)
    setWordHistory(["realidad"])
    setKicks(0)
    setMaxDepthReached(0)
    setCurrentWord("realidad")
  }

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (wordChangeRef.current) clearInterval(wordChangeRef.current)
    }
  }, [])

  // Formatear tiempo con multiplicador de sueño
  const formatDreamTime = (seconds: number, level: number) => {
    const multiplier = DREAM_LEVELS[level].timeMultiplier
    const dreamSeconds = seconds * multiplier

    if (dreamSeconds < 60) return `${dreamSeconds}s`
    if (dreamSeconds < 3600) return `${Math.floor(dreamSeconds / 60)}m ${dreamSeconds % 60}s`
    if (dreamSeconds < 86400) return `${Math.floor(dreamSeconds / 3600)}h ${Math.floor((dreamSeconds % 3600) / 60)}m`
    return `${Math.floor(dreamSeconds / 86400)}d ${Math.floor((dreamSeconds % 86400) / 3600)}h`
  }

  const currentDreamLevel = DREAM_LEVELS[currentLevel]
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${currentDreamLevel.color} p-2 md:p-4 transition-all duration-2000`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 md:mb-6 flex justify-between items-center">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm md:text-base"
            size={isMobile ? "sm" : "default"}
          >
            <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
            Volver
          </Button>

          <Badge className="bg-white/20 text-white text-xs md:text-sm">
            <Layers className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            Nivel {currentLevel}: {currentDreamLevel.name}
          </Badge>
        </div>

        {gamePhase === "intro" && (
          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-center text-xl md:text-2xl flex items-center justify-center">
                <Brain className="h-6 w-6 md:h-8 md:w-8 mr-2" />
                INCEPTION: Sueños Dentro de Sueños
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="text-center text-white space-y-3 md:space-y-4">
                <p className="text-sm md:text-base">
                  Sumérgete en capas de sueños donde las palabras cambian de significado.
                </p>
                <p className="text-xs md:text-sm text-white/80">
                  Escribe las palabras que ves antes de que se transformen. Cada nivel más profundo distorsiona más la
                  realidad.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white/10 p-3 md:p-4 rounded-lg">
                  <h3 className="text-white font-semibold text-sm md:text-base mb-2">Controles</h3>
                  <div className="text-white/80 text-xs md:text-sm space-y-1">
                    <p>• Escribe la palabra que ves</p>
                    <p>• ↓ Ir más profundo en el sueño</p>
                    <p>• ↑ Despertar (kick)</p>
                    <p>• El tiempo se dilata en cada nivel</p>
                  </div>
                </div>
                <div className="bg-white/10 p-3 md:p-4 rounded-lg">
                  <h3 className="text-white font-semibold text-sm md:text-base mb-2">Niveles</h3>
                  <div className="text-white/80 text-xs md:text-sm space-y-1">
                    <p>0: Realidad (1x tiempo)</p>
                    <p>1: Primer Sueño (5x tiempo)</p>
                    <p>2: Sueño Profundo (20x tiempo)</p>
                    <p>3: Limbo Onírico (100x tiempo)</p>
                    <p>4: Limbo Profundo (500x tiempo)</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 md:py-3 text-sm md:text-lg"
              >
                <Eye className="h-4 w-4 md:h-6 md:w-6 mr-2" />
                Entrar en el Sueño
              </Button>
            </CardContent>
          </Card>
        )}

        {gamePhase === "transition" && (
          <Card className="bg-black/30 backdrop-blur-sm border-white/10">
            <CardContent className="text-center py-8 md:py-12">
              <div className="animate-pulse">
                <Zap className="h-12 w-12 md:h-16 md:w-16 text-white mx-auto mb-4" />
                <h2 className="text-white text-lg md:text-2xl font-bold mb-2">
                  {currentLevel > DREAM_LEVELS[currentLevel - 1]?.level ? "Sumergiéndose..." : "Despertando..."}
                </h2>
                <p className="text-white/80 text-sm md:text-base">Entrando en: {currentDreamLevel.name}</p>
                <p className="text-white/60 text-xs md:text-sm mt-2">{currentDreamLevel.description}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {gamePhase === "playing" && (
          <div className="space-y-4 md:space-y-6">
            {/* Panel de estado */}
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardContent className="p-3 md:p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-center">
                  <div>
                    <p className="text-white/70 text-xs md:text-sm">Puntuación</p>
                    <p className="text-white font-bold text-sm md:text-lg">{score.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs md:text-sm">Tiempo Real</p>
                    <p className="text-white font-bold text-sm md:text-lg">{timeInLevel}s</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs md:text-sm">Tiempo Sueño</p>
                    <p className="text-white font-bold text-sm md:text-lg">
                      {formatDreamTime(timeInLevel, currentLevel)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs md:text-sm">Kicks</p>
                    <p className="text-white font-bold text-sm md:text-lg">{kicks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Palabra central */}
            <Card className="bg-black/30 backdrop-blur-sm border-white/10">
              <CardContent className="text-center py-8 md:py-12">
                <div className={`animate-pulse ${currentLevel >= 3 ? "animate-bounce" : ""}`}>
                  <h1
                    className={`text-4xl md:text-8xl font-light text-white/90 mb-4 transition-all duration-2000 ${
                      currentLevel >= 2 ? "transform rotate-1" : ""
                    } ${currentLevel >= 4 ? "animate-spin" : ""}`}
                  >
                    {currentWord}
                  </h1>
                </div>

                <p className="text-white/70 text-sm md:text-base mb-4">{currentDreamLevel.description}</p>

                <div className="flex flex-wrap justify-center gap-1 md:gap-2 mb-4">
                  {currentDreamLevel.effects.map((effect, index) => (
                    <Badge key={index} variant="outline" className="text-white border-white/30 text-xs">
                      {effect}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Input y controles */}
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardContent className="p-3 md:p-6 space-y-3 md:space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && checkAnswer()}
                    placeholder="Escribe la palabra que ves..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm md:text-base"
                  />
                  <Button onClick={checkAnswer} className="bg-green-600 hover:bg-green-700 px-3 md:px-6">
                    ✓
                  </Button>
                </div>

                <div className="flex justify-center space-x-2 md:space-x-4">
                  <Button
                    onClick={goDeeper}
                    disabled={currentLevel >= DREAM_LEVELS.length - 1}
                    className="bg-indigo-600 hover:bg-indigo-700 text-xs md:text-sm"
                    size={isMobile ? "sm" : "default"}
                  >
                    <ChevronDown className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Más Profundo
                  </Button>

                  <Button
                    onClick={kick}
                    disabled={currentLevel === 0}
                    className="bg-orange-600 hover:bg-orange-700 text-xs md:text-sm"
                    size={isMobile ? "sm" : "default"}
                  >
                    <ChevronUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Kick (Despertar)
                  </Button>

                  <Button
                    onClick={stopGame}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
                    size={isMobile ? "sm" : "default"}
                  >
                    <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Salir
                  </Button>
                </div>

                {/* Historial de palabras */}
                <div className="bg-white/5 p-2 md:p-3 rounded-lg">
                  <p className="text-white/70 text-xs md:text-sm mb-2">Historial de Palabras:</p>
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {wordHistory.slice(-8).map((word, index) => (
                      <Badge key={index} className="bg-white/20 text-white text-xs">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progreso de nivel */}
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardContent className="p-3 md:p-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-white/80 text-xs md:text-sm">
                    <span>Profundidad del Sueño</span>
                    <span>
                      {currentLevel}/{DREAM_LEVELS.length - 1}
                    </span>
                  </div>
                  <Progress value={(currentLevel / (DREAM_LEVELS.length - 1)) * 100} className="h-2 bg-white/20" />
                  <p className="text-white/60 text-xs text-center">
                    Máxima profundidad alcanzada: Nivel {maxDepthReached}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Botón de reinicio siempre visible */}
        {gamePhase !== "intro" && (
          <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6">
            <Button onClick={resetGame} className="bg-red-600 hover:bg-red-700 rounded-full h-10 w-10 md:h-12 md:w-12">
              <Home className="h-4 w-4 md:h-6 md:w-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
