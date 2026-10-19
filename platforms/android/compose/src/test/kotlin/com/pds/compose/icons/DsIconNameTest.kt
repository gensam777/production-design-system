package com.pds.compose.icons

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DsIconNameTest {
    @Test fun `ids are the catalog names`() {
        assertEquals("arrow-left", DsIconName.ArrowLeft.id)
        assertEquals("eye-off", DsIconName.EyeOff.id)
        assertEquals("close", DsIconName.Close.id)
        assertEquals(DsIconName.ChevronDown, DsIconName.fromId("chevron-down"))
        assertEquals(null, DsIconName.fromId("not-an-icon"))
    }

    @Test fun `every icon has Lucide artwork in a 24 by 24 viewport`() {
        for (icon in DsIconName.entries) {
            val v = icon.lucideVector
            assertEquals(24f, v.viewportWidth)
            assertEquals(24f, v.viewportHeight)
            assertTrue("$icon has no paths", v.root.size > 0)
        }
    }
}
