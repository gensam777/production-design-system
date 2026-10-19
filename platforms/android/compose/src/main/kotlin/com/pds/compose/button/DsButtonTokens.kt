package com.pds.compose.button

import com.pds.tokens.DsColorValue
import com.pds.tokens.DsCornerShape
import com.pds.tokens.DsTextStyle
import com.pds.tokens.DsTheme
import com.pds.tokens.DsTransition

/** Visual emphasis (contract `properties.variant`). */
enum class DsButtonVariant {
    /** The main action of a view or region. Use at most one per region. */
    Primary,

    /** An alternative or supporting action next to a primary one. */
    Secondary,

    /** A low-emphasis action; no fill until interacted with. */
    Tertiary,

    /** A destructive or irreversible action. */
    Danger,
}

/**
 * Visual size (contract `properties.size`): minimum height, inner spacing, label typography and
 * icon size.
 */
enum class DsButtonSize {
    /** Compact — dense toolbars and inline actions. Minimum height 32dp. */
    Sm,

    /** Default. Minimum height 40dp. */
    Md,

    /** Prominent — primary actions on spacious or touch-first layouts. Minimum height 48dp. */
    Lg,
}

/** The contract's name for an enum value (`Primary` → `primary`). */
internal val Enum<*>.contractValue: String get() = name.lowercase()

/**
 * Which token cell paints the container (contract `tokens.container.background` state keys).
 * Loading has no cells of its own and uses [Default] (contract `states.loading`).
 */
internal enum class DsButtonVisualState { Default, Hover, Pressed, Disabled }

/** A contract token path bound to the generated theme value it names. */
internal class DsTokenRef<T>(
    /** The contract path, e.g. `color.action.primary.on-color`. */
    val path: String,
    val resolve: (DsTheme) -> T,
)

private typealias ColorRef = DsTokenRef<DsColorValue>
private typealias Metric = DsTokenRef<Float>

/**
 * Button's token bindings — the contract's `tokens` section
 * (design/contracts/components/button.contract.yaml), cell for cell. `null` is the contract's
 * `none` (no paint). The tests compare [contractCells] with the YAML and resolve every binding in
 * Brand A and Brand B; `npm run contracts:validate` compares the path set.
 */
internal object DsButtonTokens {
    val background: Map<DsButtonVariant, Map<DsButtonVisualState, ColorRef?>> = mapOf(
        DsButtonVariant.Primary to mapOf(
            DsButtonVisualState.Default to ColorRef("color.action.primary.default") { it.color.action.primary.default },
            DsButtonVisualState.Hover to ColorRef("color.action.primary.hover") { it.color.action.primary.hover },
            DsButtonVisualState.Pressed to ColorRef("color.action.primary.active") { it.color.action.primary.active },
            DsButtonVisualState.Disabled to ColorRef("color.action.primary.disabled") { it.color.action.primary.disabled },
        ),
        DsButtonVariant.Secondary to mapOf(
            DsButtonVisualState.Default to ColorRef("color.action.secondary.default") { it.color.action.secondary.default },
            DsButtonVisualState.Hover to ColorRef("color.action.secondary.hover") { it.color.action.secondary.hover },
            DsButtonVisualState.Pressed to ColorRef("color.action.secondary.hover") { it.color.action.secondary.hover },
            DsButtonVisualState.Disabled to ColorRef("color.action.secondary.default") { it.color.action.secondary.default },
        ),
        DsButtonVariant.Tertiary to mapOf(
            DsButtonVisualState.Default to null,
            DsButtonVisualState.Hover to ColorRef("color.action.tertiary.hover") { it.color.action.tertiary.hover },
            DsButtonVisualState.Pressed to ColorRef("color.action.tertiary.hover") { it.color.action.tertiary.hover },
            DsButtonVisualState.Disabled to null,
        ),
        DsButtonVariant.Danger to mapOf(
            DsButtonVisualState.Default to ColorRef("color.action.danger.default") { it.color.action.danger.default },
            DsButtonVisualState.Hover to ColorRef("color.action.danger.hover") { it.color.action.danger.hover },
            DsButtonVisualState.Pressed to ColorRef("color.action.danger.hover") { it.color.action.danger.hover },
            DsButtonVisualState.Disabled to ColorRef("color.action.danger.disabled") { it.color.action.danger.disabled },
        ),
    )

