package com.pds.compose.button

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pds.compose.R
import com.pds.compose.icons.DsIconName
import com.pds.compose.internal.DsIcon
import com.pds.compose.internal.DsSpinner
import com.pds.compose.theme.PdsTheme
import com.pds.compose.theme.toColor
import com.pds.compose.theme.toTextStyle
import com.pds.compose.theme.toTween

/** Test tags of Button's parts (decorative parts are not in the accessibility tree). */
object DsButtonTestTags {
    const val SPINNER = "DsButton.spinner"
    const val LEADING_ICON = "DsButton.leadingIcon"
    const val TRAILING_ICON = "DsButton.trailingIcon"
}

/**
 * Production Button — the Compose implementation of
 * design/contracts/components/button.contract.yaml (ADR 0018).
 *
 * ```
 * DsButton("Save changes", onClick = ::save, leadingIcon = DsIconName.Check, loading = saving)
 * DsButton("Delete", onClick = ::delete, variant = DsButtonVariant.Danger, enabled = canDelete)
 * ```
 *
 * - Brand comes from the nearest [PdsTheme]; the button never knows which brand.
 * - `enabled = false`: [onClick] never runs and TalkBack reports "disabled". Disabled wins over
 *   [loading] — label shown, no spinner, not busy.
 * - [loading]: only the spinner shows (size unchanged), variant colors are kept, [onClick] is
 *   blocked, the button stays enabled and focusable, and TalkBack reads its state as "Loading"
 *   (string resource `pds_button_loading` — override it in the app to localize). The name stays
 *   the label.
 * - The label follows the system font size and wraps instead of clipping; 32 / 40 / 48dp are
 *   minimum heights. Icons and the spinner scale with the font.
 * - Touch target: at least 48dp through Compose's built-in touch-target expansion, without
 *   changing the visual size or layout.
 *
 * @param text Short, verb-first action text. Also the accessible name.
 * @param onClick Runs on activation (touch, mouse, keyboard / D-pad, switch access, TalkBack).
 * @param modifier Layout placement only — size, padding, background and shape come from tokens.
 * @param variant Visual emphasis.
 * @param size Visual size.
 * @param enabled `false` = the contract's `disabled`.
 * @param loading The action was triggered and its result is pending.
 * @param leadingIcon Decorative catalog icon before the label.
 * @param trailingIcon Decorative catalog icon after the label.
 * @param interactionSource Hoist to observe or emit interactions; one is created when null.
 */
