package com.pds.compose.internal

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.unit.Dp
import com.pds.compose.theme.toEasing
import com.pds.tokens.DsTransition

/**
 * Internal busy indicator: a ring with flat ends and a gap in one quarter (a 270° arc), drawn
 * inside its box, turning once per `motion.spinner`. With system animations removed (Android's
 * reduce-motion setting) the ring is drawn but does not turn (ADR 0018 decision 6). Decorative:
 * the owning control exposes the busy state.
 *
 * Not CircularProgressIndicator: that is Material (not a dependency) and its geometry and timing
 * are its own, not the contract's.
 */
@Composable
internal fun DsSpinner(
    size: Dp,
    color: Color,
    strokeWidth: Dp,
    rotation: DsTransition,
    modifier: Modifier = Modifier,
) {
    val still = rememberAnimationsDisabled() || rotation.durationMillis <= 0
    val angle = if (still) {
        0f
    } else {
        val transition = rememberInfiniteTransition(label = "DsSpinner")
        val turn by transition.animateFloat(
            initialValue = 0f,
            targetValue = 360f,
            animationSpec = infiniteRepeatable(
                tween(rotation.durationMillis, easing = rotation.easing.toEasing()),
                RepeatMode.Restart,
            ),
            label = "DsSpinnerTurn",
        )
        turn
    }
    Canvas(modifier.size(size)) {
        val stroke = strokeWidth.toPx()
        val inset = stroke / 2
        rotate(angle) {
            drawArc(
                color = color,
                startAngle = -90f,
                sweepAngle = 270f,
                useCenter = false,
                topLeft = Offset(inset, inset),
                size = Size(this.size.width - stroke, this.size.height - stroke),
                style = Stroke(width = stroke, cap = StrokeCap.Butt),
            )
        }
    }
}
