import CryptoKit
import XCTest

@testable import EchoMeal

/// Checks the household code scheme, which is the only thing standing
/// between a stranger and a household's data.
///
/// Why this exists. Household records live in the CloudKit **public**
/// database, which every iCloud user of the app can read. The protection is
/// entirely in this file's arithmetic: the record names are a one-way
/// derivation of the code, and the contents are sealed with a key derived
/// from the same code under a different info string. If any of that quietly
/// stops holding, nothing crashes and nothing logs. Sync keeps working
/// perfectly while the data sits in the open. These tests fail loudly
/// instead.
///
/// The predecessor to this scheme shipped a fixed household code hardcoded
/// in a public repo, and nothing caught it. That is the class of bug this
/// file exists to catch.
final class HouseholdCryptoTests: XCTestCase {

    // MARK: - Generation

    func testGeneratedCodeHasTheRightShape() {
        let code = HouseholdCrypto.generateCode()
        XCTAssertEqual(code.count, HouseholdCrypto.codeLength)
        XCTAssertTrue(HouseholdCrypto.isValid(code))
        let alphabet = Set(HouseholdCrypto.alphabet)
        XCTAssertTrue(code.allSatisfy { alphabet.contains($0) })
    }

    /// A stuck or seeded RNG is the quiet catastrophe here: every household
    /// would share a code and the encryption would be decorative. Collisions
    /// at 128 bits are otherwise impossible, so any repeat means the source
    /// is broken.
    func testGeneratedCodesAreAllDistinct() {
        let batch = Set((0..<2000).map { _ in HouseholdCrypto.generateCode() })
        XCTAssertEqual(batch.count, 2000)

        // Every symbol should turn up across 52,000 characters. Holes would
        // mean the base32 packer is dropping or favouring bits.
        var seen = Set<Character>()
        batch.forEach { seen.formUnion($0) }
        XCTAssertEqual(seen.count, HouseholdCrypto.alphabet.count)
    }

    // MARK: - Reading a code back

    func testFormattedCodeNormalizesBack() {
        let code = HouseholdCrypto.generateCode()
        let shown = HouseholdCrypto.formatted(code)
        XCTAssertTrue(shown.hasPrefix("MEAL-"))
        XCTAssertEqual(HouseholdCrypto.normalize(shown), code)
        XCTAssertEqual(HouseholdCrypto.normalize(shown.lowercased()), code)
        XCTAssertEqual(HouseholdCrypto.normalize("  \(shown) \n"), code)
        XCTAssertEqual(HouseholdCrypto.normalize(code), code)
    }

    /// Someone reading a code aloud says "oh" and "eye". Both have to land
    /// on the same household as the digits they look like, or the join
    /// silently succeeds into an empty household that reads as data loss.
    func testAmbiguousCharactersFold() {
        XCTAssertEqual(
            HouseholdCrypto.normalize("MEAL-" + String(repeating: "I", count: 26)),
            HouseholdCrypto.normalize("MEAL-" + String(repeating: "1", count: 26))
        )
        XCTAssertEqual(
            HouseholdCrypto.normalize("MEAL-" + String(repeating: "L", count: 26)),
            HouseholdCrypto.normalize("MEAL-" + String(repeating: "1", count: 26))
        )
        XCTAssertEqual(
            HouseholdCrypto.normalize("MEAL-" + String(repeating: "O", count: 26)),
            HouseholdCrypto.normalize("MEAL-" + String(repeating: "0", count: 26))
        )
    }

    func testValidationRejectsNearMisses() {
        let code = HouseholdCrypto.generateCode()
        XCTAssertFalse(HouseholdCrypto.isValid(String(code.dropLast())))
        XCTAssertFalse(HouseholdCrypto.isValid(code + "7"))
        XCTAssertFalse(HouseholdCrypto.isValid(""))
        // U is the one typeable character with no sensible correction.
        XCTAssertFalse(HouseholdCrypto.isValid(String(code.dropLast()) + "U"))
    }

    // MARK: - Derivation

    func testDerivationIsDeterministicAndOpaque() {
        let code = HouseholdCrypto.generateCode()
        let first = HouseholdCrypto.derive(from: code)
        let second = HouseholdCrypto.derive(from: code)

        XCTAssertEqual(first.lookupID, second.lookupID)
        XCTAssertEqual(first.lookupID.count, 32)
        XCTAssertTrue(first.lookupID.allSatisfy { $0.isHexDigit })

        // The lookup ID goes in record names, which anyone can list.
        XCTAssertFalse(first.lookupID.uppercased().contains(code))
    }

