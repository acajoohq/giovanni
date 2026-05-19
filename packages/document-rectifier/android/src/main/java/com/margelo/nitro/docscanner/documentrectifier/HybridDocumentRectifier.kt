package com.margelo.nitro.docscanner.documentrectifier

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.graphics.Color
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.core.ArrayBuffer
import com.margelo.nitro.core.Promise
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

@DoNotStrip
class HybridDocumentRectifier : HybridDocumentRectifierSpec() {
  override fun prepareInputTensor(
    sourceUri: String,
    maxProcessingLongEdge: Double,
  ): Promise<TensorPrepResult> {
    return Promise.async {
      val source = decodeProcessingBitmap(sourceUri, maxProcessingLongEdge)
      val tensorBitmap = Bitmap.createScaledBitmap(source, ModelSize, ModelSize, true)
      val tensorBuffer = ByteBuffer
        .allocateDirect(TensorLength * BytesPerFloat)
        .order(ByteOrder.nativeOrder())
      val tensorFloats = tensorBuffer.asFloatBuffer()
      val pixels = IntArray(ModelSize * ModelSize)

      tensorBitmap.getPixels(pixels, 0, ModelSize, 0, 0, ModelSize, ModelSize)
      for (index in pixels.indices) {
        val pixel = pixels[index]
        tensorFloats.put(index, Color.red(pixel) / 255f)
        tensorFloats.put(ModelPlaneLength + index, Color.green(pixel) / 255f)
        tensorFloats.put((ModelPlaneLength * 2) + index, Color.blue(pixel) / 255f)
      }

      tensorBuffer.rewind()
      if (tensorBitmap !== source) tensorBitmap.recycle()
      source.recycle()

      return@async TensorPrepResult(
        source.width.toDouble(),
        source.height.toDouble(),
        ArrayBuffer.wrap(tensorBuffer),
      )
    }
  }

  override fun prepareE2eInputTensor(
    sourceUri: String,
    maxProcessingLongEdge: Double,
  ): Promise<TensorPrepResult> {
    return Promise.async {
      val source = decodeProcessingBitmap(sourceUri, maxProcessingLongEdge)
      val width = source.width
      val height = source.height
      val planeLength = width * height
      val tensorBuffer = ByteBuffer
        .allocateDirect(planeLength * 3 * BytesPerFloat)
        .order(ByteOrder.nativeOrder())
      val tensorFloats = tensorBuffer.asFloatBuffer()
      val pixels = IntArray(planeLength)

      source.getPixels(pixels, 0, width, 0, 0, width, height)
      for (index in pixels.indices) {
        val pixel = pixels[index]
        tensorFloats.put(index, Color.red(pixel) / 255f)
        tensorFloats.put(planeLength + index, Color.green(pixel) / 255f)
        tensorFloats.put((planeLength * 2) + index, Color.blue(pixel) / 255f)
      }

      tensorBuffer.rewind()
      source.recycle()

      return@async TensorPrepResult(
        width.toDouble(),
        height.toDouble(),
        ArrayBuffer.wrap(tensorBuffer),
      )
    }
  }

  override fun remapAndSave(
    sourceUri: String,
    outputUri: String,
    width: Double,
    height: Double,
    flowBuffer: ArrayBuffer,
    maxProcessingLongEdge: Double,
  ): Promise<RectifyResult> {
    val owningFlowBuffer = flowBuffer.asOwning()

    return Promise.async {
      val source = decodeProcessingBitmap(sourceUri, maxProcessingLongEdge)
      val processingWidth = source.width
      val processingHeight = source.height
      val flow = readFlow(owningFlowBuffer)
      val resizedX = resizeFlowChannel(flow, 0, processingWidth, processingHeight)
      val resizedY = resizeFlowChannel(flow, ModelPlaneLength, processingWidth, processingHeight)
      val blurredX = boxBlur(resizedX, processingWidth, processingHeight)
      val blurredY = boxBlur(resizedY, processingWidth, processingHeight)
      val sourcePixels = IntArray(processingWidth * processingHeight)
      val outputPixels = IntArray(processingWidth * processingHeight)

      source.getPixels(sourcePixels, 0, processingWidth, 0, 0, processingWidth, processingHeight)
      for (y in 0 until processingHeight) {
        val rowOffset = y * processingWidth
        for (x in 0 until processingWidth) {
          val index = rowOffset + x
          val sampleX = ((blurredX[index] + 1f) * 0.5f) * (processingWidth - 1)
          val sampleY = ((blurredY[index] + 1f) * 0.5f) * (processingHeight - 1)
          outputPixels[index] = sampleBilinear(
            sourcePixels,
            processingWidth,
            processingHeight,
            sampleX,
            sampleY,
          )
        }
      }

      val outputBitmap = Bitmap.createBitmap(
        outputPixels,
        processingWidth,
        processingHeight,
        Bitmap.Config.ARGB_8888,
      )
      saveJpeg(outputBitmap, outputUri)
      outputBitmap.recycle()
      source.recycle()

      return@async RectifyResult(
        outputUri,
        width,
        height,
        processingWidth.toDouble(),
        processingHeight.toDouble(),
      )
    }
  }