@Composable
fun DsButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: DsButtonVariant = DsButtonVariant.Primary,
    size: DsButtonSize = DsButtonSize.Md,
    enabled: Boolean = true,
    loading: Boolean = false,
    leadingIcon: DsIconName? = null,
    trailingIcon: DsIconName? = null,
    interactionSource: MutableInteractionSource? = null,
) {
    val theme = PdsTheme.tokens
    val interactions = interactionSource ?: remember { MutableInteractionSource() }
    val pressed by interactions.collectIsPressedAsState()
    val hovered by interactions.collectIsHoveredAsState()
    val focused by interactions.collectIsFocusedAsState()

    val state = DsButtonState(enabled = enabled, loading = loading, pressed = pressed, hovered = hovered)
    val look = DsButtonAppearance.resolve(theme, variant, size, state)
    val m = look.metrics

    // `none` animates to / from the variant's own color at zero alpha, so a ghost button fades
    // in its hover fill instead of passing through transparent black.
    val clearOf = { cells: List<com.pds.tokens.DsColorValue?> ->
        cells.firstNotNullOfOrNull { it }?.toColor()?.copy(alpha = 0f) ?: Color.Transparent
    }
    val backgroundCells = DsButtonVisualState.entries.map {
        DsButtonTokens.background.getValue(variant)[it]?.resolve(theme)
    }
    val background by animateColorAsState(
        targetValue = look.background?.toColor() ?: clearOf(backgroundCells),
        animationSpec = m.stateTransition.toTween(),
        label = "DsButtonBackground",
    )
    val border = look.border?.toColor() ?: Color.Transparent

    val shape = RoundedCornerShape(m.radius.dp)
    val foreground = look.foreground.toColor()
    val density = LocalDensity.current
    // Icons and spinner are sized in sp so they grow with the label under font scaling.
    val iconSize = with(density) { m.iconSize.sp.toDp() }
    val spinnerSize = with(density) { m.spinnerSize.sp.toDp() }
    val loadingDescription = stringResource(R.string.pds_button_loading)
    val ring = DsButtonTokens.focusRing.resolve(theme).toColor()
    val ringOffset = DsButtonTokens.focusRingOffset.resolve(theme).toColor()
    val borderWidth = DsButtonConstants.BORDER_WIDTH

    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .semantics { if (look.showsSpinner) stateDescription = loadingDescription }
            // Keyboard / D-pad focus only: in touch mode a click never focuses the button.
            .drawBehind { if (focused) drawFocusIndicator(m.radius, ring, ringOffset) }
            .background(background, shape)
            .border(borderWidth.dp, border, shape)
            .hoverable(interactions, enabled = enabled)
            .clickable(
                interactionSource = interactions,
                // The contract's pressed cells are the press feedback; no ripple.
                indication = null,
                enabled = enabled,
                role = Role.Button,
                // Loading is not disabled (it stays focusable and isn't reported as disabled),
                // so activation is blocked here. Disabled is blocked by `enabled`.
                onClick = { if (state.canActivate) onClick() },
            )
            // A floor, not a fixed height: font scaling grows the button past it.
            .heightIn(min = m.minHeight.dp)
            // Inner spacing sits inside the 1dp border every variant reserves.
            .padding(
                PaddingValues(
                    start = (m.paddingStart(leadingIcon != null) + borderWidth).dp,
                    end = (m.paddingEnd(trailingIcon != null) + borderWidth).dp,
                    top = (m.paddingBlock + borderWidth).dp,
                    bottom = (m.paddingBlock + borderWidth).dp,
                ),
            ),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(m.gap.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
            // Loading hides the content but keeps its space, so the size doesn't change.
            modifier = Modifier.alpha(if (look.showsSpinner) 0f else 1f),
        ) {
            if (leadingIcon != null) {
                DsIcon(leadingIcon, iconSize, foreground, Modifier.testTag(DsButtonTestTags.LEADING_ICON))
            }
            BasicText(
                text = text,
                style = m.typography.toTextStyle(color = foreground, textAlign = TextAlign.Center),
                // Shrinks within a constrained width and wraps rather than clipping.
                modifier = Modifier.weight(1f, fill = false),
            )
            if (trailingIcon != null) {
                DsIcon(trailingIcon, iconSize, foreground, Modifier.testTag(DsButtonTestTags.TRAILING_ICON))
            }
        }
        if (look.showsSpinner) {
            DsSpinner(
                size = spinnerSize,
                color = look.spinner.toColor(),
                strokeWidth = DsButtonConstants.SPINNER_STROKE_WIDTH.dp,
                rotation = m.spinnerRotation,
                modifier = Modifier.testTag(DsButtonTestTags.SPINNER),
            )
        }
    }
}

/**
 * The contract's focus indicator outside the container (component-constants
 * focus-indicator-geometry): a ring-offset band, then the ring. The border stays.
 */
private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawFocusIndicator(
    radius: Float,
    ring: Color,
    ringOffset: Color,
) {
    val offsetWidth = DsButtonConstants.FOCUS_OFFSET_WIDTH.dp.toPx()
    val ringWidth = DsButtonConstants.FOCUS_RING_WIDTH.dp.toPx()
    val r = radius.dp.toPx()
    fun band(outset: Float, width: Float, color: Color) {
        val center = outset + width / 2
        drawRoundRect(
            color = color,
            topLeft = Offset(-center, -center),
            size = Size(size.width + 2 * center, size.height + 2 * center),
            cornerRadius = CornerRadius(r + center),
            style = Stroke(width),
        )
    }
    band(0f, offsetWidth, ringOffset)
    band(offsetWidth, ringWidth, ring)
}
