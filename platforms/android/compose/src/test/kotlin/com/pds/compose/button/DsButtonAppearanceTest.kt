package com.pds.compose.button

import com.pds.tokens.BrandA
import com.pds.tokens.BrandB
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DsButtonAppearanceTest {
    private val t = BrandA

    private fun look(
        v: DsButtonVariant,
        s: DsButtonSize = DsButtonSize.Md,
        enabled: Boolean = true,
        loading: Boolean = false,
        pressed: Boolean = false,
        hovered: Boolean = false,
    ) = DsButtonAppearance.resolve(t, v, s, DsButtonState(enabled, loading, pressed, hovered))

    @Test fun `variant default, hover, pressed and disabled cells`() {
        val c = t.color
        assertEquals(c.action.primary.default, look(DsButtonVariant.Primary).background)
        assertEquals(c.action.primary.hover, look(DsButtonVariant.Primary, hovered = true).background)
        assertEquals(c.action.primary.active, look(DsButtonVariant.Primary, pressed = true).background)
        assertEquals(c.action.primary.disabled, look(DsButtonVariant.Primary, enabled = false).background)
        assertEquals(c.action.primary.onColor, look(DsButtonVariant.Primary).foreground)
        assertEquals(c.text.disabled, look(DsButtonVariant.Primary, enabled = false).foreground)

        assertEquals(c.action.secondary.default, look(DsButtonVariant.Secondary).background)
        assertEquals(c.border.default, look(DsButtonVariant.Secondary).border)
        assertEquals(c.action.secondary.hover, look(DsButtonVariant.Secondary, pressed = true).background)
        assertEquals(c.action.secondary.default, look(DsButtonVariant.Secondary, enabled = false).background)

        assertNull(look(DsButtonVariant.Tertiary).background)
        assertNull(look(DsButtonVariant.Tertiary).border)
        assertEquals(c.action.tertiary.hover, look(DsButtonVariant.Tertiary, pressed = true).background)
        assertNull(look(DsButtonVariant.Tertiary, enabled = false).background)

        assertEquals(c.action.danger.default, look(DsButtonVariant.Danger).background)
        assertEquals(c.action.danger.hover, look(DsButtonVariant.Danger, pressed = true).background)
        assertEquals(c.action.danger.disabled, look(DsButtonVariant.Danger, enabled = false).background)
        assertEquals(c.action.danger.onColor, look(DsButtonVariant.Danger).foreground)
    }

    @Test fun `sizes resolve minimum height, padding, gap, icon and spinner sizes, typography`() {
        val s = t.space
        val sm = look(DsButtonVariant.Primary, DsButtonSize.Sm).metrics
        assertEquals(32f, sm.minHeight)
        assertEquals(s.inset.xs, sm.paddingBlock)
        assertEquals(s.inset.md, sm.paddingInline)
        assertEquals(s.inset.sm, sm.paddingInlineIconSide)
        assertEquals(s.inline.xs, sm.gap)
        assertEquals(t.icon.sm, sm.iconSize)
        assertEquals(t.icon.sm, sm.spinnerSize)
        assertEquals(t.typography.label.sm.medium, sm.typography)

        val md = look(DsButtonVariant.Primary, DsButtonSize.Md).metrics
        assertEquals(40f, md.minHeight)
        assertEquals(s.inset.lg, md.paddingInline)
        assertEquals(s.inset.md, md.paddingStart(hasIcon = true))
        assertEquals(s.inset.lg, md.paddingEnd(hasIcon = false))

        val lg = look(DsButtonVariant.Primary, DsButtonSize.Lg).metrics
        assertEquals(48f, lg.minHeight)
        assertEquals(s.inset.xl, lg.paddingInline)
        assertEquals(s.inset.lg, lg.paddingInlineIconSide)
        assertEquals(t.icon.lg, lg.iconSize)
        assertEquals(t.typography.label.lg.medium, lg.typography)
    }

    @Test fun `motion tokens`() {
        val m = look(DsButtonVariant.Primary).metrics
        assertEquals(t.motion.micro, m.stateTransition)
        assertEquals(t.motion.spinner, m.spinnerRotation)
        assertEquals(600, m.spinnerRotation.durationMillis)
    }

    @Test fun `loading is busy, not disabled, blocks activation, keeps variant colors, no pressed or hover`() {
        val state = DsButtonState(enabled = true, loading = true, pressed = true, hovered = true)
        assertTrue(state.showsLoading)
        assertFalse(state.canActivate)
        assertEquals(DsButtonVisualState.Default, state.visualState)
        val l = DsButtonAppearance.resolve(t, DsButtonVariant.Primary, DsButtonSize.Md, state)
        assertTrue(l.showsSpinner)
        assertEquals(t.color.action.primary.default, l.background)
        assertEquals(t.color.action.primary.onColor, l.foreground)
        assertEquals(t.color.action.primary.onColor, l.spinner)
    }

    @Test fun `disabled plus loading - disabled wins`() {
        val state = DsButtonState(enabled = false, loading = true)
        assertFalse(state.showsLoading)
        assertFalse(state.canActivate)
        assertEquals(DsButtonVisualState.Disabled, state.visualState)
        val l = DsButtonAppearance.resolve(BrandB, DsButtonVariant.Danger, DsButtonSize.Lg, state)
        assertFalse(l.showsSpinner)
        assertEquals(BrandB.color.action.danger.disabled, l.background)
        assertEquals(BrandB.color.text.disabled, l.foreground)
    }

    @Test fun `precedence disabled over loading over pressed over hover over default`() {
        assertTrue(DsButtonState(enabled = true, loading = false).canActivate)
        assertEquals(DsButtonVisualState.Pressed, DsButtonState(true, false, pressed = true, hovered = true).visualState)
        assertEquals(DsButtonVisualState.Hover, DsButtonState(true, false, hovered = true).visualState)
        assertEquals(DsButtonVisualState.Default, DsButtonState(true, false).visualState)
        assertEquals(DsButtonVisualState.Disabled, DsButtonState(false, false, pressed = true).visualState)
    }

    @Test fun `spinner color per variant`() {
        val expected = mapOf(
            DsButtonVariant.Primary to t.color.action.primary.onColor,
            DsButtonVariant.Secondary to t.color.text.primary,
            DsButtonVariant.Tertiary to t.color.text.primary,
            DsButtonVariant.Danger to t.color.action.danger.onColor,
        )
        expected.forEach { (v, color) -> assertEquals(v.name, color, look(v, loading = true).spinner) }
    }
}
