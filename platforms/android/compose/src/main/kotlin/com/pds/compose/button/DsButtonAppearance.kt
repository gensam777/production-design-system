package com.pds.compose.button

import com.pds.tokens.DsColorValue
import com.pds.tokens.DsTextStyle
import com.pds.tokens.DsTheme
import com.pds.tokens.DsTransition

/**
 * The behavioral state of a button from its inputs — contract `states.precedence`
 * (disabled > loading > default), then the platform-owned pressed / hover visuals.
 */
internal data class DsButtonState(
    val enabled: Boolean,
    val loading: Boolean,
    val pressed: Boolean = false,
    val hovered: Boolean = false,
) {
    /** Loading applies only while enabled: disabled wins (label shown, no spinner, not busy). */
    val showsLoading: Boolean get() = enabled && loading

    /** Whether onClick runs when the button is activated. */
    val canActivate: Boolean get() = enabled && !loading

    /** The container token cell. Loading uses Default and never shows pressed / hover. */
    val visualState: DsButtonVisualState
        get() = when {
            !enabled -> DsButtonVisualState.Disabled
            loading -> DsButtonVisualState.Default
            pressed -> DsButtonVisualState.Pressed
            hovered -> DsButtonVisualState.Hover
            else -> DsButtonVisualState.Default
        }
}

/** Unscaled size metrics in dp (sp for icon / spinner sizes, which scale with the font). */
internal data class DsButtonMetrics(
    val minHeight: Float,
    val paddingBlock: Float,
    val paddingInline: Float,
    val paddingInlineIconSide: Float,
    val gap: Float,
    val iconSize: Float,
    val spinnerSize: Float,
    val radius: Float,
    val typography: DsTextStyle,
    val stateTransition: DsTransition,
    val spinnerRotation: DsTransition,
) {
    /** Start / end inner spacing: an icon on that side reduces it one inset step. */
    fun paddingStart(hasIcon: Boolean) = if (hasIcon) paddingInlineIconSide else paddingInline
    fun paddingEnd(hasIcon: Boolean) = if (hasIcon) paddingInlineIconSide else paddingInline

    companion object {
        fun resolve(theme: DsTheme, size: DsButtonSize): DsButtonMetrics {
            val t = DsButtonTokens
            return DsButtonMetrics(
                minHeight = DsButtonConstants.visualHeight.getValue(size),
                paddingBlock = t.paddingBlock.getValue(size).resolve(theme),
                paddingInline = t.paddingInline.getValue(size).resolve(theme),
                paddingInlineIconSide = t.paddingInlineIconSide.getValue(size).resolve(theme),
                gap = t.gap.getValue(size).resolve(theme),
                iconSize = t.leadingIconSize.getValue(size).resolve(theme),
                spinnerSize = t.spinnerSize.getValue(size).resolve(theme),
                radius = t.radius.resolve(theme),
                typography = t.labelTypography.getValue(size).resolve(theme),
                stateTransition = t.stateTransition.resolve(theme),
                spinnerRotation = t.spinnerRotation.resolve(theme),
            )
        }
    }
}

/** Everything a button paints for one variant × size × state, resolved from the theme. */
internal data class DsButtonAppearance(
    /** `null` = no fill (contract `none`). */
    val background: DsColorValue?,
    /** `null` = the reserved 1dp border stays clear. */
    val border: DsColorValue?,
    /** Label and icon color. */
    val foreground: DsColorValue,
    val spinner: DsColorValue,
    val showsSpinner: Boolean,
    val metrics: DsButtonMetrics,
) {
    companion object {
        fun resolve(
            theme: DsTheme,
            variant: DsButtonVariant,
            size: DsButtonSize,
            state: DsButtonState,
        ): DsButtonAppearance {
            val t = DsButtonTokens
            val cell = state.visualState
            val label = t.labelColor.getValue(variant)
            return DsButtonAppearance(
                background = t.background.getValue(variant)[cell]?.resolve(theme),
                border = t.borderColor[variant]?.resolve(theme),
                foreground = (if (cell == DsButtonVisualState.Disabled) label.second else label.first).resolve(theme),
                spinner = t.spinnerColor.getValue(variant).resolve(theme),
                showsSpinner = state.showsLoading,
                metrics = DsButtonMetrics.resolve(theme, size),
            )
        }
    }
}
