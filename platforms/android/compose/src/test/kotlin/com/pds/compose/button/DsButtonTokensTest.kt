package com.pds.compose.button

import com.pds.compose.ContractYaml
import com.pds.tokens.BrandA
import com.pds.tokens.BrandB
import com.pds.tokens.DsCornerShape
import com.pds.tokens.DsTheme
import com.pds.tokens.DsThemes
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Every binding in DsButtonTokens. */
private fun allBindings(): List<DsTokenRef<*>> {
    val t = DsButtonTokens
    return buildList {
        t.background.values.forEach { cells -> cells.values.filterNotNull().forEach(::add) }
        t.borderColor.values.filterNotNull().forEach(::add)
        t.labelColor.values.forEach { add(it.first); add(it.second) }
        t.spinnerColor.values.forEach(::add)
        listOf(t.paddingBlock, t.paddingInline, t.paddingInlineIconSide, t.gap, t.leadingIconSize, t.trailingIconSize, t.spinnerSize)
            .forEach { addAll(it.values) }
        addAll(t.labelTypography.values)
        addAll(listOf(t.radius, t.stateTransition, t.spinnerRadius, t.spinnerRotation, t.focusRing, t.focusRingOffset))
    }
}

/**
 * Resolves a contract path on the generated theme by its member names (ADR 0013 / 0016 naming:
 * `text` → `typography`, kebab → lowerCamelCase), independently of the binding's lambda.
 */
private fun resolveByPath(theme: DsTheme, path: String): Any? =
    path.split('.').mapIndexed { i, segment ->
        if (i == 0 && segment == "text") {
            "typography"
        } else {
            segment.split('-').let { parts -> parts.first() + parts.drop(1).joinToString("") { it.replaceFirstChar(Char::uppercase) } }
        }
    }.fold<String, Any?>(theme) { node, name ->
        node!!.javaClass.getMethod("get" + name.replaceFirstChar(Char::uppercase)).invoke(node)
    }

class DsButtonTokensTest {
    private val brands = DsThemes.all

    @Test fun `token bindings equal the contract tokens section cell by cell`() {
        val contract = ContractYaml.leaves("tokens")
        assertTrue(contract.isNotEmpty())
        assertEquals(contract.toSortedMap(), DsButtonTokens.contractCells.toSortedMap())
    }

    @Test fun `each binding resolves to the member its contract path names, in every brand`() {
        assertEquals(setOf("brand-a", "brand-b"), brands.keys)
        for ((brand, theme) in brands) {
            for (ref in allBindings()) assertEquals("$brand ${ref.path}", resolveByPath(theme, ref.path), ref.resolve(theme))
        }
    }

    @Test fun `component constants and minimum heights match the contract`() {
        val constants = ContractYaml.leaves("component-constants")
        assertEquals("1", constants["border-width.value"])
        assertEquals(1f, DsButtonConstants.BORDER_WIDTH)
        assertEquals("2", constants["spinner-stroke-width.value"])
        assertEquals(2f, DsButtonConstants.SPINNER_STROKE_WIDTH)
        assertEquals("2", constants["focus-indicator-geometry.value.offset-width"])
        assertEquals("2", constants["focus-indicator-geometry.value.ring-width"])

        val sizing = ContractYaml.leaves("sizing")
        assertEquals("minimum", sizing["height"])
        for (size in DsButtonSize.entries) {
            assertEquals(sizing["visual-height.${size.contractValue}"], DsButtonConstants.visualHeight.getValue(size).toInt().toString())
        }
        assertEquals("48dp", sizing["hit-target.minimum.android"])
        assertEquals(48f, DsButtonConstants.MINIMUM_HIT_TARGET)
    }

    @Test fun `enums match the contract values`() {
        val contract = ContractYaml.button.readText()
        assertEquals(listOf("primary", "secondary", "tertiary", "danger"), DsButtonVariant.entries.map { it.contractValue })
        assertEquals(listOf("sm", "md", "lg"), DsButtonSize.entries.map { it.contractValue })
        (DsButtonVariant.entries + DsButtonSize.entries).forEach { assertTrue(contract.contains("      ${it.contractValue}: ")) }
    }

    @Test fun `spinner radius is the full shape in every brand`() {
        brands.values.forEach { assertEquals(DsCornerShape.Full, DsButtonTokens.spinnerRadius.resolve(it)) }
    }

    @Test fun `brand-dependent tokens differ, shared ones don't`() {
        val idle = DsButtonState(enabled = true, loading = false)
        val a = DsButtonAppearance.resolve(BrandA, DsButtonVariant.Primary, DsButtonSize.Md, idle)
        val b = DsButtonAppearance.resolve(BrandB, DsButtonVariant.Primary, DsButtonSize.Md, idle)
        assertEquals(BrandA.color.action.primary.default, a.background)
        assertEquals(BrandB.color.action.primary.default, b.background)
        assertNotEquals(a.background, b.background)
        assertEquals(BrandA.radius.control, a.metrics.radius)
        assertEquals(BrandB.radius.control, b.metrics.radius)
        assertNotEquals(a.metrics.typography.fontFamily, b.metrics.typography.fontFamily)
        assertEquals(a.foreground, b.foreground) // action.primary.on-color is shared
        val dangerA = DsButtonAppearance.resolve(BrandA, DsButtonVariant.Danger, DsButtonSize.Md, idle)
        val dangerB = DsButtonAppearance.resolve(BrandB, DsButtonVariant.Danger, DsButtonSize.Md, idle)
        assertEquals(dangerA.background, dangerB.background)
    }
}