  override fun saveRectifiedTensor(
    tensorBuffer: ArrayBuffer,
    outputUri: String,
    width: Double,
    height: Double,
  ): Promise<RectifyResult> {
    val owningTensorBuffer = tensorBuffer.asOwning()

    return Promise.async {
      val processingWidth = width.roundToInt().coerceAtLeast(1)
      val processingHeight = height.roundToInt().coerceAtLeast(1)
      val planeLength = processingWidth * processingHeight
      val expectedBytes = planeLength * 3 * BytesPerFloat
      val byteBuffer = owningTensorBuffer.getBuffer(true).order(ByteOrder.nativeOrder())

      if (byteBuffer.capacity() != expectedBytes) {
        throw Error(
          "DocScanner rectified tensor has ${byteBuffer.capacity()} bytes; expected $expectedBytes.",
        )
      }

      val tensorFloats = byteBuffer.asFloatBuffer()
      val pixels = IntArray(planeLength)

      for (index in pixels.indices) {
        val red = (tensorFloats.get(index).coerceIn(0f, 1f) * 255f).roundToInt()
        val green = (tensorFloats.get(planeLength + index).coerceIn(0f, 1f) * 255f).roundToInt()
        val blue = (tensorFloats.get((planeLength * 2) + index).coerceIn(0f, 1f) * 255f).roundToInt()
        pixels[index] = (0xff shl 24) or (red shl 16) or (green shl 8) or blue
      }

      val outputBitmap = Bitmap.createBitmap(
        pixels,
        processingWidth,
        processingHeight,
        Bitmap.Config.ARGB_8888,
      )
      saveJpeg(outputBitmap, outputUri)
      outputBitmap.recycle()

      return@async RectifyResult(
        outputUri,
        width,
        height,
        processingWidth.toDouble(),
        processingHeight.toDouble(),
      )
    }
  }

  private fun readFlow(flowBuffer: ArrayBuffer): FloatArray {
    val byteBuffer = flowBuffer.getBuffer(true).order(ByteOrder.nativeOrder())
    if (byteBuffer.capacity() != FlowLength * BytesPerFloat) {
      throw Error("DocScanner flow buffer has ${byteBuffer.capacity()} bytes; expected ${FlowLength * BytesPerFloat}.")
    }

    val floatBuffer = byteBuffer.asFloatBuffer()
    val flow = FloatArray(FlowLength)
    floatBuffer.get(flow)
    return flow
  }

  private fun resolveMaxProcessingLongEdge(maxProcessingLongEdge: Double): Int {
    return maxProcessingLongEdge.roundToInt().coerceIn(
      MinProcessingLongEdge,
      AbsoluteMaxProcessingLongEdge,
    )
  }

  private fun decodeProcessingBitmap(uri: String, maxProcessingLongEdge: Double): Bitmap {
    val path = uriToPath(uri)
    val decoded = BitmapFactory.decodeFile(path)
      ?: throw Error("Unable to decode image: $uri")
    val oriented = applyExifOrientation(decoded, path)
    val scaled = scaleToMaxLongEdge(oriented, resolveMaxProcessingLongEdge(maxProcessingLongEdge))

    if (oriented !== decoded) decoded.recycle()
    if (scaled !== oriented) oriented.recycle()

    return scaled
  }

  private fun uriToPath(uri: String): String {
    if (uri.startsWith("file://")) {
      return Uri.parse(uri).path ?: throw Error("Invalid file URI: $uri")
    }

    return uri
  }

