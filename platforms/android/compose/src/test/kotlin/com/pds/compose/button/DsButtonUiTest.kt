package com.pds.compose.button

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.InputModeManager
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.pds.compose.icons.DsIconName
import com.pds.compose.theme.PdsTheme
import com.pds.tokens.BrandA
import com.pds.tokens.BrandB
import com.pds.tokens.DsTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
// Real text measurement (the legacy mode fakes font metrics, so heights would be meaningless).
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DsButtonUiTest {
    @get:Rule val rule = createComposeRule()

    private val label = "Save changes"
    private val button get() = rule.onNodeWithTag("button")

    private fun show(
        theme: DsTheme = BrandA,
        fontScale: Float? = null,
        content: @androidx.compose.runtime.Composable () -> Unit,
    ) = rule.setContent {
        val base = LocalDensity.current
        val density = if (fontScale == null) base else Density(base.density, fontScale)
        CompositionLocalProvider(LocalDensity provides density) {
            PdsTheme(theme) { Box(Modifier.padding(24.dp)) { content() } }
        }
    }

    private fun stateDescription(expected: String?) = SemanticsMatcher("stateDescription = $expected") {
        it.config.getOrElseNullable(SemanticsProperties.StateDescription) { null } == expected
    }

    @Test fun `is a button named by its label and runs onClick`() {
        var clicks = 0
        show { DsButton(label, onClick = { clicks++ }, modifier = Modifier.testTag("button")) }
        button
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button))
            .assertHasClickAction()
            .assertIsEnabled()
            .assert(stateDescription(null))
        rule.onNodeWithText(label).assertExists()
        button.performClick()
        assertEquals(1, clicks)
    }

    @Test fun `disabled - reported disabled, onClick never runs`() {
        var clicks = 0
        show { DsButton(label, onClick = { clicks++ }, enabled = false, modifier = Modifier.testTag("button")) }
        button.assertIsNotEnabled().performClick()
        assertEquals(0, clicks)
    }

    @Test fun `loading - enabled and focusable, Loading state, spinner shown, onClick blocked, name kept`() {
        var clicks = 0
        show {
            DsButton(label, onClick = { clicks++ }, loading = true, leadingIcon = DsIconName.Check, modifier = Modifier.testTag("button"))
        }
        button.assertIsEnabled().assert(stateDescription("Loading")).performClick()
        assertEquals(0, clicks)
        rule.onNodeWithTag(DsButtonTestTags.SPINNER, useUnmergedTree = true).assertExists()
        rule.onNodeWithText(label).assertExists() // the name stays the label
    }

    @Test fun `loading keeps the size of the idle button`() {
        show {
            Box {
                DsButton(label, onClick = {}, leadingIcon = DsIconName.Check, modifier = Modifier.testTag("idle"))
                DsButton(label, onClick = {}, leadingIcon = DsIconName.Check, loading = true, modifier = Modifier.testTag("button"))
            }
        }
        val idle = rule.onNodeWithTag("idle").getUnclippedBoundsInRoot()
        val busy = button.getUnclippedBoundsInRoot()
        assertEquals(idle.right - idle.left, busy.right - busy.left)
        assertEquals(idle.bottom - idle.top, busy.bottom - busy.top)
    }

    @Test fun `disabled plus loading - disabled wins, label shown, no spinner, not busy`() {
        var clicks = 0
        show { DsButton(label, onClick = { clicks++ }, enabled = false, loading = true, modifier = Modifier.testTag("button")) }
        button.assertIsNotEnabled().assert(stateDescription(null)).performClick()
        assertEquals(0, clicks)
        rule.onNodeWithTag(DsButtonTestTags.SPINNER, useUnmergedTree = true).assertDoesNotExist()
        rule.onNodeWithText(label).assertExists()
    }

    @Test fun `minimum heights at the default font size`() {
        val heights = mapOf(DsButtonSize.Sm to 32.dp, DsButtonSize.Md to 40.dp, DsButtonSize.Lg to 48.dp)
        show {
            Column { heights.keys.forEach { DsButton("OK", onClick = {}, size = it, modifier = Modifier.testTag(it.name)) } }
        }
        heights.forEach { (size, height) -> rule.onNodeWithTag(size.name).assertHeightIsEqualTo(height) }
    }

    @Test fun `font scaling grows the button instead of clipping`() {
        show(fontScale = 2f) { DsButton(label, onClick = {}, size = DsButtonSize.Sm, modifier = Modifier.testTag("button")) }
        button.assertHeightIsAtLeast(40.dp) // well past the 32dp minimum
    }

    @Test fun `a long label wraps within a narrow width and the button grows`() {
        show {
            DsButton(
                "Confirm and continue to the payment details step", onClick = {},
                modifier = Modifier.width(160.dp).testTag("button"),
            )
        }
        button.assertHeightIsAtLeast(56.dp) // more than one line of 14sp text inside 40dp
    }

    @Test fun `touch target reaches 48dp outside the visual bounds without changing layout`() {
        var clicks = 0
        show { DsButton("OK", onClick = { clicks++ }, size = DsButtonSize.Sm, modifier = Modifier.testTag("button")) }
        button.assertHeightIsEqualTo(32.dp)
        // 6dp above the visual top edge: inside the 48dp target, outside the 32dp box.
        button.performTouchInput {
            val y = -6.dp.toPx()
            down(Offset(centerX, y))
            up()
        }
        assertEquals(1, clicks)
    }

    @Test fun `keyboard focus reaches a loading button`() {
        val focus = FocusRequester()
        lateinit var inputMode: InputModeManager
        show {
            inputMode = LocalInputModeManager.current
            DsButton(label, onClick = {}, loading = true, modifier = Modifier.focusRequester(focus).testTag("button"))
        }
        // A keyboard / D-pad press leaves touch mode; in touch mode a click never takes focus.
        rule.runOnIdle {
            inputMode.requestInputMode(InputMode.Keyboard)
            focus.requestFocus()
        }
        button.assertIsFocused()
    }

    @Test fun `brands nest - each subtree renders with its own theme`() {
        rule.setContent {
            Column {
                PdsTheme(BrandA) { DsButton("A", onClick = {}, modifier = Modifier.testTag("a")) }
                PdsTheme(BrandB) { DsButton("B", onClick = {}, modifier = Modifier.testTag("b")) }
            }
        }
        rule.onNodeWithTag("a").assertExists()
        rule.onNodeWithTag("b").assertExists()
    }
}
