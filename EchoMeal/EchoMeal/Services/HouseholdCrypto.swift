import CryptoKit
import Foundation

/// Turns a household code into the only two values CloudKit ever sees: an
/// opaque lookup ID used in record names, and an AES key used to encrypt
/// every payload. The code itself is never written to CloudKit.
///
/// Why this exists. Household data lives in the CloudKit **public**
/// database, which every iCloud user of the app can read, so the household
/// code was the only thing protecting it. Records were named after the code
/// and every field was plaintext JSON, so anyone who learned a code (or
/// enumerated the container through the queryable householdID index) could
/// read a household's whole meal history. Now the code stays on the two
/// phones, the record names are a one-way derivation of it, and the
/// contents are ciphertext. Someone who downloads the entire container gets
/// opaque IDs and sealed blobs.
///
/// CKRecord.encryptedValues, Apple's own field encryption, is not an option
/// here: it works only in the private and shared databases, not the public
/// one. So the sealing happens in the app, before the write.
enum HouseholdCrypto {

    // MARK: - Code format

    /// Crockford base32. Thirty-two symbols, with I, L, O, and U left out so
    /// a code read off a screen cannot be mistyped into a different valid
    /// code. Reading is forgiving in the other direction: normalize maps a
    /// typed I or L to 1 and a typed O to 0.
    static let alphabet = Array("0123456789ABCDEFGHJKMNPQRSTVWXYZ")

    /// 128 bits of entropy. Sixteen random bytes encode to twenty-six base32
    /// characters, with the last character carrying three bits of padding.
    static let codeByteCount = 16
    static let codeLength = 26

    /// Cosmetic. Stripped by normalize, so a code works typed with or
    /// without it.
    static let displayPrefix = "MEAL"

    private static let alphabetSet = Set(alphabet)

    /// Characters a human might type that normalize knows how to handle,
    /// including the four Crockford leaves out.
    private static let typeableSet = Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")

    // MARK: - Derivation

    /// The pair every CloudKit call needs. Neither value can be run backward
    /// into the code, and the lookup ID reveals nothing about the key,
    /// because HKDF derives them under different info strings.
    struct Derived {
        /// Hex, thirty-two characters. Goes in record names and in the
        /// householdID field the push subscriptions filter on.
        let lookupID: String
        /// AES-256-GCM key for the payload field.
        let key: SymmetricKey
    }

    /// Fixed, and public in the source on purpose. The code is the secret
    /// here, not the salt. Bumping the version string would invalidate every
    /// existing household, so it never changes without a migration.
    private static let salt = Data("mealtime.household.v1".utf8)

    static func derive(from code: String) -> Derived {
        let material = SymmetricKey(data: Data(code.utf8))
        let lookup = HKDF<SHA256>.deriveKey(
            inputKeyMaterial: material,
            salt: salt,
            info: Data("mealtime-lookup-v1".utf8),
            outputByteCount: 16
        )
        let dataKey = HKDF<SHA256>.deriveKey(
            inputKeyMaterial: material,
            salt: salt,
            info: Data("mealtime-payload-v1".utf8),
            outputByteCount: 32
        )
        let hex = lookup.withUnsafeBytes { Data($0) }
            .map { String(format: "%02x", $0) }
            .joined()
        return Derived(lookupID: hex, key: dataKey)
    }

    // MARK: - Generation

    /// A fresh household code, drawn from the system CSPRNG.
    ///
    /// A failure here would mean the OS could not produce randomness, and
    /// the alternative to stopping is handing back a predictable code that
    /// silently protects nothing. This trap has never been seen to fire.
    static func generateCode() -> String {
        var bytes = [UInt8](repeating: 0, count: codeByteCount)
        let status = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        precondition(status == errSecSuccess, "SecRandomCopyBytes failed: \(status)")
        return encode(Data(bytes))
    }

    /// Base32, most significant bit first. Sixteen bytes in, twenty-six
    /// characters out. There is deliberately no decoder: nothing needs the
    /// original bytes back, since the code string itself is what feeds HKDF.
    static func encode(_ data: Data) -> String {
        var out = ""
        var buffer = 0
        var bits = 0
        for byte in data {
            buffer = (buffer << 8) | Int(byte)
            bits += 8
            while bits >= 5 {
                out.append(alphabet[(buffer >> (bits - 5)) & 0x1F])
                bits -= 5
            }
        }
        if bits > 0 {
            out.append(alphabet[(buffer << (5 - bits)) & 0x1F])
        }
        return out
    }

