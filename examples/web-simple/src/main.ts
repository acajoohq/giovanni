import './style.css'
import {
  compressPdf,
  formatBytes,
  formatPercentage,
  initCompressionEngine,
} from '@acajoo/giovanni-core'

function mustQuery<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Missing required element: ${selector}`)
  }

  return element
}

const dropzone = mustQuery<HTMLLabelElement>('#dropzone')
const fileInput = mustQuery<HTMLInputElement>('#file-input')
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
let qpdfInitPromise: Promise<void> | null = null

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

async function initQpdfOnce() {
  if (!qpdfInitPromise) {
    qpdfInitPromise = initCompressionEngine('qpdf')
  }

  await qpdfInitPromise
}

function updateResultStats(result: Awaited<ReturnType<typeof compressPdf>>, durationMs: number) {
  resultEl.hidden = false
  originalSizeEl.textContent = formatBytes(result.originalSize)
  compressedSizeEl.textContent = formatBytes(result.compressedSize)
  savedSizeEl.textContent = formatBytes(result.savedBytes)
  savedPercentEl.textContent = formatPercentage(result.percentageSaved)
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
  setStatus('Initializing qpdf engine...')

  try {
    await initQpdfOnce()

    setStatus('Compressing PDF...')
    const start = performance.now()
    const bytes = await selectedFile.arrayBuffer()
    const result = await compressPdf(bytes, {
      engine: 'qpdf',
      preset: 'web',
      linearize: true,
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

window.addEventListener('beforeunload', () => {
  clearResultLink()
})
