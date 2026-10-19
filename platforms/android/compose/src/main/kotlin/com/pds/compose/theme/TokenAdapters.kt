package com.pds.compose.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.TweenSpec
import androidx.compose.animation.core.tween
import androidx.compose.ui.graphics.Color
import com.pds.tokens.DsColorValue
import com.pds.tokens.DsCubicBezier
import com.pds.tokens.DsTransition

// Compose adapters for the generated token value types (packages/tokens/scripts/emit-kotlin.mjs).

/** A token color (0xAARRGGBB). */
fun DsColorValue.toColor(): Color = Color(argb)

fun DsCubicBezier.toEasing(): CubicBezierEasing = CubicBezierEasing(x1, y1, x2, y2)

/**
 * A transition token as an animation spec. Android's animator duration scale ("Remove
 * animations" / developer options) applies to it like any Compose animation.
 */
fun <T> DsTransition.toTween(): TweenSpec<T> = tween(durationMillis, delayMillis, easing.toEasing())
