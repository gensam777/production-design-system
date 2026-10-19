package com.pds.compose.button

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.pds.compose.icons.DsIconName
import com.pds.compose.theme.PdsTheme
import com.pds.compose.theme.toColor
import com.pds.compose.theme.toTextStyle
import com.pds.tokens.BrandA
import com.pds.tokens.BrandB
import com.pds.tokens.DsTheme
import kotlinx.coroutines.delay

// Visual review surface for DsButton — open platforms/android in Android Studio, open this file
// and use the Split / Design view. Each @Preview is one brand / font-scale configuration; use
// Interactive mode to press buttons. Brand fonts aren't bundled (ADR 0016), so text uses the
// default family at the role's weight unless the app ships res/font/inter_medium etc.

private val variants = DsButtonVariant.entries
private val sizes = DsButtonSize.entries
private fun Enum<*>.title() = name.replaceFirstChar { it.uppercase() }

@Composable
private fun Section(title: String, note: String? = null, content: @Composable () -> Unit) {
    val t = PdsTheme.tokens
    Column(verticalArrangement = Arrangement.spacedBy(t.space.stack.sm.dp)) {
        BasicText(
            title,
            style = t.typography.heading.sm.semibold.toTextStyle(t.color.text.primary.toColor()),
            modifier = Modifier.semantics { heading() },
        )
        if (note != null) {
            BasicText(note, style = t.typography.body.sm.regular.toTextStyle(t.color.text.secondary.toColor()))
        }
        content()
    }
}

@Composable
private fun Row(content: @Composable () -> Unit) {
    val t = PdsTheme.tokens
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(t.space.inline.sm.dp),
        verticalArrangement = Arrangement.spacedBy(t.space.stack.sm.dp),
    ) { content() }
}

/** Pressing starts a two-second pending action: the button shows loading and ignores presses. */
@Composable
private fun PendingActionDemo(variant: DsButtonVariant) {
    var pending by remember { mutableStateOf(false) }
    var count by remember { mutableIntStateOf(0) }
    LaunchedEffect(pending) {
        if (pending) {
            delay(2_000)
            pending = false
        }
    }
    DsButton(
        text = if (count == 0) "Submit" else "Submitted $count×",
        onClick = { count++; pending = true },
        variant = variant,
        trailingIcon = DsIconName.ArrowRight,
        loading = pending,
    )
}

@Composable
internal fun DsButtonGallery(theme: DsTheme, brandName: String) {
    PdsTheme(theme) {
        val t = PdsTheme.tokens
        Column(
            verticalArrangement = Arrangement.spacedBy(t.space.stack.xl.dp),
            modifier = Modifier
                .background(t.color.surface.canvas.toColor())
                .verticalScroll(rememberScrollState())
                .fillMaxWidth()
                .padding(t.space.inset.lg.dp),
        ) {
            BasicText(
                brandName,
                style = t.typography.heading.md.bold.toTextStyle(t.color.text.primary.toColor()),
                modifier = Modifier.semantics { heading() },
            )
            Section("Variants", "Default size (md).") {
                Row { variants.forEach { DsButton(it.title(), onClick = {}, variant = it) } }
            }
            Section("Sizes", "Minimum heights 32 / 40 / 48dp; touch targets ≥ 48dp.") {
                variants.forEach { v ->
                    Row { sizes.forEach { s -> DsButton("${v.title()} ${s.name.lowercase()}", onClick = {}, variant = v, size = s) } }
                }
            }
            Section("Icons", "Leading, trailing and both.") {
                sizes.forEach { s ->
                    Row {
                        DsButton("Add item", onClick = {}, size = s, leadingIcon = DsIconName.Plus)
                        DsButton("Continue", onClick = {}, variant = DsButtonVariant.Secondary, size = s, trailingIcon = DsIconName.ArrowRight)
                        DsButton(
                            "Edit", onClick = {}, variant = DsButtonVariant.Tertiary, size = s,
                            leadingIcon = DsIconName.Edit, trailingIcon = DsIconName.ChevronDown,
                        )
                        DsButton("Delete", onClick = {}, variant = DsButtonVariant.Danger, size = s, leadingIcon = DsIconName.Trash)
                    }
                }
            }
            Section("Loading", "Busy, not disabled: variant colors kept, size preserved, presses ignored.") {
                Row { variants.forEach { DsButton(it.title(), onClick = {}, variant = it, leadingIcon = DsIconName.Check, loading = true) } }
                Row { sizes.forEach { DsButton("Loading ${it.name.lowercase()}", onClick = {}, size = it, loading = true) } }
                Row {
                    PendingActionDemo(DsButtonVariant.Primary)
                    PendingActionDemo(DsButtonVariant.Secondary)
                }
            }
            Section("Disabled") {
                Row { variants.forEach { DsButton(it.title(), onClick = {}, variant = it, enabled = false, leadingIcon = DsIconName.Plus) } }
            }
            Section("Disabled + loading", "Disabled wins: label visible, no spinner, not busy.") {
                Row { variants.forEach { DsButton(it.title(), onClick = {}, variant = it, enabled = false, loading = true) } }
            }
            Section("Long and wrapping labels", "Labels wrap and the button grows; nothing clips.") {
                Column(
                    verticalArrangement = Arrangement.spacedBy(t.space.stack.sm.dp),
                    modifier = Modifier.widthIn(max = 220.dp),
                ) {
                    DsButton(
                        "Confirm and continue to the payment details step", onClick = {},
                        leadingIcon = DsIconName.Check, trailingIcon = DsIconName.ArrowRight,
                    )
                    DsButton(
                        "A small secondary action whose label is long enough to wrap", onClick = {},
                        variant = DsButtonVariant.Secondary, size = DsButtonSize.Sm,
                    )
                }
                DsButton(
                    "Full-width tertiary action laid out by its parent", onClick = {},
                    variant = DsButtonVariant.Tertiary, size = DsButtonSize.Lg,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Preview(name = "Brand A", widthDp = 393, heightDp = 2400)
@Composable
private fun DsButtonBrandAPreview() = DsButtonGallery(BrandA, "Brand A")

@Preview(name = "Brand B", widthDp = 393, heightDp = 2400)
@Composable
private fun DsButtonBrandBPreview() = DsButtonGallery(BrandB, "Brand B")

@Preview(name = "Font scale 1.5", widthDp = 393, heightDp = 3000, fontScale = 1.5f)
@Composable
private fun DsButtonFontScale150Preview() = DsButtonGallery(BrandA, "Brand A · font 150%")

@Preview(name = "Font scale 2.0", widthDp = 393, heightDp = 3600, fontScale = 2f)
@Composable
private fun DsButtonFontScale200Preview() = DsButtonGallery(BrandB, "Brand B · font 200%")

@Preview(name = "Font scale 0.85", widthDp = 393, heightDp = 2400, fontScale = 0.85f)
@Composable
private fun DsButtonFontScale85Preview() = DsButtonGallery(BrandA, "Brand A · font 85%")
