import Foundation

/// Reads the Button contract from the repository, for parity tests. Only the parts the tests
/// need, from a YAML subset: nested mappings of scalars (the shape of `tokens`,
/// `component-constants` and `sizing.visual-height`). Comments and blank lines are skipped;
/// block scalars (`>-`) are skipped with their indented body.
enum ContractYAML {
    static let buttonURL: URL = {
        var url = URL(fileURLWithPath: #filePath)
        for _ in 0..<5 { url.deleteLastPathComponent() }  // Tests/PDSUITests/x → repo root
        return url.appendingPathComponent("design/contracts/components/button.contract.yaml")
    }()

    /// Flattened `a.b.c` → scalar for every leaf under the top-level key `section`.
    static func leaves(of section: String, in url: URL = buttonURL) throws -> [String: String] {
        let lines = try String(contentsOf: url, encoding: .utf8).components(separatedBy: "\n")
        var result: [String: String] = [:]
        var stack: [(indent: Int, key: String)] = []
        var inSection = false
        var skipBlockDeeperThan: Int?

        for raw in lines {
            let trimmed = raw.trimmingCharacters(in: .whitespaces)
            if trimmed.isEmpty || trimmed.hasPrefix("#") { continue }
            let indent = raw.prefix { $0 == " " }.count
            if let limit = skipBlockDeeperThan {
                if indent > limit { continue }
                skipBlockDeeperThan = nil
            }
            if indent == 0 {
                inSection = trimmed == "\(section):"
                stack = []
                continue
            }
            guard inSection, let colon = trimmed.firstIndex(of: ":") else { continue }
            let key = String(trimmed[..<colon])
            var value = trimmed[trimmed.index(after: colon)...].trimmingCharacters(in: .whitespaces)
            if let hash = value.range(of: " #") { value = String(value[..<hash.lowerBound]).trimmingCharacters(in: .whitespaces) }
            while let last = stack.last, last.indent >= indent { stack.removeLast() }
            if value.isEmpty {
                stack.append((indent, key))
            } else if value.hasPrefix(">") || value.hasPrefix("|") {
                skipBlockDeeperThan = indent
            } else {
                let path = (stack.map(\.key) + [key]).joined(separator: ".")
                result[path] = value.trimmingCharacters(in: CharacterSet(charactersIn: "'\""))
            }
        }
        return result
    }
}