    val borderColor: Map<DsButtonVariant, ColorRef?> = mapOf(
        DsButtonVariant.Primary to null,
        DsButtonVariant.Secondary to ColorRef("color.border.default") { it.color.border.default },
        DsButtonVariant.Tertiary to null,
        DsButtonVariant.Danger to null,
    )

    val radius = Metric("radius.control") { it.radius.control }

    val paddingBlock: Map<DsButtonSize, Metric> = mapOf(
        DsButtonSize.Sm to Metric("space.inset.xs") { it.space.inset.xs },
        DsButtonSize.Md to Metric("space.inset.sm") { it.space.inset.sm },
        DsButtonSize.Lg to Metric("space.inset.sm") { it.space.inset.sm },
    )

    val paddingInline: Map<DsButtonSize, Metric> = mapOf(
        DsButtonSize.Sm to Metric("space.inset.md") { it.space.inset.md },
        DsButtonSize.Md to Metric("space.inset.lg") { it.space.inset.lg },
        DsButtonSize.Lg to Metric("space.inset.xl") { it.space.inset.xl },
    )

    val paddingInlineIconSide: Map<DsButtonSize, Metric> = mapOf(
        DsButtonSize.Sm to Metric("space.inset.sm") { it.space.inset.sm },
        DsButtonSize.Md to Metric("space.inset.md") { it.space.inset.md },
        DsButtonSize.Lg to Metric("space.inset.lg") { it.space.inset.lg },
    )

    val gap: Map<DsButtonSize, Metric> = mapOf(
        DsButtonSize.Sm to Metric("space.inline.xs") { it.space.inline.xs },
        DsButtonSize.Md to Metric("space.inline.sm") { it.space.inline.sm },
        DsButtonSize.Lg to Metric("space.inline.sm") { it.space.inline.sm },
    )

    val stateTransition = DsTokenRef<DsTransition>("motion.micro") { it.motion.micro }

    /** Label cells exist for default and disabled; hover / pressed keep the default label. */
    val labelColor: Map<DsButtonVariant, Pair<ColorRef, ColorRef>> = mapOf(
        DsButtonVariant.Primary to (ColorRef("color.action.primary.on-color") { it.color.action.primary.onColor } to
            ColorRef("color.text.disabled") { it.color.text.disabled }),
        DsButtonVariant.Secondary to (ColorRef("color.text.primary") { it.color.text.primary } to
            ColorRef("color.text.disabled") { it.color.text.disabled }),
        DsButtonVariant.Tertiary to (ColorRef("color.text.primary") { it.color.text.primary } to
            ColorRef("color.text.disabled") { it.color.text.disabled }),
        DsButtonVariant.Danger to (ColorRef("color.action.danger.on-color") { it.color.action.danger.onColor } to
            ColorRef("color.text.disabled") { it.color.text.disabled }),
    )

    val labelTypography: Map<DsButtonSize, DsTokenRef<DsTextStyle>> = mapOf(
        DsButtonSize.Sm to DsTokenRef("text.label.sm.medium") { it.typography.label.sm.medium },
        DsButtonSize.Md to DsTokenRef("text.label.md.medium") { it.typography.label.md.medium },
        DsButtonSize.Lg to DsTokenRef("text.label.lg.medium") { it.typography.label.lg.medium },
    )