    // MARK: - Reading a typed or scanned code

    /// Canonical form of whatever the user typed, pasted, or scanned:
    /// uppercased, punctuation and spaces dropped, the MEAL prefix removed,
    /// and the ambiguous characters folded onto the ones they look like.
    /// The result is what gets stored and what feeds derive.
    static func normalize(_ raw: String) -> String {
        var cleaned = String(raw.uppercased().filter { typeableSet.contains($0) })
        if cleaned.hasPrefix(displayPrefix) {
            cleaned.removeFirst(displayPrefix.count)
        }
        return String(cleaned.map { character in
            switch character {
            case "I", "L": return "1"
            case "O": return "0"
            default: return character
            }
        })
    }

    /// True when a normalized string is the right length and contains only
    /// alphabet characters. U is the one typeable character with no sensible
    /// correction, so a code containing one fails here rather than being
    /// quietly bent into a different household.
    static func isValid(_ normalized: String) -> Bool {
        normalized.count == codeLength && normalized.allSatisfy { alphabetSet.contains($0) }
    }

    // MARK: - Display

    /// Grouped for reading aloud and for typing without losing your place:
    /// MEAL-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XX. Twenty-six characters do not
    /// divide evenly, so the last group is a pair.
    static func formatted(_ code: String) -> String {
        guard !code.isEmpty else { return "" }
        let groups = stride(from: 0, to: code.count, by: 4).map { offset -> String in
            let start = code.index(code.startIndex, offsetBy: offset)
            let end = code.index(start, offsetBy: min(4, code.count - offset))
            return String(code[start..<end])
        }
        return ([displayPrefix] + groups).joined(separator: "-")
    }

    // MARK: - Handoff link

    /// Custom scheme rather than a universal link, so joining needs no
    /// associated-domains entitlement and no apple-app-site-association file
    /// on the website. Both phones already have the app installed, which is
    /// the only case this link has to work in.
    static let urlScheme = "mealtime"
    private static let joinHost = "join"
    private static let codeQueryItem = "c"

    /// The link behind the QR code. Scanned with the stock iOS Camera app,
    /// it opens MealTime and joins, so the app never needs camera access of
    /// its own and never has to declare a camera privacy string.
    static func joinURL(for code: String) -> URL? {
        var components = URLComponents()
        components.scheme = urlScheme
        components.host = joinHost
        components.queryItems = [URLQueryItem(name: codeQueryItem, value: code)]
        return components.url
    }

    /// Pulls a normalized code back out of a join link, or nil if the URL is
    /// not one of ours or carries nothing valid. Callers treat the result as
    /// untrusted input and run it through the same validation a typed code
    /// gets.
    static func code(fromJoinURL url: URL) -> String? {
        guard url.scheme?.lowercased() == urlScheme, url.host?.lowercased() == joinHost,
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let raw = components.queryItems?.first(where: { $0.name == codeQueryItem })?.value
        else { return nil }
        let code = normalize(raw)
        return isValid(code) ? code : nil
    }

    // MARK: - Sealing

    enum CryptoFailure: Error {
        case sealFailed
    }

    /// AES-256-GCM. The returned blob is CryptoKit's combined form, so the
    /// randomly generated nonce and the authentication tag travel with the
    /// ciphertext and a nonce is never reused across writes.
    static func seal(_ plaintext: Data, key: SymmetricKey) throws -> Data {
        guard let combined = try AES.GCM.seal(plaintext, using: key).combined else {
            throw CryptoFailure.sealFailed
        }
        return combined
    }

    /// Returns nil on a torn, truncated, or wrong-key blob rather than
    /// throwing, because every caller treats an unreadable record the same
    /// way it treats a missing one.
    static func open(_ ciphertext: Data, key: SymmetricKey) -> Data? {
        guard let box = try? AES.GCM.SealedBox(combined: ciphertext) else { return nil }
        return try? AES.GCM.open(box, using: key)
    }
}
