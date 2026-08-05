import Foundation
import Security

/// Stores the Anthropic API key in the macOS Keychain under a named item,
/// SignalChainTeacher-APIKey. The key never touches source, a config file,
/// or a log line; it is written here only when Billy pastes it into
/// Settings, and read back at call time in ClaudeTeacherService.
enum KeychainService {
    private static let service = "SignalChainTeacher-APIKey"
    private static let account = "anthropic-api-key"

    static func save(apiKey: String) {
        let data = Data(apiKey.utf8)
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
        query[kSecValueData as String] = data
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(query as CFDictionary, nil)
    }

    static func loadAPIKey() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func deleteAPIKey() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
    }

    static var hasAPIKey: Bool {
        loadAPIKey()?.isEmpty == false
    }
}