    val leadingIconSize: Map<DsButtonSize, Metric> = mapOf(
        DsButtonSize.Sm to Metric("icon.sm") { it.icon.sm },
        DsButtonSize.Md to Metric("icon.md") { it.icon.md },
        DsButtonSize.Lg to Metric("icon.lg") { it.icon.lg },
    )
    val trailingIconSize: Map<DsButtonSize, Metric> = leadingIconSize

    val spinnerColor: Map<DsButtonVariant, ColorRef> = mapOf(
        DsButtonVariant.Primary to ColorRef("color.action.primary.on-color") { it.color.action.primary.onColor },
        DsButtonVariant.Secondary to ColorRef("color.text.primary") { it.color.text.primary },
        DsButtonVariant.Tertiary to ColorRef("color.text.primary") { it.color.text.primary },
        DsButtonVariant.Danger to ColorRef("color.action.danger.on-color") { it.color.action.danger.onColor },
    )
    val spinnerSize: Map<DsButtonSize, Metric> = leadingIconSize
    val spinnerRadius = DsTokenRef<DsCornerShape>("radius.full") { it.radius.full }
    val spinnerRotation = DsTokenRef<DsTransition>("motion.spinner") { it.motion.spinner }

    val focusRing = ColorRef("color.focus.ring") { it.color.focus.ring }
    val focusRingOffset = ColorRef("color.focus.ring-offset") { it.color.focus.ringOffset }

    /**
     * The bindings flattened the way the contract YAML is (`part.property[.selector…]` → token
     * path, `none` for no paint), for the cell-by-cell parity test.
     */
    val contractCells: Map<String, String>
        get() = buildMap {
            for (variant in DsButtonVariant.entries) {
                val v = variant.contractValue
                for (state in DsButtonVisualState.entries)
                    put("container.background.$v.${state.contractValue}", background.getValue(variant)[state]?.path ?: "none")
                put("container.border-color.$v", borderColor[variant]?.path ?: "none")
                put("label.color.$v.default", labelColor.getValue(variant).first.path)
                put("label.color.$v.disabled", labelColor.getValue(variant).second.path)
                put("spinner.color.$v", spinnerColor.getValue(variant).path)
            }
            for (size in DsButtonSize.entries) {
                val s = size.contractValue
                put("container.padding-block.$s", paddingBlock.getValue(size).path)
                put("container.padding-inline.$s", paddingInline.getValue(size).path)
                put("container.padding-inline-icon-side.$s", paddingInlineIconSide.getValue(size).path)
                put("container.gap.$s", gap.getValue(size).path)
                put("label.typography.$s", labelTypography.getValue(size).path)
                put("leadingIcon.size.$s", leadingIconSize.getValue(size).path)
                put("trailingIcon.size.$s", trailingIconSize.getValue(size).path)
                put("spinner.size.$s", spinnerSize.getValue(size).path)
            }
            put("container.radius", radius.path)
            put("container.state-transition", stateTransition.path)
            put("spinner.radius", spinnerRadius.path)
            put("spinner.rotation", spinnerRotation.path)
            put("focusIndicator.color", focusRing.path)
            put("focusIndicator.offset-color", focusRingOffset.path)
        }
}

/** Contract `component-constants` and `sizing` — deliberately not tokens. dp. */
internal object DsButtonConstants {
    const val BORDER_WIDTH = 1f
    const val SPINNER_STROKE_WIDTH = 2f

    /** Minimum (not fixed) heights — the button grows with font scale. */
    val visualHeight: Map<DsButtonSize, Float> =
        mapOf(DsButtonSize.Sm to 32f, DsButtonSize.Md to 40f, DsButtonSize.Lg to 48f)

    /** Contract `sizing.hit-target.minimum.android`. */
    const val MINIMUM_HIT_TARGET = 48f

    /** Contract `component-constants.focus-indicator-geometry`. */
    const val FOCUS_OFFSET_WIDTH = 2f
    const val FOCUS_RING_WIDTH = 2f
}
