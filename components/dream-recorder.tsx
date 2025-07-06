"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Mic,
  Square,
  Download,
  ArrowLeft,
  Activity,
  Waves,
  Volume2,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Zap,
} from "lucide-react"

interface AudioAnalysis {
  timestamp: number
  frequencies: number[]
  amplitude: number
  dominantFreq: number
  noiseLevel: number
  clarity: number
}

interface NoisePoint {
  timestamp: number
  amplitude: number
  type: "spike" | "sustained" | "background"
  severity: "low" | "medium" | "high"
}

interface DreamRecording {
  id: string
  date: string
  duration: number
  audioBlob?: Blob
  audioAnalysis: AudioAnalysis[]
  noisePoints: NoisePoint[]
  notes: string
  dreamType: "normal" | "lucid" | "nightmare" | "hypnagogic"
  tags: string[]
  averageAmplitude: number
  maxAmplitude: number
  silencePercentage: number
}

interface DreamRecorderProps {
  onBack: () => void
  theme: string
}

export default function DreamRecorder({ onBack, theme }: DreamRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis[]>([])
  const [noisePoints, setNoisePoints] = useState<NoisePoint[]>([])
  const [currentRecording, setCurrentRecording] = useState<DreamRecording | null>(null)
  const [recordings, setRecordings] = useState<DreamRecording[]>([])
  const [recordingTime, setRecordingTime] = useState(0)

  // Estados para detección automática de micrófono
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0)
  const [microphoneStatus, setMicrophoneStatus] = useState<"testing" | "working" | "failed" | "no-sound">("testing")
  const [autoDetectionActive, setAutoDetectionActive] = useState(false)
  const [soundDetectionTimer, setSoundDetectionTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastSoundDetected, setLastSoundDetected] = useState(Date.now())

  // Estados para análisis avanzado
  const [showRealTimeGraphs, setShowRealTimeGraphs] = useState(true)
  const [analysisMode, setAnalysisMode] = useState<"basic" | "advanced">("basic")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frequencyCanvasRef = useRef<HTMLCanvasElement>(null)
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  // Usar un tipo de unión para el ref que pueda ser MediaRecorder o null
  // Usar tipo que pueda ser MediaRecorder o null
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])

  // Obtener dispositivo de audio predeterminado
  const getAudioDevice = async () => {
    try {
      console.log("Solicitando acceso al micrófono...")
      
      // Solicitar acceso al micrófono con configuración básica
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      // Detener el stream temporal
      stream.getTracks().forEach(track => track.stop())
      
      console.log("Acceso al micrófono concedido")
      return true
      
    } catch (error) {
      console.error("Error al acceder al micrófono:", error)
      alert("No se pudo acceder al micrófono. Por favor, verifica los permisos e inténtalo de nuevo.")
      return false
    }
  }

  // Inicializar audio context y análisis
  const initializeAudio = async () => {
    try {
      console.log("Inicializando audio...")
      
      // Limpiar contexto anterior si existe
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            console.log("Cerrando contexto de audio existente...")
            await audioContextRef.current.close()
          }
        } catch (error) {
          console.error('Error al cerrar el contexto de audio anterior:', error)
        } finally {
          audioContextRef.current = null
        }
      }

      // Detener cualquier stream existente
      if (audioStream) {
        console.log("Deteniendo stream de audio existente...")
        audioStream.getTracks().forEach(track => track.stop())
        setAudioStream(null)
      }

      // Configuración básica del micrófono
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        },
      }

      console.log("Solicitando acceso al micrófono...")
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("Acceso al micrófono concedido")
      setAudioStream(stream)

      // Crear contexto de audio
      console.log("Creando AudioContext...")
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 44100
      })

      // Reanudar contexto si está suspendido
      if (audioContext.state === "suspended") {
        console.log("Reanudando AudioContext suspendido...")
        await audioContext.resume()
      }

      audioContextRef.current = audioContext
      console.log("AudioContext creado con estado:", audioContext.state)

      // Crear y configurar analizador
      console.log("Configurando analizador de audio...")
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.3
      analyser.minDecibels = -90
      analyser.maxDecibels = -10
      analyserRef.current = analyser

      // Conectar stream al analizador
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Crear MediaRecorder
      console.log("Creando MediaRecorder...")
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      setMediaRecorder(mediaRecorder)

      console.log("Audio inicializado correctamente")
      return true
      
    } catch (error) {
      console.error("Error al inicializar el audio:", error)
      alert("Error al acceder al micrófono. Asegúrate de que tienes un micrófono conectado y los permisos necesarios.")
      return false
    }
  }


  // Análisis de audio en tiempo real con gráficas múltiples
  const analyzeAudio = () => {
    console.log('Iniciando análisis de audio...')
    
    if (!analyserRef.current) {
      console.error('No hay analizador de audio disponible')
      return
    }

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const timeDataArray = new Uint8Array(bufferLength)

    // Limpiar animación previa si existe
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    const draw = () => {
      try {
        // Verificar si el audio está silenciado o suspendido
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          console.log('AudioContext suspendido, intentando reanudar...')
          audioContextRef.current.resume()
          animationRef.current = requestAnimationFrame(draw)
          return
        }

        if (!isRecording || !analyserRef.current) {
          console.log('Grabación detenida o analizador no disponible')
          return
        }
        
        // Forzar una actualización del estado para asegurar que el componente se renderice
        setAudioAnalysis(prev => [...prev].slice(-1))

        // Obtener datos de frecuencia y dominio del tiempo
        analyser.getByteFrequencyData(dataArray)
        analyser.getByteTimeDomainData(timeDataArray)

        // Calcular métricas mejoradas
        let sum = 0
        let max = 0
        for (let i = 0; i < timeDataArray.length; i++) {
          const value = Math.abs(timeDataArray[i] - 128) / 128
          sum += value
          max = Math.max(max, value)
        }

        const amplitude = max
        const averageAmplitude = sum / timeDataArray.length

        console.log('Amplitud detectada:', amplitude) // Log para depuración

        // Calcular frecuencia dominante
        let maxFreqIndex = 0
        let maxFreqValue = 0
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > maxFreqValue) {
            maxFreqValue = dataArray[i]
            maxFreqIndex = i
          }
        }
        const dominantFreq = (maxFreqIndex * (44100 / 2)) / bufferLength

        // Calcular nivel de ruido (frecuencias altas)
        const highFreqStart = Math.floor(dataArray.length * 0.7)
        const noiseLevel = highFreqStart < dataArray.length 
          ? dataArray.slice(highFreqStart).reduce((sum, val) => sum + val, 0) / (dataArray.length - highFreqStart) / 255 
          : 0

        // Calcular claridad
        const clarity = 1 - noiseLevel * 0.5

        // Log de depuración
        console.log("Amplitud:", amplitude.toFixed(4), "Frecuencia dominante:", dominantFreq.toFixed(2), "Hz")

        // Guardar análisis
        const analysis: AudioAnalysis = {
          timestamp: Date.now(),
          frequencies: Array.from(dataArray),
          amplitude,
          dominantFreq,
          noiseLevel,
          clarity,
        }


        setAudioAnalysis((prev) => {
          const newAnalysis = [...prev.slice(-100), analysis]
          return newAnalysis
        })

        // Dibujar gráficas SIEMPRE durante la grabación
        if (isRecording) {
          drawWaveform(timeDataArray)
          drawFrequencySpectrum(dataArray)
          drawNoiseAnalysis()
        }

        animationRef.current = requestAnimationFrame(draw)
      } catch (error) {
        console.error('Error en el análisis de audio:', error)
      }
    }


    // Iniciar el bucle de renderizado
    draw()
  }

  // Dibujar forma de onda mejorada
  const drawWaveform = (timeDataArray: Uint8Array) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const isMobile = window.innerWidth < 768
    canvas.width = isMobile ? 300 : 600
    canvas.height = isMobile ? 120 : 200

    // Limpiar canvas con fondo oscuro
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Configurar estilo de línea más visible
    ctx.lineWidth = isMobile ? 2 : 3
    ctx.strokeStyle = "#8b5cf6"
    ctx.shadowColor = "#8b5cf6"
    ctx.shadowBlur = 2

    // Dibujar línea central de referencia
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()

    // Dibujar forma de onda
    ctx.strokeStyle = "#8b5cf6"
    ctx.lineWidth = isMobile ? 2 : 3
    ctx.beginPath()

    const sliceWidth = canvas.width / timeDataArray.length
    let x = 0

    for (let i = 0; i < timeDataArray.length; i++) {
      const v = (timeDataArray[i] - 128) / 128.0
      const y = (v * canvas.height) / 2 + canvas.height / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.stroke()

    // Resetear shadow
    ctx.shadowBlur = 0
  }

  // Dibujar espectro de frecuencias
  const drawFrequencySpectrum = (dataArray: Uint8Array) => {
    const canvas = frequencyCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const isMobile = window.innerWidth < 768
    canvas.width = isMobile ? 300 : 600
    canvas.height = isMobile ? 100 : 150

    // Limpiar canvas
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dibujar barras de frecuencia
    const barWidth = (canvas.width / dataArray.length) * 2.5
    let barX = 0

    for (let i = 0; i < dataArray.length / 4; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height

      // Color basado en la intensidad
      const intensity = dataArray[i] / 255
      if (intensity > 0.7) {
        ctx.fillStyle = "#ef4444" // Rojo para alta intensidad
      } else if (intensity > 0.4) {
        ctx.fillStyle = "#f59e0b" // Amarillo para media intensidad
      } else {
        ctx.fillStyle = "#10b981" // Verde para baja intensidad
      }

      ctx.fillRect(barX, canvas.height - barHeight, barWidth, barHeight)
      barX += barWidth + 1
    }
  }

  // Dibujar análisis de ruido
  const drawNoiseAnalysis = () => {
    const canvas = noiseCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const isMobile = window.innerWidth < 768
    canvas.width = isMobile ? 300 : 600
    canvas.height = isMobile ? 80 : 100

    // Limpiar canvas
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dibujar puntos de ruido
    const currentTime = Date.now()
    const timeWindow = 30000 // 30 segundos

    noisePoints
      .filter((point) => currentTime - point.timestamp < timeWindow)
      .forEach((point) => {
        const x = ((currentTime - point.timestamp) / timeWindow) * canvas.width
        const y = canvas.height - point.amplitude * canvas.height

        ctx.beginPath()
        ctx.arc(canvas.width - x, y, 3, 0, 2 * Math.PI)

        // Color basado en severidad
        switch (point.severity) {
          case "high":
            ctx.fillStyle = "#ef4444"
            break
          case "medium":
            ctx.fillStyle = "#f59e0b"
            break
          default:
            ctx.fillStyle = "#10b981"
        }

        ctx.fill()
      })
  }

  // Iniciar grabación
  const startRecording = async () => {
    console.log("Iniciando grabación...")

    try {
      // Detener cualquier grabación previa
      if (isRecording) {
        stopRecording()
      }

      // Limpiar referencias anteriores
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }

      setMicrophoneStatus("working")

      // Inicializar audio
      const success = await initializeAudio()
      if (!success) {
        console.error("No se pudo inicializar el audio")
        return
      }

      // Configurar nuevo recording
      const newRecording: DreamRecording = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: 0,
        audioAnalysis: [],
        noisePoints: [],
        notes: "",
        dreamType: "normal",
        tags: [],
        averageAmplitude: 0,
        maxAmplitude: 0,
        silencePercentage: 0,
      }


      setCurrentRecording(newRecording)
      setAudioAnalysis([])
      setNoisePoints([])
      setRecordingTime(0)

      // Configurar MediaRecorder
      audioChunksRef.current = []
      
      // Usar una variable local para el mediaRecorder
      const mediaRecorder = mediaRecorderRef.current

      // Configurar manejadores de eventos con tipos explícitos
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          console.log("Datos de audio recibidos:", e.data.size, "bytes")
          audioChunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        console.log("MediaRecorder detenido")
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" })
          console.log("Audio blob creado:", audioBlob.size, "bytes")
          setCurrentRecording((prev) => (prev ? { ...prev, audioBlob } : null))
        }
      }
      
      mediaRecorder.onerror = (e: Event) => {
        console.error("Error en MediaRecorder:", e)
        setMicrophoneStatus("failed")
      }

      // Iniciar grabación
      try {
        const mediaRecorder = mediaRecorderRef.current

        // Verificar si el método start existe
        if (typeof mediaRecorder.start !== 'function') {
          throw new Error("El objeto MediaRecorder no tiene un método start válido")
        }

        // Iniciar la grabación
        try {
          mediaRecorder.start(1000) // Grabar en chunks de 1 segundo
          console.log("MediaRecorder iniciado con estado:", mediaRecorder.state)
          
          // Marcar como grabando
          setIsRecording(true)
          
          // Iniciar análisis de audio
          console.log("Iniciando análisis de audio...");
          analyzeAudio();

          // Iniciar temporizador
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          timerRef.current = setInterval(() => {
            setRecordingTime((prev) => prev + 1);
          }, 1000);

          console.log("Grabación iniciada correctamente");
          
          // Iniciar detección de sonido después de que todo esté listo
          startSoundDetection();
        } catch (error) {
          console.error("Error al iniciar la grabación:", error)
          throw error
        }
        
      } catch (error) {
        console.error("Error al iniciar MediaRecorder:", error)
        setMicrophoneStatus("failed")
        setIsRecording(false)
      }
      
    } catch (error) {
      console.error("Error en startRecording:", error)
      setMicrophoneStatus("failed")
      setIsRecording(false)
    }
  }

  // Detener grabación
  const stopRecording = () => {
    console.log("Deteniendo grabación...")
    
    // Detener el temporizador primero
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    // Detener el análisis de audio
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    // Detener el MediaRecorder
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      try {
        mediaRecorder.stop()
        console.log("MediaRecorder detenido")
      } catch (error) {
        console.error("Error al detener MediaRecorder:", error)
      }
    }
    
    // Detener las pistas de audio
    if (audioStream) {
      audioStream.getTracks().forEach(track => {
        console.log("Deteniendo pista:", track.kind)
        track.stop()
      })
      setAudioStream(null)
    }
    
    // Cerrar el contexto de audio
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().then(() => {
          console.log("AudioContext cerrado correctamente")
        }).catch(error => {
          console.error("Error al cerrar AudioContext:", error)
        })
      }
      audioContextRef.current = null
    }
    
    setIsRecording(false)
    console.log("Grabación detenida completamente")
  }

  // Guardar grabación
  const saveRecording = (notes: string, dreamType: string, tags: string[]) => {
    if (!currentRecording) return

    const finalRecording = {
      ...currentRecording,
      notes,
      dreamType: dreamType as any,
      tags,
    }

    setRecordings((prev) => [...prev, finalRecording])
    setCurrentRecording(null)

    // Guardar en localStorage
    localStorage.setItem("dreamRecordings", JSON.stringify([...recordings, finalRecording]))
  }

  // Cargar grabaciones guardadas
  useEffect(() => {
    const saved = localStorage.getItem("dreamRecordings")
    if (saved) {
      setRecordings(JSON.parse(saved))
    }

    // Verificar acceso al micrófono
    getAudioDevice()
  }, [])

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Descargar grabación
  const downloadRecording = (recording: DreamRecording) => {
    if (!recording.audioBlob) return

    const url = URL.createObjectURL(recording.audioBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dream-${recording.date.split("T")[0]}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Renderizar estado del micrófono
  const renderMicrophoneStatus = () => {
    const statusConfig = {
      testing: {
        icon: <Activity className="h-4 w-4 animate-spin" />,
        text: "Probando micrófono...",
        color: "bg-yellow-500/20 border-yellow-500/30 text-yellow-200",
      },
      working: {
        icon: <CheckCircle className="h-4 w-4" />,
        text: `Micrófono funcionando: ${audioDevices[currentDeviceIndex]?.label || "Dispositivo " + (currentDeviceIndex + 1)}`,
        color: "bg-green-500/20 border-green-500/30 text-green-200",
      },
      "no-sound": {
        icon: <AlertTriangle className="h-4 w-4" />,
        text: "No se detecta sonido, probando siguiente micrófono...",
        color: "bg-orange-500/20 border-orange-500/30 text-orange-200",
      },
      failed: {
        icon: <XCircle className="h-4 w-4" />,
        text: "No se pudo acceder a ningún micrófono. Verifica permisos.",
        color: "bg-red-500/20 border-red-500/30 text-red-200",
      },
    }

    const config = statusConfig[microphoneStatus]

    return (
      <Alert className={`${config.color} border`}>
        <div className="flex items-center space-x-2">
          {config.icon}
          <AlertDescription className="text-sm">{config.text}</AlertDescription>
        </div>
      </Alert>
    )
  }

  // Auto-inicializar cuando se monta el componente
  useEffect(() => {
    const initializeOnMount = async () => {
      console.log("Inicializando componente...")
      await getAudioDevices()
    }

    initializeOnMount()
  }, [])

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {})
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (soundDetectionTimer) {
        clearTimeout(soundDetectionTimer)
      }
      const currentMediaRecorder = mediaRecorderRef.current
      if (currentMediaRecorder) {
        if (currentMediaRecorder.state === "recording") {
          currentMediaRecorder.stop()
          // Detener todas las pistas del stream
          if (currentMediaRecorder.stream) {
            currentMediaRecorder.stream.getTracks().forEach(track => track.stop())
          }
        }
      }
    }
  }, [])

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme} p-2 md:p-4`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 md:mb-6 flex justify-between items-center">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm md:text-base"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
            Volver
          </Button>

          <div className="flex space-x-2">
            <Button
              onClick={() => setShowRealTimeGraphs(!showRealTimeGraphs)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm md:text-base"
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-1 md:mr-2" />
              {showRealTimeGraphs ? "Ocultar" : "Mostrar"} Gráficas
            </Button>

            <Button
              onClick={() => setAnalysisMode(analysisMode === "basic" ? "advanced" : "basic")}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm md:text-base"
              size="sm"
            >
              <TrendingUp className="h-4 w-4 mr-1 md:mr-2" />
              Modo {analysisMode === "basic" ? "Avanzado" : "Básico"}
            </Button>
          </div>
        </div>

        {/* Estado del micrófono */}
        <div className="mb-4">{renderMicrophoneStatus()}</div>

        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-white text-lg md:text-xl text-center flex items-center justify-center">
              <Activity className="h-5 w-5 md:h-6 md:w-6 mr-2" />
              Registro de Sueños Avanzado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="recorder" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/10 h-8 md:h-10">
                <TabsTrigger value="recorder" className="text-white data-[state=active]:bg-white/20 text-xs md:text-sm">
                  Grabador
                </TabsTrigger>
                <TabsTrigger value="realtime" className="text-white data-[state=active]:bg-white/20 text-xs md:text-sm">
                  Tiempo Real
                </TabsTrigger>
                <TabsTrigger value="analysis" className="text-white data-[state=active]:bg-white/20 text-xs md:text-sm">
                  Análisis
                </TabsTrigger>
                <TabsTrigger
                  value="recordings"
                  className="text-white data-[state=active]:bg-white/20 text-xs md:text-sm"
                >
                  Grabaciones
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recorder" className="space-y-4 md:space-y-6 mt-4">
                {/* Panel de grabación */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center justify-between text-sm md:text-base">
                      <span className="flex items-center">
                        <Waves className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                        Grabación Inteligente
                      </span>
                      <Badge className={`text-xs ${isRecording ? "bg-red-600" : "bg-gray-600"}`}>
                        {isRecording ? "GRABANDO" : "DETENIDO"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    {/* Selector manual de micrófono */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-white text-xs md:text-sm mb-2 block">Micrófono</label>
                        <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId} disabled={isRecording}>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white h-8 md:h-10">
                            <SelectValue placeholder="Selecciona un micrófono" />
                          </SelectTrigger>
                          <SelectContent>
                            {audioDevices.map((device) => (
                              <SelectItem key={device.deviceId} value={device.deviceId}>
                                {device.label || `Micrófono ${device.deviceId.slice(0, 8)}...`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-white text-xs md:text-sm mb-2 block">Detección Auto</label>
                        <div className="flex items-center space-x-2 h-8 md:h-10">
                          <Badge className={autoDetectionActive ? "bg-green-600" : "bg-gray-600"}>
                            {autoDetectionActive ? "Activa" : "Inactiva"}
                          </Badge>
                          {microphoneStatus === "working" && (
                            <Badge className="bg-blue-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Funcionando
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controles de grabación */}
                    <div className="flex items-center justify-center space-x-4 md:space-x-6">
                      <div className="text-white text-center">
                        <p className="text-lg md:text-2xl font-mono">{formatTime(recordingTime)}</p>
                        <p className="text-xs md:text-sm text-white/70">Duración</p>
                      </div>

                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`h-12 w-12 md:h-16 md:w-16 rounded-full ${
                          isRecording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                        }`}
                        disabled={microphoneStatus === "failed"}
                      >
                        {isRecording ? (
                          <Square className="h-6 w-6 md:h-8 md:w-8" />
                        ) : (
                          <Mic className="h-6 w-6 md:h-8 md:w-8" />
                        )}
                      </Button>

                      <div className="text-white text-center">
                        <p className="text-sm md:text-lg font-mono">
                          {audioAnalysis.length > 0
                            ? Math.round(audioAnalysis[audioAnalysis.length - 1]?.amplitude * 100)
                            : 0}
                          %
                        </p>
                        <p className="text-xs md:text-sm text-white/70">Amplitud</p>
                      </div>
                    </div>

                    {/* Métricas en tiempo real */}
                    {isRecording && audioAnalysis.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-center">
                        <div className="bg-white/10 p-2 md:p-3 rounded-lg">
                          <p className="text-blue-300 text-xs md:text-sm">Frecuencia Dom.</p>
                          <p className="text-white font-bold text-sm md:text-base">
                            {Math.round(audioAnalysis[audioAnalysis.length - 1]?.dominantFreq || 0)} Hz
                          </p>
                        </div>
                        <div className="bg-white/10 p-2 md:p-3 rounded-lg">
                          <p className="text-green-300 text-xs md:text-sm">Claridad</p>
                          <p className="text-white font-bold text-sm md:text-base">
                            {Math.round((audioAnalysis[audioAnalysis.length - 1]?.clarity || 0) * 100)}%
                          </p>
                        </div>
                        <div className="bg-white/10 p-2 md:p-3 rounded-lg">
                          <p className="text-yellow-300 text-xs md:text-sm">Ruido</p>
                          <p className="text-white font-bold text-sm md:text-base">
                            {Math.round((audioAnalysis[audioAnalysis.length - 1]?.noiseLevel || 0) * 100)}%
                          </p>
                        </div>
                        <div className="bg-white/10 p-2 md:p-3 rounded-lg">
                          <p className="text-purple-300 text-xs md:text-sm">Puntos Ruido</p>
                          <p className="text-white font-bold text-sm md:text-base">{noisePoints.length}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Panel de guardado */}
                {currentRecording && !isRecording && (
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-sm md:text-base">Guardar Grabación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4">
                      {/* Estadísticas de la grabación */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                        <div className="bg-white/10 p-2 rounded-lg">
                          <p className="text-blue-300 text-xs">Amplitud Promedio</p>
                          <p className="text-white text-sm font-bold">
                            {Math.round(currentRecording.averageAmplitude * 100)}%
                          </p>
                        </div>
                        <div className="bg-white/10 p-2 rounded-lg">
                          <p className="text-green-300 text-xs">Amplitud Máxima</p>
                          <p className="text-white text-sm font-bold">
                            {Math.round(currentRecording.maxAmplitude * 100)}%
                          </p>
                        </div>
                        <div className="bg-white/10 p-2 rounded-lg">
                          <p className="text-yellow-300 text-xs">Silencio</p>
                          <p className="text-white text-sm font-bold">
                            {Math.round(currentRecording.silencePercentage)}%
                          </p>
                        </div>
                        <div className="bg-white/10 p-2 rounded-lg">
                          <p className="text-purple-300 text-xs">Puntos de Ruido</p>
                          <p className="text-white text-sm font-bold">{currentRecording.noisePoints.length}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <label className="text-white text-xs md:text-sm mb-2 block">Tipo de Sueño</label>
                          <Select defaultValue="normal">
                            <SelectTrigger className="bg-white/10 border-white/20 text-white h-8 md:h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Sueño Normal</SelectItem>
                              <SelectItem value="lucid">Sueño Lúcido</SelectItem>
                              <SelectItem value="nightmare">Pesadilla</SelectItem>
                              <SelectItem value="hypnagogic">Hipnagógico</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-white text-xs md:text-sm mb-2 block">Etiquetas</label>
                          <Input
                            placeholder="creatividad, música..."
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-8 md:h-10 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-white text-xs md:text-sm mb-2 block">Notas del Sueño</label>
                        <Textarea
                          placeholder="Describe tu experiencia..."
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm"
                          rows={3}
                        />
                      </div>

                      <div className="flex space-x-2 md:space-x-4">
                        <Button
                          onClick={() => saveRecording("", "normal", [])}
                          className="flex-1 bg-green-600 hover:bg-green-700 h-8 md:h-10 text-sm"
                        >
                          <Save className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Guardar
                        </Button>
                        <Button
                          onClick={() => setCurrentRecording(null)}
                          variant="outline"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 md:h-10 text-sm"
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Descartar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="realtime" className="space-y-4 md:space-y-6 mt-4">
                {showRealTimeGraphs && (
                  <div className="space-y-4">
                    {/* Forma de onda */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-sm md:text-base flex items-center">
                          <Waves className="h-4 w-4 mr-2" />
                          Forma de Onda en Tiempo Real
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-black/30 rounded-lg p-2 md:p-4">
                          <canvas
                            ref={canvasRef}
                            className="w-full border border-white/20 rounded"
                            style={{ height: window.innerWidth < 768 ? "120px" : "200px" }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Espectro de frecuencias */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-sm md:text-base flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Espectro de Frecuencias
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-black/30 rounded-lg p-2 md:p-4">
                          <canvas
                            ref={frequencyCanvasRef}
                            className="w-full border border-white/20 rounded"
                            style={{ height: window.innerWidth < 768 ? "100px" : "150px" }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-white/70">
                          <span>Baja Frecuencia</span>
                          <span>Media Frecuencia</span>
                          <span>Alta Frecuencia</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Análisis de ruido */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-sm md:text-base flex items-center">
                          <Zap className="h-4 w-4 mr-2" />
                          Detección de Ruido
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-black/30 rounded-lg p-2 md:p-4">
                          <canvas
                            ref={noiseCanvasRef}
                            className="w-full border border-white/20 rounded"
                            style={{ height: window.innerWidth < 768 ? "80px" : "100px" }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-white/70">
                          <span>30s atrás</span>
                          <span>15s atrás</span>
                          <span>Ahora</span>
                        </div>
                        <div className="mt-2 flex space-x-4 text-xs">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-white/70">Ruido Bajo</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            <span className="text-white/70">Ruido Medio</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className="text-white/70">Ruido Alto</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!showRealTimeGraphs && (
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="text-center py-8 md:py-12">
                      <BarChart3 className="h-12 w-12 md:h-16 md:w-16 text-purple-300 mx-auto mb-4" />
                      <p className="text-white text-sm md:text-lg">Gráficas en tiempo real deshabilitadas</p>
                      <p className="text-white/70 text-xs md:text-sm">Actívalas para ver el análisis visual</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4 md:space-y-6 mt-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm md:text-base">Análisis Avanzado de Frecuencias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-white space-y-3 md:space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-center">
                        <div className="bg-white/10 p-2 md:p-4 rounded-lg">
                          <h4 className="text-blue-300 font-semibold text-xs md:text-sm">Infrasonidos</h4>
                          <p className="text-xs text-white/70">0-20 Hz</p>
                          <p className="text-white text-xs md:text-sm">Respiración profunda</p>
                        </div>
                        <div className="bg-white/10 p-2 md:p-4 rounded-lg">
                          <h4 className="text-green-300 font-semibold text-xs md:text-sm">Bajos</h4>
                          <p className="text-xs text-white/70">20-250 Hz</p>
                          <p className="text-white text-xs md:text-sm">Movimientos corporales</p>
                        </div>
                        <div className="bg-white/10 p-2 md:p-4 rounded-lg">
                          <h4 className="text-yellow-300 font-semibold text-xs md:text-sm">Medios</h4>
                          <p className="text-xs text-white/70">250-4000 Hz</p>
                          <p className="text-white text-xs md:text-sm">Habla durante sueños</p>
                        </div>
                        <div className="bg-white/10 p-2 md:p-4 rounded-lg">
                          <h4 className="text-purple-300 font-semibold text-xs md:text-sm">Altos</h4>
                          <p className="text-xs text-white/70">4000+ Hz</p>
                          <p className="text-white text-xs md:text-sm">Actividad cerebral</p>
                        </div>
                      </div>

                      <div className="bg-white/10 p-3 md:p-4 rounded-lg">
                        <h4 className="text-white font-semibold mb-2 text-sm md:text-base">
                          Interpretación de Patrones
                        </h4>
                        <ul className="text-white/80 space-y-1 text-xs md:text-sm">
                          <li>
                            • <strong>Ondas regulares:</strong> Sueño profundo y reparador
                          </li>
                          <li>
                            • <strong>Picos frecuentes:</strong> Sueño REM activo
                          </li>
                          <li>
                            • <strong>Variaciones bruscas:</strong> Posibles sueños lúcidos
                          </li>
                          <li>
                            • <strong>Silencio prolongado:</strong> Sueño muy profundo
                          </li>
                          <li>
                            • <strong>Ruido constante:</strong> Factores ambientales
                          </li>
                        </ul>
                      </div>

                      {analysisMode === "advanced" && (
                        <div className="bg-white/10 p-3 md:p-4 rounded-lg">
                          <h4 className="text-white font-semibold mb-2 text-sm md:text-base">Análisis Avanzado</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                            <div>
                              <h5 className="text-blue-300 font-semibold mb-1">Detección de Fases del Sueño</h5>
                              <ul className="text-white/80 space-y-1">
                                <li>• Fase 1: Transición (ondas theta)</li>
                                <li>• Fase 2: Sueño ligero (husos del sueño)</li>
                                <li>• Fase 3: Sueño profundo (ondas delta)</li>
                                <li>• REM: Sueños activos (ondas beta)</li>
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-green-300 font-semibold mb-1">Calidad del Sueño</h5>
                              <ul className="text-white/80 space-y-1">
                                <li>• Continuidad: Sin interrupciones</li>
                                <li>• Profundidad: Amplitud de ondas</li>
                                <li>• Eficiencia: Tiempo en sueño profundo</li>
                                <li>• Restauración: Patrones regulares</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recordings" className="space-y-3 md:space-y-4 mt-4">
                <div className="space-y-3 md:space-y-4">
                  {recordings.length === 0 ? (
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="text-center py-8 md:py-12">
                        <Activity className="h-12 w-12 md:h-16 md:w-16 text-purple-300 mx-auto mb-4" />
                        <p className="text-white text-sm md:text-lg">No hay grabaciones</p>
                        <p className="text-white/70 text-xs md:text-sm">Comienza tu primera grabación inteligente</p>
                      </CardContent>
                    </Card>
                  ) : (
                    recordings.map((recording) => (
                      <Card key={recording.id} className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-white text-sm md:text-base">
                                {new Date(recording.date).toLocaleDateString()}
                              </CardTitle>
                              <p className="text-white/70 text-xs md:text-sm">
                                Duración: {formatTime(recording.duration)}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Badge className="bg-purple-600 text-xs">{recording.dreamType}</Badge>
                              {recording.noisePoints.length > 5 && (
                                <Badge className="bg-yellow-600 text-xs">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Ruido
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 md:space-y-3">
                            {/* Estadísticas de la grabación */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-white/10 p-2 rounded">
                                <p className="text-blue-300 text-xs">Amplitud Prom.</p>
                                <p className="text-white text-sm font-bold">
                                  {Math.round(recording.averageAmplitude * 100)}%
                                </p>
                              </div>
                              <div className="bg-white/10 p-2 rounded">
                                <p className="text-green-300 text-xs">Silencio</p>
                                <p className="text-white text-sm font-bold">
                                  {Math.round(recording.silencePercentage)}%
                                </p>
                              </div>
                              <div className="bg-white/10 p-2 rounded">
                                <p className="text-yellow-300 text-xs">Puntos Ruido</p>
                                <p className="text-white text-sm font-bold">{recording.noisePoints.length}</p>
                              </div>
                            </div>

                            {recording.notes && <p className="text-white/80 text-xs md:text-sm">{recording.notes}</p>}

                            <div className="flex space-x-1 md:space-x-2">
                              <Button
                                onClick={() => downloadRecording(recording)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 h-7 md:h-8 text-xs"
                              >
                                <Download className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                Descargar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-7 md:h-8 text-xs"
                              >
                                <Volume2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                Reproducir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-7 md:h-8 text-xs"
                              >
                                <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                Analizar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
