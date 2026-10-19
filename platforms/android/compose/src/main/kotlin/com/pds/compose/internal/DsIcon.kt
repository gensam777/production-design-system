package com.pds.compose.internal

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.unit.Dp
import com.pds.compose.icons.DsIconName
import com.pds.compose.icons.lucideVector

/**
 * Internal, decorative icon: Lucide artwork tinted [color] at [size]. The stroke scales with the
 * size, as on web (ADR 0019 rule 4: 2 at 24 → 1.33 at 16). No content description — the owning
 * control provides the accessible name.
 */
@Composable
internal fun DsIcon(name: DsIconName, size: Dp, color: Color, modifier: Modifier = Modifier) {
    Image(
        painter = rememberVectorPainter(name.lucideVector),
        contentDescription = null,
        colorFilter = ColorFilter.tint(color),
        modifier = modifier.size(size),
    )
}
