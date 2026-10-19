package com.pds.compose.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import com.pds.tokens.DsTheme
import com.pds.tokens.DsThemes

// The active brand theme travels through composition (ADR 0011 / multi-brand rule: components
// read semantic tokens only and never know which brand is active). Without PdsTheme a component
// gets the default brand — Compose's equivalent of web's "no data-brand attribute = Brand A".

private val defaultTheme: DsTheme = DsThemes.all.getValue(DsThemes.DEFAULT_BRAND)

/** The generated semantic token theme for the active brand (com.pds.tokens). */
val LocalDsTheme = staticCompositionLocalOf { defaultTheme }

/**
 * Provides a brand theme ([com.pds.tokens.BrandA], [com.pds.tokens.BrandB]) to the components
 * inside [content]. Nests: a subtree can use another brand (web's `data-brand` on a container).
 */
@Composable
fun PdsTheme(
    theme: DsTheme = defaultTheme,
    content: @Composable () -> Unit,
) {
    CompositionLocalProvider(LocalDsTheme provides theme, content = content)
}

object PdsTheme {
    /** The nearest [PdsTheme]'s tokens. */
    val tokens: DsTheme
        @Composable @ReadOnlyComposable
        get() = LocalDsTheme.current
}
