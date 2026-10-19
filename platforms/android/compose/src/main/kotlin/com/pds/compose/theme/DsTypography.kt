package com.pds.compose.theme

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.pds.tokens.DsTextStyle

/**
 * The brand face of [style] when the app ships it as a font resource named
 * `fontResourceName` (e.g. `res/font/inter_medium.ttf`), otherwise the default family at the
 * same weight — never another brand's family. PDS bundles no font files (ADR 0016), so the
 * lookup is by name at runtime.
 */
@SuppressLint("DiscouragedApi") // Runtime lookup by name is the point: the font lives in the app.
internal fun DsTextStyle.fontFamily(context: Context): FontFamily {
    val id = context.resources.getIdentifier(fontResourceName, "font", context.packageName)
    return if (id != 0) FontFamily(Font(id, FontWeight(fontWeight))) else FontFamily.Default
}

/**
 * A generated typography role as a Compose [TextStyle]: size in sp (scales with the system font
 * size, non-linearly on Android 14+), line height and letter spacing in em so they keep their
 * ratio under scaling.
 */
@Composable
fun DsTextStyle.toTextStyle(
    color: Color = Color.Unspecified,
    textAlign: TextAlign = TextAlign.Unspecified,
): TextStyle {
    val context = LocalContext.current
    val family = remember(this, context) { fontFamily(context) }
    return TextStyle(
        color = color,
        fontFamily = family,
        fontWeight = FontWeight(fontWeight),
        fontSize = fontSize.sp,
        lineHeight = lineHeight.em,
        letterSpacing = letterSpacing.em,
        textAlign = textAlign,
        lineHeightStyle = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None),
    )
}
