"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic } from "lucide-react"
import {
  Brain,
  MoonIcon,
  Sparkles,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Save,
  Home,
  Settings,
  Info,
  Palette,
  Timer,
  Infinity,
  ArrowLeft,
  Sun,
  Zap,
  Eye,
  Heart,
  Lightbulb,
  Layers,
  Activity,
  BarChart3,
  Star,
  TrendingUp,
} from "lucide-react"

import DreamRecorder from "../components/dream-recorder"
import TimerComponent from "../components/timer"
import InceptionGame from "../components/inception-game"

type GameMode =
  | "main-menu"
  | "learn-more"
  | "settings"
  | "game-select"
  | "intro"
  | "tutorial"
  | "mode-select"
  | "guided"
  | "free"
  | "infinite-guided"
  | "infinite-free"
  | "journal"
  | "stats"
  | "dream-recorder"
  | "timer"
  | "dream-analysis"
  | "inception-game"

type Theme = "cosmic" | "ocean" | "forest" | "sunset" | "aurora"

interface GameState {
  mode: GameMode
  theme: Theme
  question: string
  currentWord: string
  currentColor: string
  bitsProcessed: number
  sessionTime: number
  isActive: boolean
  depth: number
  discoveries: string[]
  journalEntries: string[]
  isInfiniteMode: boolean
  // Nuevas propiedades
  dreamRecordings: DreamRecording[]
  isRecording: boolean
  audioStream: MediaStream | null
  audioAnalysis: AudioAnalysis[]
  currentRecording: DreamRecording | null
  timerSettings: TimerSettings
  timerActive: boolean
  timerRemaining: number
}

interface AudioAnalysis {
  timestamp: number
  frequencies: number[]
  amplitude: number
  dominantFreq: number
}

interface DreamRecording {
  id: string
  date: string
  duration: number
  audioBlob?: Blob
  audioAnalysis: AudioAnalysis[]
  notes: string
  dreamType: "normal" | "lucid" | "nightmare" | "hypnagogic"
  tags: string[]
}

interface TimerSettings {
  duration: number
  reminderInterval: number
  soundEnabled: boolean
  vibrationEnabled: boolean
}

const THEMES = {
  cosmic: {
    name: "Cósmico",
    colors: [
      "from-indigo-900 via-purple-900 to-pink-900",
      "from-blue-900 via-purple-900 to-indigo-900",
      "from-purple-900 via-indigo-900 to-blue-900",
      "from-violet-900 via-purple-900 to-indigo-900",
    ],
    icon: Sparkles,
  },
  ocean: {
    name: "Océano",
    colors: [
      "from-blue-900 via-cyan-900 to-teal-900",
      "from-cyan-900 via-blue-900 to-indigo-900",
      "from-teal-900 via-cyan-900 to-blue-900",
      "from-blue-800 via-cyan-800 to-teal-800",
    ],
    icon: MoonIcon,
  },
  forest: {
    name: "Bosque",
    colors: [
      "from-green-900 via-emerald-900 to-teal-900",
      "from-emerald-900 via-green-900 to-cyan-900",
      "from-teal-900 via-green-900 to-emerald-900",
      "from-green-800 via-emerald-800 to-teal-800",
    ],
    icon: Heart,
  },
  sunset: {
    name: "Atardecer",
    colors: [
      "from-orange-900 via-red-900 to-pink-900",
      "from-red-900 via-pink-900 to-purple-900",
      "from-pink-900 via-orange-900 to-red-900",
      "from-orange-800 via-red-800 to-pink-800",
    ],
    icon: Sun,
  },
  aurora: {
    name: "Aurora",
    colors: [
      "from-green-900 via-blue-900 to-purple-900",
      "from-blue-900 via-purple-900 to-green-900",
      "from-purple-900 via-green-900 to-blue-900",
      "from-cyan-900 via-purple-900 to-pink-900",
    ],
    icon: Zap,
  },
}

const HYPNAGOGIC_WORDS = [
  "luz",
  "sueño",
  "idea",
  "fluir",
  "crear",
  "música",
  "arte",
  "escribir",
  "explorar",
  "descubrir",
  "imaginar",
  "sentir",
  "respirar",
  "flotar",
  "volar",
  "colores",
  "formas",
  "sonidos",
  "texturas",
  "memorias",
  "futuro",
  "presente",
  "infinito",
  "conexión",
  "armonía",
  "balance",
  "energía",
  "transformar",
  "evolucionar",
  "crecer",
  "expandir",
  "profundo",
  "suave",
  "brillante",
  "misterioso",
  "serenidad",
  "contemplar",
  "meditar",
  "visualizar",
  "intuición",
  "sabiduría",
  "claridad",
  "paz",
]

