package com.mp3editor.app.util

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import androidx.core.content.ContextCompat
import com.mp3editor.app.R
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

class TrimmerView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyle: Int = 0
) : View(context, attrs, defStyle) {

    interface TrimListener {
        fun onTrimChanged(startFraction: Float, endFraction: Float)
    }

    private val waveformPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.waveform_color)
        style = Paint.Style.FILL
        alpha = 120
    }
    private val selectedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.trim_selected_color)
        style = Paint.Style.FILL
    }
    private val handlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.trim_handle_color)
        style = Paint.Style.FILL
    }
    private val handleLinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = ContextCompat.getColor(context, R.color.trim_handle_color)
        style = Paint.Style.STROKE
        strokeWidth = 3f
    }
    private val playheadPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0xFFFF5252.toInt()
        style = Paint.Style.STROKE
        strokeWidth = 2f
    }

    private var startFraction = 0f
    private var endFraction = 1f
    private var playheadFraction = 0f
    private var amplitudes: FloatArray = FloatArray(0)
    private var dragTarget: DragTarget? = null
    private val handleWidth = 24f
    private val barRect = RectF()
    private val touchSlop = 40f

    var listener: TrimListener? = null

    enum class DragTarget { START, END, MIDDLE }

    fun setAmplitudes(data: FloatArray) {
        amplitudes = data
        invalidate()
    }

    fun setTrimPoints(start: Float, end: Float) {
        startFraction = start.coerceIn(0f, 1f)
        endFraction = end.coerceIn(0f, 1f)
        invalidate()
    }

    fun setPlayhead(fraction: Float) {
        playheadFraction = fraction.coerceIn(0f, 1f)
        invalidate()
    }

    fun getStartFraction() = startFraction
    fun getEndFraction() = endFraction

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        val centerY = h / 2f
        val barStep = 5f
        val barWidth = 3f
        val maxBarHeight = centerY * 0.8f

        // Draw waveform bars
        val barCount = (w / barStep).toInt()
        for (i in 0 until barCount) {
            val x = i * barStep
            val ampIdx = if (amplitudes.isNotEmpty())
                (i.toFloat() / barCount * amplitudes.size).toInt().coerceIn(0, amplitudes.size - 1)
            else -1
            val barH = if (ampIdx >= 0) max(3f, amplitudes[ampIdx] * maxBarHeight)
            else max(3f, (4 + abs(i % 8 - 4)) * 5f)

            barRect.set(x, centerY - barH, x + barWidth, centerY + barH)
            canvas.drawRoundRect(barRect, 2f, 2f, waveformPaint)
        }

        val startX = startFraction * w
        val endX = endFraction * w

        // Selected region overlay
        canvas.drawRect(startX, 0f, endX, h, selectedPaint)

        // Start handle
        canvas.drawRect(startX, 0f, startX + handleWidth, h, handlePaint)
        canvas.drawLine(startX + handleWidth / 2f, h * 0.2f, startX + handleWidth / 2f, h * 0.8f, Paint().apply {
            color = 0xFFFFFFFF.toInt()
            style = Paint.Style.STROKE
            strokeWidth = 3f
            isAntiAlias = true
        })

        // End handle
        canvas.drawRect(endX - handleWidth, 0f, endX, h, handlePaint)
        canvas.drawLine(endX - handleWidth / 2f, h * 0.2f, endX - handleWidth / 2f, h * 0.8f, Paint().apply {
            color = 0xFFFFFFFF.toInt()
            style = Paint.Style.STROKE
            strokeWidth = 3f
            isAntiAlias = true
        })

        // Top/bottom borders
        canvas.drawLine(startX, 0f, endX, 0f, handleLinePaint)
        canvas.drawLine(startX, h, endX, h, handleLinePaint)

        // Playhead
        val playX = playheadFraction * w
        canvas.drawLine(playX, 0f, playX, h, playheadPaint)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val w = width.toFloat()
        val x = event.x.coerceIn(0f, w)
        val fraction = x / w

        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                val startX = startFraction * w
                val endX = endFraction * w
                dragTarget = when {
                    abs(x - startX) < touchSlop -> DragTarget.START
                    abs(x - endX) < touchSlop -> DragTarget.END
                    x in startX..endX -> DragTarget.MIDDLE
                    else -> null
                }
                return dragTarget != null
            }
            MotionEvent.ACTION_MOVE -> {
                val dx = event.x / w
                when (dragTarget) {
                    DragTarget.START -> {
                        startFraction = dx.coerceIn(0f, endFraction - 0.05f)
                    }
                    DragTarget.END -> {
                        endFraction = dx.coerceIn(startFraction + 0.05f, 1f)
                    }
                    DragTarget.MIDDLE -> {
                        val range = endFraction - startFraction
                        val newStart = (fraction - range / 2f).coerceIn(0f, 1f - range)
                        startFraction = newStart
                        endFraction = newStart + range
                    }
                    null -> {}
                }
                listener?.onTrimChanged(startFraction, endFraction)
                invalidate()
                return true
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                dragTarget = null
                return true
            }
        }
        return super.onTouchEvent(event)
    }
}
