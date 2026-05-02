package com.mp3editor.app.util

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import androidx.core.content.ContextCompat
import com.mp3editor.app.R
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

class WaveformView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyle: Int = 0
) : View(context, attrs, defStyle) {

    private val barPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.waveform_color)
        style = Paint.Style.FILL
    }
    private val playedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.waveform_played_color)
        style = Paint.Style.FILL
    }

    private var amplitudes: FloatArray = FloatArray(0)
    private var progress: Float = 0f
    private val barRect = RectF()
    private val barWidth = 3f
    private val barGap = 2f
    private val cornerRadius = 2f

    fun setAmplitudes(data: FloatArray) {
        amplitudes = data
        invalidate()
    }

    fun setProgress(p: Float) {
        progress = p.coerceIn(0f, 1f)
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (amplitudes.isEmpty()) {
            drawPlaceholder(canvas)
            return
        }

        val viewWidth = width.toFloat()
        val viewHeight = height.toFloat()
        val centerY = viewHeight / 2f
        val maxBarHeight = centerY * 0.9f
        val barStep = barWidth + barGap
        val barCount = min(amplitudes.size, (viewWidth / barStep).toInt())
        val progressX = viewWidth * progress

        for (i in 0 until barCount) {
            val x = i * barStep
            val ampIndex = (i.toFloat() / barCount * amplitudes.size).toInt().coerceIn(0, amplitudes.size - 1)
            val barHeight = max(4f, amplitudes[ampIndex] * maxBarHeight)

            barRect.set(x, centerY - barHeight, x + barWidth, centerY + barHeight)
            val paint = if (x < progressX) playedPaint else barPaint
            canvas.drawRoundRect(barRect, cornerRadius, cornerRadius, paint)
        }
    }

    private fun drawPlaceholder(canvas: Canvas) {
        val viewWidth = width.toFloat()
        val viewHeight = height.toFloat()
        val centerY = viewHeight / 2f
        val barStep = barWidth + barGap
        val barCount = (viewWidth / barStep).toInt()
        val progressX = viewWidth * progress

        for (i in 0 until barCount) {
            val x = i * barStep
            val barHeight = maxOf(4f, (4 + abs(i % 10 - 5)) * 4f)
            barRect.set(x, centerY - barHeight, x + barWidth, centerY + barHeight)
            val paint = if (x < progressX) playedPaint else barPaint
            canvas.drawRoundRect(barRect, cornerRadius, cornerRadius, paint)
        }
    }
}
