package com.pds.compose

import java.io.File

/**
 * Reads the Button contract from the repository for parity tests. Only a YAML subset: nested
 * mappings of scalars (the shape of `tokens`, `component-constants`, `sizing`). Comments and
 * blank lines are skipped; block scalars (`>-`, `|`) are skipped with their indented body.
 */
object ContractYaml {
    /** Unit tests run with the module directory (platforms/android/compose) as working dir. */
    val button: File = File(System.getProperty("user.dir")!!)
        .resolve("../../../design/contracts/components/button.contract.yaml")
        .canonicalFile

    /** Flattened `a.b.c` → scalar for every leaf under the top-level key [section]. */
    fun leaves(section: String, file: File = button): Map<String, String> {
        val result = linkedMapOf<String, String>()
        val stack = ArrayDeque<Pair<Int, String>>()
        var inSection = false
        var skipDeeperThan: Int? = null
        for (raw in file.readLines()) {
            val trimmed = raw.trim()
            if (trimmed.isEmpty() || trimmed.startsWith("#")) continue
            val indent = raw.takeWhile { it == ' ' }.length
            val limit = skipDeeperThan
            if (limit != null) {
                if (indent > limit) continue
                skipDeeperThan = null
            }
            if (indent == 0) {
                inSection = trimmed == "$section:"
                stack.clear()
                continue
            }
            val colon = trimmed.indexOf(':')
            if (!inSection || colon < 0) continue
            val key = trimmed.substring(0, colon)
            var value = trimmed.substring(colon + 1).trim()
            value.indexOf(" #").takeIf { it >= 0 }?.let { value = value.substring(0, it).trim() }
            while (stack.isNotEmpty() && stack.last().first >= indent) stack.removeLast()
            when {
                value.isEmpty() -> stack.addLast(indent to key)
                value.startsWith(">") || value.startsWith("|") -> skipDeeperThan = indent
                else -> result[(stack.map { it.second } + key).joinToString(".")] = value.trim('\'', '"')
            }
        }
        return result
    }
}