const CREATIVE_RESPONSES = {
  arte: ["pincel", "lienzo", "colores", "expresión", "belleza", "forma", "creatividad", "inspiración"],
  música: ["melodía", "ritmo", "armonía", "sonido", "vibración", "composición", "sinfonía", "resonancia"],
  negocio: ["innovación", "oportunidad", "valor", "solución", "crecimiento", "visión", "estrategia", "liderazgo"],
  escritura: ["palabras", "historia", "narrativa", "personaje", "trama", "inspiración", "prosa", "verso"],
  ciencia: [
    "descubrimiento",
    "experimento",
    "hipótesis",
    "observación",
    "análisis",
    "comprensión",
    "teoría",
    "investigación",
  ],
  amor: ["conexión", "ternura", "compasión", "unión", "calidez", "abrazo", "corazón", "alma"],
  naturaleza: ["bosque", "océano", "montaña", "río", "viento", "tierra", "cielo", "estrella"],
}

export default function HypnagogicQuest() {
  const [gameState, setGameState] = useState<GameState>({
    mode: "main-menu",
    theme: "cosmic",
    question: "",
    currentWord: "respirar",
    currentColor: THEMES.cosmic.colors[0],
    bitsProcessed: 0,
    sessionTime: 0,
    isActive: false,
    depth: 0,
    discoveries: [],
    journalEntries: [],
    isInfiniteMode: false,
    // Nuevas propiedades iniciales
    dreamRecordings: [],
    isRecording: false,
    audioStream: null,
    audioAnalysis: [],
    currentRecording: null,
    timerSettings: {
      duration: 300, // 5 minutos por defecto
      reminderInterval: 60,
      soundEnabled: true,
      vibrationEnabled: true,
    },
    timerActive: false,
    timerRemaining: 0,
  })

  const [newJournalEntry, setNewJournalEntry] = useState("")

  // Efecto para el cambio automático de palabras y colores
  useEffect(() => {
    if (!gameState.isActive) return

    const interval = setInterval(() => {
      const themeColors = THEMES[gameState.theme].colors
      setGameState((prev) => ({
        ...prev,
        currentWord: HYPNAGOGIC_WORDS[Math.floor(Math.random() * HYPNAGOGIC_WORDS.length)],
        currentColor: themeColors[Math.floor(Math.random() * themeColors.length)],
        bitsProcessed: prev.bitsProcessed + Math.floor(Math.random() * 1000000) + 500000,
        depth: gameState.isInfiniteMode ? Math.min(prev.depth + 1, 100) : Math.min(prev.depth + 2, 100),
        sessionTime: prev.sessionTime + 10,
      }))
    }, 10000)

    return () => clearInterval(interval)
  }, [gameState.isActive, gameState.theme, gameState.isInfiniteMode])

  // Temporizador de sesión
  useEffect(() => {
    if (!gameState.isActive) return

    const timer = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        sessionTime: prev.sessionTime + 1,
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState.isActive])

  const startSession = (mode: "guided" | "free" | "infinite-guided" | "infinite-free") => {
    const isInfinite = mode.includes("infinite")
    setGameState((prev) => ({
      ...prev,
      mode,
      isActive: true,
      isInfiniteMode: isInfinite,
      bitsProcessed: 40,
      sessionTime: 0,
      depth: 0,
      currentWord: mode.includes("guided") ? generateGuidedResponse(prev.question) : HYPNAGOGIC_WORDS[0],
    }))
  }

  const generateGuidedResponse = (question: string): string => {
    const keywords = Object.keys(CREATIVE_RESPONSES)
    const foundKeyword = keywords.find((keyword) => question.toLowerCase().includes(keyword))

    if (foundKeyword) {
      const responses = CREATIVE_RESPONSES[foundKeyword as keyof typeof CREATIVE_RESPONSES]
      return responses[Math.floor(Math.random() * responses.length)]
    }

    return HYPNAGOGIC_WORDS[Math.floor(Math.random() * HYPNAGOGIC_WORDS.length)]
  }

  const stopSession = () => {
    setGameState((prev) => ({
      ...prev,
      isActive: false,
      discoveries: [...prev.discoveries, prev.currentWord],
    }))
  }

  const saveToJournal = () => {
    if (newJournalEntry.trim()) {
      setGameState((prev) => ({
        ...prev,
        journalEntries: [...prev.journalEntries, newJournalEntry],
      }))
      setNewJournalEntry("")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const changeTheme = (newTheme: Theme) => {
    setGameState((prev) => ({
      ...prev,
      theme: newTheme,
      currentColor: THEMES[newTheme].colors[0],
    }))
  }

  const renderMainMenu = () => (
    <div
      className={`min-h-screen bg-gradient-to-br ${THEMES[gameState.theme].colors[0]} flex items-center justify-center p-4`}
    >
      <div className="max-w-7xl w-full">
        {/* Header Principal */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Brain className="h-24 w-24 md:h-32 md:w-32 text-purple-300 animate-pulse" />
              <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-wide">Hypnagogic Quest</h1>
          <p className="text-purple-200 text-lg md:text-xl lg:text-2xl mb-2">
            Explora los misterios de tu mente subconsciente
          </p>
          <div className="flex justify-center items-center space-x-2 text-white/80 text-sm md:text-base">
            <Activity className="h-4 w-4" />
            <span>
              Tu subconsciente procesa <span className="text-yellow-300 font-bold">11 millones de bits</span> por
              segundo
            </span>
          </div>
        </div>

        {/* Grid Principal de Categorías */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna 1: Experiencias Principales */}
          <div className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-white text-xl flex items-center justify-center">
                  <Star className="h-6 w-6 mr-2 text-yellow-400" />
                  Experiencias Principales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setGameState((prev) => ({ ...prev, mode: "game-select" }))}
                  className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg flex items-center justify-center space-x-3"
                >
                  <Play className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Experiencia Hipnagógica</div>
                    <div className="text-sm opacity-80">Explora tu subconsciente</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setGameState((prev) => ({ ...prev, mode: "inception-game" }))}
                  className="w-full h-16 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white text-lg flex items-center justify-center space-x-3"
                >
                  <Layers className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">INCEPTION Game</div>
                    <div className="text-sm opacity-80">Sueños dentro de sueños</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setGameState((prev) => ({ ...prev, mode: "timer" }))}
                  className="w-full h-16 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-lg flex items-center justify-center space-x-3"
                >
                  <Timer className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Temporizador Zen</div>
                    <div className="text-sm opacity-80">Sesiones cronometradas</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Estadísticas Rápidas */}
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-white text-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                  Tu Progreso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-purple-300 text-xs">Ideas Guardadas</p>
                    <p className="text-white text-xl font-bold">{gameState.journalEntries.length}</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-blue-300 text-xs">Palabras Descubiertas</p>
                    <p className="text-white text-xl font-bold">{gameState.discoveries.length}</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-green-300 text-xs">Bits Procesados</p>
                    <p className="text-white text-sm font-bold">{gameState.bitsProcessed.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-yellow-300 text-xs">Tema Actual</p>
                    <p className="text-white text-sm font-bold">{THEMES[gameState.theme].name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna 2: Herramientas de Análisis */}
          <div className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-white text-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-blue-400" />
                  Análisis y Registro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setGameState((prev) => ({ ...prev, mode: "dream-recorder" }))}
                  className="w-full h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg flex items-center justify-center space-x-3"
                >
                  <Mic className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Registro de Sueños</div>
                    <div className="text-sm opacity-80">Grabación con análisis</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setGameState((prev) => ({ ...prev, mode: "journal" }))}
                  className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg flex items-center justify-center space-x-3"
                >
                  <BookOpen className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Diario Onírico</div>
                    <div className="text-sm opacity-80">Tus ideas y descubrimientos</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setGameState((prev) => ({ ...prev, mode: "stats" }))}
                  className="w-full h-16 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-lg flex items-center justify-center space-x-3"
                >
                  <Activity className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Estadísticas</div>
                    <div className="text-sm opacity-80">Análisis de progreso</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Vista Previa del Tema */}
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-white text-lg flex items-center justify-center">
                  <Palette className="h-5 w-5 mr-2 text-pink-400" />
                  Ambiente Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`h-24 rounded-lg bg-gradient-to-r ${THEMES[gameState.theme].colors[0]} flex items-center justify-center mb-4 relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/20"></div>
                  <p className="text-white text-2xl font-light relative z-10 animate-pulse">inspiración</p>
                  <div className="absolute top-2 right-2">
                    {React.createElement(THEMES[gameState.theme].icon, {
                      className: "h-6 w-6 text-white/60",
                    })}
                  </div>
                </div>
                <Button
                  onClick={() => setGameState((prev) => ({ ...prev, mode: "settings" }))}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Cambiar Tema
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Columna 3: Aprendizaje y Configuración */}
          <div className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-white text-xl flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 mr-2 text-orange-400" />
                  Conocimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setGameState((prev) => ({ ...prev, mode: "learn-more" }))}
                  className="w-full h-16 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg flex items-center justify-center space-x-3"
                >
                  <Info className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Aprender Más</div>
                    <div className="text-sm opacity-80">Ciencia del hipnagógico</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setGameState((prev) => ({ ...prev, mode: "settings" }))}
                  className="w-full h-16 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg flex items-center justify-center space-x-3"
                >
                  <Settings className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Configuración</div>
                    <div className="text-sm opacity-80">Personaliza tu experiencia</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Información Científica */}
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-white text-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-400" />
                  Dato Científico
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white/10 p-4 rounded-lg">
                  <p className="text-white/90 text-sm leading-relaxed">
                    Durante el estado hipnagógico, tu cerebro produce{" "}
                    <span className="text-yellow-300 font-bold">ondas theta</span> (4-8 Hz) que facilitan la creatividad
                    y el acceso a la memoria subconsciente.
                  </p>
                </div>
                <div className="mt-4 flex justify-center space-x-4 text-xs text-white/70">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                    <span>Consciente: 40 bits/s</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                    <span>Subconsciente: 11M bits/s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acceso Rápido */}
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-white text-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                  Acceso Rápido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setGameState((prev) => ({ ...prev, mode: "game-select" }))}
                    size="sm"
                    className="bg-purple-600/50 hover:bg-purple-600/70 text-white"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Comenzar
                  </Button>
                  <Button
                    onClick={() => setGameState((prev) => ({ ...prev, mode: "journal" }))}
                    size="sm"
                    className="bg-green-600/50 hover:bg-green-600/70 text-white"
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    Diario
                  </Button>
                  <Button
                    onClick={() => setGameState((prev) => ({ ...prev, mode: "dream-recorder" }))}
                    size="sm"
                    className="bg-indigo-600/50 hover:bg-indigo-600/70 text-white"
                  >
                    <Mic className="h-4 w-4 mr-1" />
                    Grabar
                  </Button>
                  <Button
                    onClick={() => setGameState((prev) => ({ ...prev, mode: "inception-game" }))}
                    size="sm"
                    className="bg-red-600/50 hover:bg-red-600/70 text-white"
                  >
                    <Layers className="h-4 w-4 mr-1" />
                    Inception
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="mt-8 text-center">
          <div className="bg-black/20 backdrop-blur-sm border-white/10 rounded-lg p-4">
            <p className="text-white/60 text-sm">
              💡 <span className="text-white/80">Consejo:</span> Para mejores resultados, usa auriculares y encuentra un
              lugar tranquilo
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLearnMore = () => (
    <div className={`min-h-screen bg-gradient-to-br ${THEMES[gameState.theme].colors[0]} p-4`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => setGameState((prev) => ({ ...prev, mode: "main-menu" }))}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Menú
          </Button>
        </div>

        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-3xl text-white text-center flex items-center justify-center">
              <Brain className="h-8 w-8 mr-3" />
              El Estado Hipnagógico: Ciencia y Misterio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="science" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/10">
                <TabsTrigger value="science" className="text-white data-[state=active]:bg-white/20">
                  Ciencia
                </TabsTrigger>
                <TabsTrigger value="experience" className="text-white data-[state=active]:bg-white/20">
                  Experiencia
                </TabsTrigger>
                <TabsTrigger value="benefits" className="text-white data-[state=active]:bg-white/20">
                  Beneficios
                </TabsTrigger>
                <TabsTrigger value="practice" className="text-white data-[state=active]:bg-white/20">
                  Práctica
                </TabsTrigger>
              </TabsList>

              <TabsContent value="science" className="space-y-6 text-white">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Eye className="h-5 w-5 mr-2" />
                        ¿Qué es el Estado Hipnagógico?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-purple-100">
                      <p className="leading-relaxed">
                        El estado hipnagógico es la transición entre la vigilia y el sueño. Durante este período único,
                        tu cerebro opera en frecuencias theta (4-8 Hz), permitiendo acceso a niveles más profundos de
                        creatividad e intuición.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Zap className="h-5 w-5 mr-2" />
                        Procesamiento de Información
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-purple-100">
                      <p className="leading-relaxed">
                        Tu subconsciente procesa aproximadamente <strong>11 millones de bits</strong> de información por
                        segundo, mientras que tu mente consciente solo maneja <strong>40-50 bits</strong>. El estado
                        hipnagógico permite acceder a esta vasta capacidad.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Neurociencia del Estado Hipnagógico</CardTitle>
                  </CardHeader>
                  <CardContent className="text-purple-100 space-y-4">
                    <p>Durante el estado hipnagógico, ocurren varios fenómenos neurológicos fascinantes:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>
                        <strong>Ondas Theta:</strong> El cerebro produce ondas de 4-8 Hz asociadas con creatividad
                        profunda
                      </li>
                      <li>
                        <strong>Reducción del Filtro Consciente:</strong> Disminuye la censura mental, permitiendo ideas
                        innovadoras
                      </li>
                      <li>
                        <strong>Conexiones Neuronales:</strong> Se forman nuevas conexiones entre áreas cerebrales
                        normalmente separadas
                      </li>
                      <li>
                        <strong>Acceso a Memoria:</strong> Mayor acceso a memorias y conocimientos almacenados
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience" className="space-y-6 text-white">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-center">Sensaciones Físicas</CardTitle>
                    </CardHeader>
                    <CardContent className="text-purple-100 text-center">
                      <ul className="space-y-2">
                        <li>Sensación de flotar</li>
                        <li>Relajación muscular profunda</li>
                        <li>Respiración lenta y profunda</li>
                        <li>Pérdida de conciencia corporal</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-center">Experiencias Mentales</CardTitle>
                    </CardHeader>
                    <CardContent className="text-purple-100 text-center">
                      <ul className="space-y-2">
                        <li>Imágenes vívidas espontáneas</li>
                        <li>Pensamientos fluidos y creativos</li>
                        <li>Conexiones inusuales de ideas</li>
                        <li>Insights y revelaciones</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-center">Fenómenos Comunes</CardTitle>
                    </CardHeader>
                    <CardContent className="text-purple-100 text-center">
                      <ul className="space-y-2">
                        <li>Alucinaciones hipnagógicas</li>
                        <li>Sensación de caída</li>
                        <li>Voces o sonidos internos</li>
                        <li>Distorsión del tiempo</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="benefits" className="space-y-6 text-white">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Lightbulb className="h-5 w-5 mr-2" />
                        Beneficios Creativos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-purple-100">
                      <ul className="space-y-2">
                        <li>• Solución creativa de problemas</li>
                        <li>• Inspiración artística y musical</li>
                        <li>• Innovación en proyectos</li>
                        <li>• Conexiones conceptuales únicas</li>
                        <li>• Superación de bloqueos creativos</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Heart className="h-5 w-5 mr-2" />
                        Beneficios Personales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-purple-100">
                      <ul className="space-y-2">
                        <li>• Autoconocimiento profundo</li>
                        <li>• Reducción del estrés</li>
                        <li>• Claridad mental</li>
                        <li>• Procesamiento emocional</li>
                        <li>• Desarrollo de intuición</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Casos de Éxito Históricos</CardTitle>
                  </CardHeader>
                  <CardContent className="text-purple-100">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-white">Salvador Dalí</h4>
                        <p className="text-sm">Usaba el estado hipnagógico para crear sus pinturas surrealistas</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Thomas Edison</h4>
                        <p className="text-sm">Desarrolló muchas invenciones durante estos estados de transición</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Nikola Tesla</h4>
                        <p className="text-sm">Visualizaba y perfeccionaba sus inventos en estado hipnagógico</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="practice" className="space-y-6 text-white">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Cómo Practicar el Estado Hipnagógico</CardTitle>
                  </CardHeader>
                  <CardContent className="text-purple-100 space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-white mb-2">Preparación Física</h4>
                        <ul className="space-y-1 text-sm">
                          <li>1. Acuéstate boca arriba cómodamente</li>
                          <li>2. Mantén los brazos relajados a los lados</li>
                          <li>3. Respira profunda y lentamente</li>
                          <li>4. Relaja cada músculo progresivamente</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-2">Preparación Mental</h4>
                        <ul className="space-y-1 text-sm">
                          <li>1. Establece una intención o pregunta</li>
                          <li>2. Suelta el control consciente</li>
                          <li>3. Observa sin juzgar</li>
                          <li>4. Mantente receptivo a las imágenes</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Consejos Importantes</CardTitle>
                  </CardHeader>
                  <CardContent className="text-purple-100">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-white mb-2">✅ Hacer</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Mantente hidratado</li>
                          <li>• Practica regularmente</li>
                          <li>• Anota tus experiencias</li>
                          <li>• Sé paciente contigo mismo</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-2">❌ Evitar</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Forzar las experiencias</li>
                          <li>• Practicar cuando estés muy cansado</li>
                          <li>• Juzgar las imágenes que aparecen</li>
                          <li>• Sesiones demasiado largas al inicio</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className={`min-h-screen bg-gradient-to-br ${THEMES[gameState.theme].colors[0]} p-4`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => setGameState((prev) => ({ ...prev, mode: "main-menu" }))}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Menú
          </Button>
        </div>

        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-center flex items-center justify-center">
              <Settings className="h-6 w-6 mr-2" />
              Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <h3 className="text-white text-xl mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Temas Visuales
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(THEMES).map(([key, theme]) => {
                  const IconComponent = theme.icon
                  return (
                    <Button
                      key={key}
                      onClick={() => changeTheme(key as Theme)}
                      className={`h-20 flex flex-col items-center justify-center ${
                        gameState.theme === key ? "bg-white/30 border-2 border-white" : "bg-white/10 hover:bg-white/20"
                      }`}
                      variant="outline"
                    >
                      <IconComponent className="h-6 w-6 text-white mb-1" />
                      <span className="text-white text-sm">{theme.name}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-lg">
              <h3 className="text-white text-lg mb-4">Vista Previa del Tema</h3>
              <div
                className={`h-32 rounded-lg bg-gradient-to-r ${THEMES[gameState.theme].colors[0]} flex items-center justify-center`}
              >
                <p className="text-white text-2xl font-light">inspiración</p>
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-lg">
              <h3 className="text-white text-lg mb-4">Información de la Sesión</h3>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-purple-300 text-sm">Total de Ideas</p>
                  <p className="text-white text-2xl font-bold">{gameState.journalEntries.length}</p>
                </div>
                <div>
                  <p className="text-blue-300 text-sm">Palabras Descubiertas</p>
                  <p className="text-white text-2xl font-bold">{gameState.discoveries.length}</p>
                </div>
                <div>
                  <p className="text-green-300 text-sm">Bits Procesados</p>
                  <p className="text-white text-2xl font-bold">{gameState.bitsProcessed.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderGameSelect = () => (
    <div
      className={`min-h-screen bg-gradient-to-br ${THEMES[gameState.theme].colors[0]} flex items-center justify-center p-4`}
    >
      <Card className="max-w-4xl w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setGameState((prev) => ({ ...prev, mode: "main-menu" }))}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <CardTitle className="text-2xl text-white">Elige tu Experiencia</CardTitle>
            <div></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardHeader>
                <CardTitle className="text-white text-center flex items-center justify-center">
                  <Timer className="h-6 w-6 mr-2" />
                  Experiencia Clásica
                </CardTitle>
                <CardDescription className="text-purple-200 text-center">
                  Sesiones de 5-10 minutos con temporizador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-purple-100 text-sm space-y-2">
                  <p>• Duración controlada</p>
                  <p>• Recordatorios de hidratación</p>
                  <p>• Progreso medido</p>
                  <p>• Ideal para principiantes</p>
                </div>
                <Button
                  onClick={() => setGameState((prev) => ({ ...prev, mode: "intro" }))}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Comenzar Experiencia Clásica
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardHeader>
                <CardTitle className="text-white text-center flex items-center justify-center">
                  <Infinity className="h-6 w-6 mr-2" />
                  Exploración Infinita
                </CardTitle>
                <CardDescription className="text-purple-200 text-center">
                  Sin límites de tiempo, exploración libre
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-purple-100 text-sm space-y-2">
                  <p>• Sin temporizador</p>
                  <p>• Exploración profunda</p>
                  <p>• Ritmo personal</p>
                  <p>• Para usuarios experimentados</p>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Pregunta opcional para modo guiado..."
                    value={gameState.question}
                    onChange={(e) => setGameState((prev) => ({ ...prev, question: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => startSession("infinite-guided")}
                      className="bg-gradient-to-r from-green-600 to-emerald-600"
                      disabled={!gameState.question.trim()}
                    >
                      Guiado ∞
                    </Button>
                    <Button
                      onClick={() => startSession("infinite-free")}
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      Libre ∞
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-white/70 text-sm">
              💡 Consejo: Comienza con la experiencia clásica si es tu primera vez
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Mantener todas las funciones de renderizado existentes pero actualizar los botones de navegación
  const renderIntro = () => (
    <div
      className={`min-h-screen bg-gradient-to-br ${THEMES[gameState.theme].colors[0]} flex items-center justify-center p-4`}
    >
      <Card className="max-w-2xl w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={() => setGameState((prev) => ({ ...prev, mode: "game-select" }))}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Brain className="h-16 w-16 text-purple-300" />
            <div></div>
          </div>
          <CardTitle className="text-4xl font-bold text-white mb-2">Experiencia Clásica</CardTitle>
          <CardDescription className="text-purple-200 text-lg">
            Explora el estado entre la vigilia y el sueño
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-white">
          <div className="bg-white/5 p-6 rounded-lg border border-white/10">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-yellow-300" />
              ¿Qué es el Estado Hipnagógico?
            </h3>
            <p className="text-purple-100 leading-relaxed">
              Es el fascinante momento de transición entre estar despierto y dormido. Tu subconsciente procesa{" "}
              <span className="text-yellow-300 font-bold">11 millones de bits</span> de información por segundo,
              mientras tu mente consciente solo maneja <span className="text-blue-300 font-bold">40-50 bits</span>.
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-lg border border-white/10">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <MoonIcon className="h-5 w-5 mr-2 text-blue-300" />
              Instrucciones
            </h3>
            <p className="text-purple-100 leading-relaxed">
              Acuéstate boca arriba, relájate y usa este juego para guiar tu mente. Puedes plantear una pregunta
              específica o dejar que tu subconsciente fluya libremente.
            </p>
          </div>

          <Button
            onClick={() => setGameState((prev) => ({ ...prev, mode: "tutorial" }))}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg"
          >
            Entrar en el Hipnagógico
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Continuar con el resto de las funciones de renderizado existentes...
  // (renderTutorial, renderModeSelect, renderGameSession, renderJournal, renderStats)
  // pero actualizando los botones de navegación para incluir el nuevo sistema de menús

  const renderTutorial = () => (
    <div
      className={`min-h-screen bg-gradient-to-br ${THEMES[gameState.theme].colors[1]} flex items-center justify-center p-4`}
    >
      <Card className="max-w-2xl w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setGameState((prev) => ({ ...prev, mode: "intro" }))}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <CardTitle className="text-2xl text-white">Tutorial Rápido</CardTitle>
            <div></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-white">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Badge className="bg-purple-600">1</Badge>
              <p>
                Elige entre <strong>Modo Guiado</strong> (con pregunta) o <strong>Modo Libre</strong> (flujo natural)
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <Badge className="bg-purple-600">2</Badge>
              <p>Observa las palabras y colores que aparecen cada 10 segundos</p>
            </div>
            <div className="flex items-start space-x-3">
              <Badge className="bg-purple-600">3</Badge>
              <p>Tu "profundidad hipnagógica" aumentará gradualmente</p>
            </div>
            <div className="flex items-start space-x-3">
              <Badge className="bg-purple-600">4</Badge>
              <p>Guarda tus ideas en el diario virtual</p>
            </div>
          </div>

          <Button
            onClick={() => setGameState((prev) => ({ ...prev, mode: "mode-select" }))}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderModeSelect = () => (
    <div
      className={`min-h-screen bg-gradient-to-br ${THEMES[gameState.theme].colors[2]} flex items-center justify-center p-4`}
    >
      <Card className="max-w-2xl w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setGameState((prev) => ({ ...prev, mode: "tutorial" }))}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <CardTitle className="text-2xl text-white">Elige tu Modo</CardTitle>
            <Button
              onClick={() => setGameState((prev) => ({ ...prev, mode: "main-menu" }))}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white text-center">Modo Guiado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-200 text-center mb-4">
                  Plantea una pregunta y deja que tu subconsciente responda
                </p>
                <Input
                  placeholder="¿Qué idea creativa tengo hoy?"
                  value={gameState.question}
                  onChange={(e) => setGameState((prev) => ({ ...prev, question: e.target.value }))}
                  className="mb-4 bg-white/10 border-white/20 text-white placeholder:text-purple-300"
                />
                <Button
                  onClick={() => startSession("guided")}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                  disabled={!gameState.question.trim()}
                >
                  Comenzar Sesión Guiada
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white text-center">Modo Libre</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-200 text-center mb-4">
                  Deja que tu subconsciente fluya sin dirección específica
                </p>
                <div className="h-12 mb-4 flex items-center justify-center">
                  <p className="text-purple-300 italic">Sin pregunta necesaria</p>
                </div>
                <Button
                  onClick={() => startSession("free")}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  Comenzar Flujo Libre
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setGameState((prev) => ({ ...prev, mode: "journal" }))}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Ver Diario
            </Button>
            <Button
              variant="outline"
              onClick={() => setGameState((prev) => ({ ...prev, mode: "stats" }))}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Brain className="h-4 w-4 mr-2" />
              Estadísticas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderGameSession = () => {
    const isInfiniteMode = gameState.mode.includes("infinite")

    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${gameState.currentColor} flex flex-col items-center justify-center p-4 transition-all duration-[10000ms] ease-in-out`}
      >
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Header con controles */}
        <div className="relative z-10 w-full max-w-4xl mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="text-white/80">
              <p className="flex items-center">
                {isInfiniteMode ? <Infinity className="h-4 w-4 mr-1" /> : <Timer className="h-4 w-4 mr-1" />}
                Tiempo: {formatTime(gameState.sessionTime)}
              </p>
              <p>Bits: {gameState.bitsProcessed.toLocaleString()}</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={gameState.isActive ? stopSession : () => startSession(gameState.mode as any)}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {gameState.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() =>
                  setGameState((prev) => ({
                    ...prev,
                    mode: isInfiniteMode ? "game-select" : "mode-select",
                    isActive: false,
                  }))
                }
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setGameState((prev) => ({ ...prev, mode: "main-menu", isActive: false }))}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-white/80 text-sm">
              <span>Profundidad Hipnagógica</span>
              <span>{gameState.depth}%</span>
            </div>
            <Progress value={gameState.depth} className="h-2 bg-white/20" />
          </div>

          {/* Comparación de bits */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/10 p-3 rounded-lg">
              <p className="text-blue-300 text-sm">Mente Consciente</p>
              <p className="text-white font-bold">40-50 bits/seg</p>
            </div>
            <div className="bg-white/10 p-3 rounded-lg">
              <p className="text-yellow-300 text-sm">Subconsciente</p>
              <p className="text-white font-bold">11M bits/seg</p>
            </div>
          </div>
        </div>

        {/* Palabra central flotante */}
        <div className="relative z-10 text-center mb-8">
          <div className="animate-pulse">
            <h1 className="text-6xl md:text-8xl font-light text-white/90 mb-4 transition-all duration-[10000ms]">
              {gameState.currentWord}
            </h1>
          </div>
          {gameState.mode.includes("guided") && gameState.question && (
            <p className="text-white/70 text-lg italic">"{gameState.question}"</p>
          )}
          {isInfiniteMode && (
            <Badge className="bg-white/20 text-white mt-2">
              <Infinity className="h-3 w-3 mr-1" />
              Modo Infinito
            </Badge>
          )}
        </div>

        {/* Entrada rápida de diario */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <Textarea
              placeholder="Anota una idea rápida..."
              value={newJournalEntry}
              onChange={(e) => setNewJournalEntry(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mb-2"
              rows={2}
            />
            <Button
              onClick={saveToJournal}
              className="w-full bg-white/20 hover:bg-white/30 text-white"
              disabled={!newJournalEntry.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Idea
            </Button>
          </div>
        </div>

        {/* Recordatorio de hidratación */}
        {gameState.sessionTime > 300 && (
          <div className="relative z-10 mt-4 bg-blue-500/20 p-3 rounded-lg text-white text-center">
            <p>💧 ¡Recuerda hidratarte y seguir explorando!</p>
          </div>
        )}
      </div>
    )
  }

  const renderJournal = () => (
    <div className={`min-h-screen bg-gradient-to-br ${THEMES[gameState.theme].colors[0]} p-4`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button
            onClick={() => setGameState((prev) => ({ ...prev, mode: "main-menu" }))}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Menú
          </Button>
          <Button
            onClick={() => setGameState((prev) => ({ ...prev, mode: "stats" }))}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Brain className="h-4 w-4 mr-2" />
            Estadísticas
          </Button>
        </div>

        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-center flex items-center justify-center">
              <BookOpen className="h-6 w-6 mr-2" />
              Diario Hipnagógico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {gameState.journalEntries.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                  <p className="text-purple-200 text-lg italic">Aún no has guardado ninguna idea.</p>
                  <p className="text-purple-300 text-sm mt-2">¡Comienza una sesión para explorar tu subconsciente!</p>
                </div>
              ) : (
                gameState.journalEntries.map((entry, index) => (
                  <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <p className="text-white leading-relaxed">{entry}</p>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-purple-300 text-sm">Entrada #{index + 1}</p>
                      <Badge className="bg-purple-600/50 text-white text-xs">{new Date().toLocaleDateString()}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={() => setGameState((prev) => ({ ...prev, mode: "game-select" }))}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Play className="h-4 w-4 mr-2" />
                Nueva Sesión
              </Button>
              <Button
                onClick={() => setGameState((prev) => ({ ...prev, mode: "main-menu" }))}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Home className="h-4 w-4 mr-2" />
                Menú Principal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderStats = () => (
    <div className={`min-h-screen bg-gradient-to-br ${THEMES[gameState.theme].colors[1]} p-4`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button
            onClick={() => setGameState((prev) => ({ ...prev, mode: "main-menu" }))}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Menú
          </Button>
          <Button
            onClick={() => setGameState((prev) => ({ ...prev, mode: "journal" }))}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Ver Diario
          </Button>
        </div>

        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-center flex items-center justify-center">
              <Brain className="h-6 w-6 mr-2" />
              Estadísticas de Exploración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <h3 className="text-purple-300 text-sm">Total de Bits Procesados</h3>
                <p className="text-white text-2xl font-bold">{gameState.bitsProcessed.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <h3 className="text-blue-300 text-sm">Tiempo Total</h3>
                <p className="text-white text-2xl font-bold">{formatTime(gameState.sessionTime)}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg text-center">
                <h3 className="text-green-300 text-sm">Ideas Guardadas</h3>
                <p className="text-white text-2xl font-bold">{gameState.journalEntries.length}</p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="text-white text-lg mb-3">Palabras Descubiertas</h3>
              <div className="flex flex-wrap gap-2">
                {gameState.discoveries.length === 0 ? (
                  <p className="text-purple-200 italic">Inicia una sesión para descubrir palabras</p>
                ) : (
                  gameState.discoveries.map((word, index) => (
                    <Badge key={index} className="bg-purple-600/50 text-white">
                      {word}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="text-white text-lg mb-3">Progreso de Exploración</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-white/80 mb-1">
                    <span>Profundidad Máxima Alcanzada</span>
                    <span>{gameState.depth}%</span>
                  </div>
                  <Progress value={gameState.depth} className="h-2 bg-white/20" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={() => setGameState((prev) => ({ ...prev, mode: "game-select" }))}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Play className="h-4 w-4 mr-2" />
                Nueva Exploración
              </Button>
              <Button
                onClick={() => setGameState((prev) => ({ ...prev, mode: "main-menu" }))}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Home className="h-4 w-4 mr-2" />
                Menú Principal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Renderizado principal
  switch (gameState.mode) {
    case "main-menu":
      return renderMainMenu()
    case "learn-more":
      return renderLearnMore()
    case "settings":
      return renderSettings()
    case "game-select":
      return renderGameSelect()
    case "intro":
      return renderIntro()
    case "tutorial":
      return renderTutorial()
    case "mode-select":
      return renderModeSelect()
    case "guided":
    case "free":
    case "infinite-guided":
    case "infinite-free":
      return renderGameSession()
    case "journal":
      return renderJournal()
    case "stats":
      return renderStats()
    case "dream-recorder":
      return (
        <DreamRecorder
          onBack={() => setGameState((prev) => ({ ...prev, mode: "main-menu" }))}
          theme={THEMES[gameState.theme].colors[0]}
        />
      )
    case "timer":
      return (
        <TimerComponent
          onBack={() => setGameState((prev) => ({ ...prev, mode: "main-menu" }))}
          theme={THEMES[gameState.theme].colors[0]}
        />
      )
    case "inception-game":
      return (
        <InceptionGame
          onBack={() => setGameState((prev) => ({ ...prev, mode: "main-menu" }))}
          theme={THEMES[gameState.theme].colors[0]}
        />
      )
    default:
      return renderMainMenu()
  }
}
