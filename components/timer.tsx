"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  ArrowLeft,
  Clock,
  Bell,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Settings,
} from "lucide-react"

interface TimerSettings {
  duration: number
  reminderInterval: number
  soundEnabled: boolean
  vibrationEnabled: boolean
  autoStart: boolean
  theme: "focus" | "sleep" | "meditation" | "lucid"
}

interface TimerProps {
  onBack: () => void
  theme: string
}

const TIMER_THEMES = {
  focus: {
    name: "Concentración",
    color: "from-blue-600 to-cyan-600",
    icon: Clock,
    description: "Para sesiones de trabajo enfocado",
  },
  sleep: {
    name: "Sueño",
    color: "from-indigo-600 to-purple-600",
    icon: Moon,
    description: "Para transición al sueño",
  },
  meditation: {
    name: "Meditación",
    color: "from-green-600 to-emerald-600",
    icon: Sun,
    description: "Para práctica meditativa",
  },
  lucid: {
    name: "Sueño Lúcido",
    color: "from-purple-600 to-pink-600",
    icon: Moon,
    description: "Para inducir sueños lúcidos",
  },
}

export default function Timer({ onBack, theme }: TimerProps) {
  const [settings, setSettings] = useState<TimerSettings>({
    duration: 300, // 5 minutos
    reminderInterval: 60, // 1 minuto
    soundEnabled: true,
    vibrationEnabled: true,
    autoStart: false,
    theme: "sleep",
  })

  const [isActive, setIsActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(settings.duration)
  const [isPaused, setIsPaused] = useState(false)
  const [phase, setPhase] = useState<"preparation" | "active" | "reminder" | "completed">("preparation")
  const [reminderCount, setReminderCount] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout>()
  const audioContextRef = useRef<AudioContext>()

  // Efectos de sonido
  const playSound = (frequency: number, duration: number, type: "sine" | "square" | "triangle" = "sine") => {
    if (!settings.soundEnabled) return

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    oscillator.type = type

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }

  // Vibración
  const vibrate = (pattern: number[]) => {
    if (settings.vibrationEnabled && "vibrate" in navigator) {
      navigator.vibrate(pattern)
    }
  }

  // Iniciar temporizador
  const startTimer = () => {
    setIsActive(true)
    setIsPaused(false)
    setPhase("active")
    setTimeRemaining(settings.duration)
    setReminderCount(0)

    playSound(440, 0.2) // Sonido de inicio
    vibrate([100])

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          completeTimer()
          return 0
        }

        // Recordatorio intermedio
        if (prev % settings.reminderInterval === 0 && prev !== settings.duration) {
          triggerReminder()
        }

        return prev - 1
      })
    }, 1000)
  }

  // Pausar/reanudar
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false)
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            completeTimer()
            return 0
          }

          if (prev % settings.reminderInterval === 0 && prev !== settings.duration) {
            triggerReminder()
          }

          return prev - 1
        })
      }, 1000)
    } else {
      setIsPaused(true)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  // Detener temporizador
  const stopTimer = () => {
    setIsActive(false)
    setIsPaused(false)
    setPhase("preparation")
    setTimeRemaining(settings.duration)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    playSound(220, 0.3) // Sonido de parada
  }

  // Recordatorio
  const triggerReminder = () => {
    setPhase("reminder")
    setReminderCount((prev) => prev + 1)

    // Sonido suave para recordatorio
    playSound(330, 0.5, "triangle")
    vibrate([50, 100, 50])

    // Volver a fase activa después de 2 segundos
    setTimeout(() => {
      setPhase("active")
    }, 2000)
  }

  // Completar temporizador
  const completeTimer = () => {
    setIsActive(false)
    setPhase("completed")

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Sonido de finalización
    playSound(523, 1, "sine") // Do alto
    setTimeout(() => playSound(659, 1, "sine"), 300) // Mi alto
    setTimeout(() => playSound(784, 1.5, "sine"), 600) // Sol alto

    vibrate([200, 100, 200, 100, 400])
  }

  // Reiniciar
  const resetTimer = () => {
    stopTimer()
    setTimeRemaining(settings.duration)
  }

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Calcular progreso
  const progress = ((settings.duration - timeRemaining) / settings.duration) * 100

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Auto-inicio si está habilitado
  useEffect(() => {
    if (settings.autoStart && !isActive) {
      const timeout = setTimeout(() => {
        startTimer()
      }, 3000) // 3 segundos de preparación

      return () => clearTimeout(timeout)
    }
  }, [settings.autoStart])

  const currentTheme = TIMER_THEMES[settings.theme]
  const ThemeIcon = currentTheme.icon

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme} p-4`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Menú
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Panel principal del temporizador */}
          <div className="lg:col-span-2">
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-center flex items-center justify-center">
                  <ThemeIcon className="h-6 w-6 mr-2" />
                  Temporizador {currentTheme.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Display principal */}
                <div className="text-center">
                  <div
                    className={`text-8xl font-mono font-bold text-white mb-4 ${
                      phase === "reminder" ? "animate-pulse" : ""
                    }`}
                  >
                    {formatTime(timeRemaining)}
                  </div>

                  <Progress value={progress} className="h-3 mb-4" />

                  <div className="flex justify-center space-x-2 mb-6">
                    <Badge
                      className={`${
                        phase === "preparation"
                          ? "bg-blue-600"
                          : phase === "active"
                            ? "bg-green-600"
                            : phase === "reminder"
                              ? "bg-yellow-600"
                              : "bg-purple-600"
                      }`}
                    >
                      {phase === "preparation"
                        ? "Preparación"
                        : phase === "active"
                          ? "Activo"
                          : phase === "reminder"
                            ? "Recordatorio"
                            : "Completado"}
                    </Badge>

                    {reminderCount > 0 && (
                      <Badge variant="outline" className="text-white border-white/30">
                        Recordatorios: {reminderCount}
                      </Badge>
                    )}
                  </div>

                  {/* Controles principales */}
                  <div className="flex justify-center space-x-4">
                    {!isActive ? (
                      <Button
                        onClick={startTimer}
                        className={`h-16 w-16 rounded-full bg-gradient-to-r ${currentTheme.color}`}
                      >
                        <Play className="h-8 w-8" />
                      </Button>
                    ) : (
                      <Button
                        onClick={togglePause}
                        className="h-16 w-16 rounded-full bg-yellow-600 hover:bg-yellow-700"
                      >
                        {isPaused ? <Play className="h-8 w-8" /> : <Pause className="h-8 w-8" />}
                      </Button>
                    )}

                    <Button
                      onClick={stopTimer}
                      className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
                      disabled={!isActive}
                    >
                      <Square className="h-8 w-8" />
                    </Button>

                    <Button onClick={resetTimer} className="h-16 w-16 rounded-full bg-gray-600 hover:bg-gray-700">
                      <RotateCcw className="h-8 w-8" />
                    </Button>
                  </div>
                </div>

                {/* Información de fase */}
                {phase === "completed" && (
                  <div className="bg-green-500/20 p-4 rounded-lg text-center">
                    <h3 className="text-white text-xl font-semibold mb-2">¡Sesión Completada!</h3>
                    <p className="text-green-200">Has completado tu sesión de {currentTheme.name.toLowerCase()}</p>
                  </div>
                )}

                {phase === "reminder" && (
                  <div className="bg-yellow-500/20 p-4 rounded-lg text-center">
                    <h3 className="text-white text-lg font-semibold mb-2">💧 Recordatorio</h3>
                    <p className="text-yellow-200">Mantente hidratado y continúa con tu práctica</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel de configuración */}
          <div>
            <Card className="bg-black/20 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Duración */}
                <div>
                  <label className="text-white text-sm mb-2 block">
                    Duración: {Math.floor(settings.duration / 60)}:
                    {(settings.duration % 60).toString().padStart(2, "0")}
                  </label>
                  <Slider
                    value={[settings.duration]}
                    onValueChange={([value]) => {
                      setSettings((prev) => ({ ...prev, duration: value }))
                      if (!isActive) setTimeRemaining(value)
                    }}
                    min={60}
                    max={3600}
                    step={60}
                    className="w-full"
                    disabled={isActive}
                  />
                </div>

                {/* Intervalo de recordatorio */}
                <div>
                  <label className="text-white text-sm mb-2 block">
                    Recordatorio cada: {settings.reminderInterval}s
                  </label>
                  <Slider
                    value={[settings.reminderInterval]}
                    onValueChange={([value]) => setSettings((prev) => ({ ...prev, reminderInterval: value }))}
                    min={30}
                    max={300}
                    step={30}
                    className="w-full"
                    disabled={isActive}
                  />
                </div>

                {/* Tema del temporizador */}
                <div>
                  <label className="text-white text-sm mb-2 block">Tema</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(TIMER_THEMES).map(([key, themeData]) => {
                      const Icon = themeData.icon
                      return (
                        <Button
                          key={key}
                          onClick={() => setSettings((prev) => ({ ...prev, theme: key as any }))}
                          className={`h-12 text-xs ${
                            settings.theme === key
                              ? `bg-gradient-to-r ${themeData.color}`
                              : "bg-white/10 hover:bg-white/20"
                          }`}
                          disabled={isActive}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {themeData.name}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Opciones de sonido y vibración */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {settings.soundEnabled ? (
                        <Volume2 className="h-4 w-4 text-white" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-white" />
                      )}
                      <span className="text-white text-sm">Sonido</span>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, soundEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-white" />
                      <span className="text-white text-sm">Vibración</span>
                    </div>
                    <Switch
                      checked={settings.vibrationEnabled}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, vibrationEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Play className="h-4 w-4 text-white" />
                      <span className="text-white text-sm">Auto-inicio</span>
                    </div>
                    <Switch
                      checked={settings.autoStart}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoStart: checked }))}
                      disabled={isActive}
                    />
                  </div>
                </div>

                {/* Descripción del tema actual */}
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-white/80 text-sm">{currentTheme.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
