import './style.css'
import {
  compressPdf,
  getAvailableCompressionEngines,
  formatBytes,
  formatPercentage,
  initCompressionEngine,
} from '@acajoo/giovanni-core'
import type { CompressionEngine } from '@acajoo/giovanni-core'

function mustQuery<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Missing required element: ${selector}`)
  }

  return element
}

const dropzone = mustQuery<HTMLLabelElement>('#dropzone')
const fileInput = mustQuery<HTMLInputElement>('#file-input')
const engineSelect = mustQuery<HTMLSelectElement>('#engine-select')
const presetSelect = mustQuery<HTMLSelectElement>('#preset-select')
const selectedFileEl = mustQuery<HTMLSpanElement>('#selected-file')
const compressBtn = mustQuery<HTMLButtonElement>('#compress-btn')
const statusEl = mustQuery<HTMLParagraphElement>('#status')
const resultEl = mustQuery<HTMLElement>('#result')
const downloadLink = mustQuery<HTMLAnchorElement>('#download-link')
const originalSizeEl = mustQuery<HTMLElement>('#original-size')
const compressedSizeEl = mustQuery<HTMLElement>('#compressed-size')
const savedSizeEl = mustQuery<HTMLElement>('#saved-size')
const savedPercentEl = mustQuery<HTMLElement>('#saved-percent')
const engineEl = mustQuery<HTMLElement>('#engine')
const durationEl = mustQuery<HTMLElement>('#duration')

let selectedFile: File | null = null
let resultUrl: string | null = null
const initPromises: Partial<Record<CompressionEngine, Promise<void>>> = {}

const enginePresets = {
  qpdf: ['default', 'web', 'archive'],
  ghostscript: ['default', 'screen', 'ebook', 'printer', 'prepress'],
} as const

const engineDefaults = {
  qpdf: 'web',
  ghostscript: 'default',
} as const

type QpdfPreset = (typeof enginePresets.qpdf)[number]
type GhostscriptPreset = (typeof enginePresets.ghostscript)[number]

function setStatus(message: string, kind: 'info' | 'error' = 'info') {
  statusEl.textContent = message
  statusEl.dataset.kind = kind
}

function setBusy(isBusy: boolean) {
  compressBtn.disabled = isBusy || !selectedFile
  compressBtn.textContent = isBusy ? 'Compressing...' : 'Compress PDF'
  dropzone.setAttribute('aria-busy', String(isBusy))
}

function clearResultLink() {
  if (resultUrl) {
    URL.revokeObjectURL(resultUrl)
    resultUrl = null
  }
}

function cloneAsArrayBufferView(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy
}

function updateSelectedFile(file: File | null) {
  selectedFile = file

  selectedFileEl.textContent = file
    ? `${file.name} (${formatBytes(file.size)})`
    : 'No file selected'

  compressBtn.disabled = !file

  setStatus(file ? 'Ready to compress.' : 'Choose a PDF to get started.')
}

function ensurePdf(file: File): boolean {
  const nameLooksPdf = file.name.toLowerCase().endsWith('.pdf')
  const mimeLooksPdf = file.type === 'application/pdf'
  return nameLooksPdf || mimeLooksPdf
}

function selectedEngine(): CompressionEngine {
  return engineSelect.value as CompressionEngine
}

function selectedPreset(engine: CompressionEngine): string {
  const selected = presetSelect.value
  const valid = enginePresets[engine].includes(selected as never)
  return valid ? selected : engineDefaults[engine]
}

function syncPresetSelect(engine: CompressionEngine) {
  const previous = presetSelect.value
  presetSelect.replaceChildren()

  for (const preset of enginePresets[engine]) {
    const option = document.createElement('option')
    option.value = preset
    option.textContent = preset
    presetSelect.append(option)
  }

  if (enginePresets[engine].includes(previous as never)) {
    presetSelect.value = previous
  } else {
    presetSelect.value = engineDefaults[engine]
  }
}

function setupEngineChoices() {
  const availableEngines = getAvailableCompressionEngines()
  const preferredDefaultEngine: CompressionEngine = 'ghostscript'

  for (const option of Array.from(engineSelect.options)) {
    option.disabled = !availableEngines.includes(option.value as CompressionEngine)
  }

  if (availableEngines.includes(preferredDefaultEngine)) {
    engineSelect.value = preferredDefaultEngine
  } else if (!availableEngines.includes(engineSelect.value as CompressionEngine)) {
    engineSelect.value = availableEngines[0] ?? 'qpdf'
  }

  syncPresetSelect(selectedEngine())
}

async function initEngineOnce(engine: CompressionEngine) {
  if (!initPromises[engine]) {
    initPromises[engine] = initCompressionEngine(engine)
  }

  await initPromises[engine]
}

function updateResultStats(result: Awaited<ReturnType<typeof compressPdf>>, durationMs: number) {
  resultEl.hidden = false
  originalSizeEl.textContent = formatBytes(result.originalSize)
  compressedSizeEl.textContent = formatBytes(result.compressedSize)
  savedSizeEl.textContent = formatBytes(result.savedBytes)
  const compressionDelta = -result.percentageSaved
  savedPercentEl.textContent = formatPercentage(compressionDelta)
  engineEl.textContent = `${result.engine} / ${result.preset}`
  durationEl.textContent = `${Math.round(durationMs)} ms`
}

async function handleCompression() {
  if (!selectedFile) {
    setStatus('Please choose a PDF file first.', 'error')
    return
  }

  if (!ensurePdf(selectedFile)) {
    setStatus('Only PDF files are supported in this demo.', 'error')
    return
  }

  setBusy(true)
  const engine = selectedEngine()
  const preset = selectedPreset(engine)
  setStatus(`Initializing ${engine} engine...`)

  try {
    await initEngineOnce(engine)

    setStatus('Compressing PDF...')
    const start = performance.now()
    const bytes = await selectedFile.arrayBuffer()
    const qpdfPreset = preset as QpdfPreset
    const ghostscriptPreset = preset as GhostscriptPreset
    const result = engine === 'qpdf'
      ? await compressPdf(bytes, {
        engine: 'qpdf',
        preset: qpdfPreset,
        linearize: qpdfPreset === 'web',
      })
      : await compressPdf(bytes, {
        engine: 'ghostscript',
        preset: ghostscriptPreset,
      })

    const elapsed = performance.now() - start
    updateResultStats(result, elapsed)

    clearResultLink()
    const blobData = cloneAsArrayBufferView(result.data)
    resultUrl = URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }))

    const baseName = selectedFile.name.replace(/\.pdf$/i, '')
    downloadLink.href = resultUrl
    downloadLink.download = `${baseName || 'compressed'}.compressed.pdf`

    setStatus('Compression complete. You can download the compressed PDF.')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    setStatus(`Compression failed: ${message}`, 'error')
  } finally {
    setBusy(false)
  }
}

function onFileChosen(file: File | null) {
  updateSelectedFile(file)
}

dropzone.addEventListener('dragover', (event) => {
  event.preventDefault()
  dropzone.classList.add('is-dragging')
})

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('is-dragging')
})

dropzone.addEventListener('drop', (event) => {
  event.preventDefault()
  dropzone.classList.remove('is-dragging')

  const file = event.dataTransfer?.files?.[0] ?? null
  onFileChosen(file)
})

fileInput.addEventListener('change', () => {
  onFileChosen(fileInput.files?.[0] ?? null)
})

dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    fileInput.click()
  }
})

compressBtn.addEventListener('click', () => {
  void handleCompression()
})

engineSelect.addEventListener('change', () => {
  syncPresetSelect(selectedEngine())
})

window.addEventListener('beforeunload', () => {
  clearResultLink()
})

setupEngineChoices()