  private fun applyExifOrientation(bitmap: Bitmap, path: String): Bitmap {
    val orientation = try {
      ExifInterface(path).getAttributeInt(
        ExifInterface.TAG_ORIENTATION,
        ExifInterface.ORIENTATION_NORMAL,
      )
    } catch (_: Throwable) {
      ExifInterface.ORIENTATION_NORMAL
    }

    val matrix = Matrix()
    when (orientation) {
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.preScale(-1f, 1f)
      ExifInterface.ORIENTATION_ROTATE_180 -> matrix.preRotate(180f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.preScale(1f, -1f)
      ExifInterface.ORIENTATION_TRANSPOSE -> {
        matrix.preRotate(90f)
        matrix.preScale(-1f, 1f)
      }
      ExifInterface.ORIENTATION_ROTATE_90 -> matrix.preRotate(90f)
      ExifInterface.ORIENTATION_TRANSVERSE -> {
        matrix.preRotate(270f)
        matrix.preScale(-1f, 1f)
      }
      ExifInterface.ORIENTATION_ROTATE_270 -> matrix.preRotate(270f)
      else -> return bitmap
    }

    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
  }

  private fun scaleToMaxLongEdge(bitmap: Bitmap, maxLongEdge: Int): Bitmap {
    val longEdge = max(bitmap.width, bitmap.height)
    if (longEdge <= maxLongEdge) return bitmap

    val scale = maxLongEdge.toDouble() / longEdge.toDouble()
    val targetWidth = max(1, (bitmap.width * scale).roundToInt())
    val targetHeight = max(1, (bitmap.height * scale).roundToInt())

    return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
  }

  private fun resizeFlowChannel(
    flow: FloatArray,
    channelOffset: Int,
    targetWidth: Int,
    targetHeight: Int,
  ): FloatArray {
    val output = FloatArray(targetWidth * targetHeight)
    val scaleX = if (targetWidth > 1) (ModelSize - 1).toFloat() / (targetWidth - 1).toFloat() else 0f
    val scaleY = if (targetHeight > 1) (ModelSize - 1).toFloat() / (targetHeight - 1).toFloat() else 0f

    for (y in 0 until targetHeight) {
      val sourceY = y * scaleY
      val y0 = floor(sourceY).toInt().coerceIn(0, ModelSize - 1)
      val y1 = ceil(sourceY).toInt().coerceIn(0, ModelSize - 1)
      val dy = sourceY - y0
      for (x in 0 until targetWidth) {
        val sourceX = x * scaleX
        val x0 = floor(sourceX).toInt().coerceIn(0, ModelSize - 1)
        val x1 = ceil(sourceX).toInt().coerceIn(0, ModelSize - 1)
        val dx = sourceX - x0
        val top = lerp(
          flow[channelOffset + (y0 * ModelSize) + x0],
          flow[channelOffset + (y0 * ModelSize) + x1],
          dx,
        )
        val bottom = lerp(
          flow[channelOffset + (y1 * ModelSize) + x0],
          flow[channelOffset + (y1 * ModelSize) + x1],
          dx,
        )
        output[(y * targetWidth) + x] = lerp(top, bottom, dy)
      }
    }

    return output
  }

  private fun boxBlur(input: FloatArray, width: Int, height: Int): FloatArray {
    val output = FloatArray(input.size)

    for (y in 0 until height) {
      for (x in 0 until width) {
        var sum = 0f
        var count = 0
        for (dy in -1..1) {
          val sampleY = (y + dy).coerceIn(0, height - 1)
          val rowOffset = sampleY * width
          for (dx in -1..1) {
            val sampleX = (x + dx).coerceIn(0, width - 1)
            sum += input[rowOffset + sampleX]
            count += 1
          }
        }
        output[(y * width) + x] = sum / count
      }
    }

    return output
  }

  private fun sampleBilinear(
    pixels: IntArray,
    width: Int,
    height: Int,
    x: Float,
    y: Float,
  ): Int {
    val clampedX = x.coerceIn(0f, (width - 1).toFloat())
    val clampedY = y.coerceIn(0f, (height - 1).toFloat())
    val x0 = floor(clampedX).toInt()
    val y0 = floor(clampedY).toInt()
    val x1 = min(x0 + 1, width - 1)
    val y1 = min(y0 + 1, height - 1)
    val dx = clampedX - x0
    val dy = clampedY - y0
    val p00 = pixels[(y0 * width) + x0]
    val p10 = pixels[(y0 * width) + x1]
    val p01 = pixels[(y1 * width) + x0]
    val p11 = pixels[(y1 * width) + x1]
    val alpha = bilinearChannel(p00 ushr 24, p10 ushr 24, p01 ushr 24, p11 ushr 24, dx, dy)
    val red = bilinearChannel(p00 ushr 16, p10 ushr 16, p01 ushr 16, p11 ushr 16, dx, dy)
    val green = bilinearChannel(p00 ushr 8, p10 ushr 8, p01 ushr 8, p11 ushr 8, dx, dy)
    val blue = bilinearChannel(p00, p10, p01, p11, dx, dy)

    return ((alpha and 0xff) shl 24) or
      ((red and 0xff) shl 16) or
      ((green and 0xff) shl 8) or
      (blue and 0xff)
  }

  private fun bilinearChannel(
    p00: Int,
    p10: Int,
    p01: Int,
    p11: Int,
    dx: Float,
    dy: Float,
  ): Int {
    val top = lerp((p00 and 0xff).toFloat(), (p10 and 0xff).toFloat(), dx)
    val bottom = lerp((p01 and 0xff).toFloat(), (p11 and 0xff).toFloat(), dx)
    return lerp(top, bottom, dy).roundToInt().coerceIn(0, 255)
  }

  private fun lerp(a: Float, b: Float, t: Float): Float {
    return a + ((b - a) * t)
  }

  private fun saveJpeg(bitmap: Bitmap, outputUri: String) {
    val outputPath = uriToPath(outputUri)
    val outputFile = File(outputPath)
    outputFile.parentFile?.mkdirs()

    FileOutputStream(outputFile).use { stream ->
      val didCompress = bitmap.compress(Bitmap.CompressFormat.JPEG, JpegQuality, stream)
      if (!didCompress) {
        throw Error("Unable to save rectified JPEG: $outputUri")
      }
    }
  }

  private companion object {
    const val ModelSize = 288
    const val BytesPerFloat = 4
    const val JpegQuality = 95
    const val MinProcessingLongEdge = 960
    const val AbsoluteMaxProcessingLongEdge = 2400
    const val ModelPlaneLength = ModelSize * ModelSize
    const val TensorLength = ModelPlaneLength * 3
    const val FlowLength = ModelPlaneLength * 2
  }
}