    /// The lookup ID is public and the key is not, so deriving one from the
    /// other must be impossible. Different HKDF info strings are what buy
    /// that, and swapping them by accident would not break anything visible.
    func testKeyIsIndependentOfTheLookupID() {
        let derived = HouseholdCrypto.derive(from: HouseholdCrypto.generateCode())
        let keyBytes = derived.key.withUnsafeBytes { Data($0) }
        XCTAssertEqual(keyBytes.count, 32)

        let lookupBytes = Data(stride(from: 0, to: 32, by: 2).map { offset -> UInt8 in
            let start = derived.lookupID.index(derived.lookupID.startIndex, offsetBy: offset)
            let end = derived.lookupID.index(start, offsetBy: 2)
            return UInt8(derived.lookupID[start..<end], radix: 16)!
        })
        XCTAssertFalse(keyBytes.starts(with: lookupBytes))
    }

    func testDifferentCodesDeriveDifferently() {
        let code = HouseholdCrypto.generateCode()
        let mine = HouseholdCrypto.derive(from: code)
        let theirs = HouseholdCrypto.derive(from: HouseholdCrypto.generateCode())
        XCTAssertNotEqual(mine.lookupID, theirs.lookupID)

        var nudged = Array(code)
        nudged[0] = nudged[0] == "7" ? "8" : "7"
        XCTAssertNotEqual(HouseholdCrypto.derive(from: String(nudged)).lookupID, mine.lookupID)
    }

    // MARK: - Sealing

    func testPayloadRoundTrips() throws {
        let key = HouseholdCrypto.derive(from: HouseholdCrypto.generateCode()).key
        let secret = Data("chicken thighs, rice, broccoli".utf8)
        let sealed = try HouseholdCrypto.seal(secret, key: key)

        XCTAssertNotEqual(sealed, secret)
        XCTAssertNil(sealed.range(of: secret), "plaintext must not survive in the blob")
        XCTAssertGreaterThan(sealed.count, secret.count, "nonce and tag ride along")
        XCTAssertEqual(HouseholdCrypto.open(sealed, key: key), secret)
    }

    func testAnotherHouseholdCannotOpenIt() throws {
        let mine = HouseholdCrypto.derive(from: HouseholdCrypto.generateCode()).key
        let theirs = HouseholdCrypto.derive(from: HouseholdCrypto.generateCode()).key
        let sealed = try HouseholdCrypto.seal(Data("dinner".utf8), key: mine)
        XCTAssertNil(HouseholdCrypto.open(sealed, key: theirs))
    }

    /// A reused nonce would make two identical weeks produce identical
    /// ciphertext, which leaks that they are the same and, with AES-GCM,
    /// is a genuine break rather than a hint.
    func testSealingTwiceProducesDifferentCiphertext() throws {
        let key = HouseholdCrypto.derive(from: HouseholdCrypto.generateCode()).key
        let secret = Data("the same week twice".utf8)
        let first = try HouseholdCrypto.seal(secret, key: key)
        let second = try HouseholdCrypto.seal(secret, key: key)

        XCTAssertNotEqual(first, second)
        XCTAssertEqual(HouseholdCrypto.open(first, key: key), secret)
        XCTAssertEqual(HouseholdCrypto.open(second, key: key), secret)
    }

    func testTamperedPayloadsAreRejected() throws {
        let key = HouseholdCrypto.derive(from: HouseholdCrypto.generateCode()).key
        let sealed = try HouseholdCrypto.seal(Data("dinner".utf8), key: key)

        var flipped = sealed
        flipped[flipped.count - 1] ^= 0x01
        XCTAssertNil(HouseholdCrypto.open(flipped, key: key))
        XCTAssertNil(HouseholdCrypto.open(sealed.prefix(sealed.count - 4), key: key))
        XCTAssertNil(HouseholdCrypto.open(Data([0, 1, 2, 3]), key: key))
    }

    /// saveClearedPlan writes an empty payload as a tombstone, so the empty
    /// case has to survive the round trip rather than being mistaken for a
    /// failure.
    func testEmptyPayloadRoundTrips() throws {
        let key = HouseholdCrypto.derive(from: HouseholdCrypto.generateCode()).key
        let sealed = try HouseholdCrypto.seal(Data(), key: key)
        XCTAssertEqual(HouseholdCrypto.open(sealed, key: key), Data())
    }

    // MARK: - Join link

    func testJoinURLRoundTrips() throws {
        let code = HouseholdCrypto.generateCode()
        let url = try XCTUnwrap(HouseholdCrypto.joinURL(for: code))
        XCTAssertEqual(url.scheme, HouseholdCrypto.urlScheme)
        XCTAssertEqual(HouseholdCrypto.code(fromJoinURL: url), code)
    }

    /// A URL arriving through onOpenURL is untrusted input from whatever the
    /// camera happened to see.
    func testHostileURLsAreRejected() throws {
        let code = HouseholdCrypto.generateCode()
        let cases = [
            "https://evil.example/join?c=\(code)",
            "mealtime://steal?c=\(code)",
            "mealtime://join?c=ABC",
            "mealtime://join?c=",
            "mealtime://join"
        ]
        for string in cases {
            let url = try XCTUnwrap(URL(string: string))
            XCTAssertNil(HouseholdCrypto.code(fromJoinURL: url), "should reject \(string)")
        }
    }
}
