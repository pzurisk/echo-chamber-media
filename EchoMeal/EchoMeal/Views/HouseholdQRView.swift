import CoreImage
import CoreImage.CIFilterBuiltins
import SwiftUI
import UIKit

/// The household code as a scannable QR. Twenty-six characters is too many
/// to read across a kitchen, so this is the normal way the second phone
/// joins: the partner points the stock iOS Camera at it, taps the banner,
/// and MealTime opens and joins.
///
/// The QR carries a `mealtime://join` link rather than the bare code, which
/// is what keeps the app out of the camera permission business entirely.
/// Scanning happens in Apple's Camera app, so MealTime needs no
/// AVFoundation, no NSCameraUsageDescription, and no camera entry in App
/// Privacy.
///
/// Anyone who photographs this screen has the household, exactly as if they
/// had been read the code. The caller is responsible for only showing it
/// when the user asked for it.
struct HouseholdQRView: View {
    let url: URL
    var side: CGFloat = 200

    @State private var image: UIImage?

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    // Nearest neighbour. A QR resampled smoothly picks up
                    // grey edges that some scanners refuse.
                    .interpolation(.none)
                    .resizable()
                    .scaledToFit()
            } else {
                ProgressView()
            }
        }
        .frame(width: side, height: side)
        .padding(14)
        // Always light, in both app themes. A dark-tinted QR scans poorly
        // and this is the one surface that has to work on the first try.
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .accessibilityLabel("QR code to join this household")
        .task(id: url) {
            image = Self.render(url)
        }
    }

    /// Rendered at the generator's native size and scaled by SwiftUI, so the
    /// modules stay square. Returns nil only if CoreImage cannot encode the
    /// string, which for a link this short means something is badly wrong.
    private static func render(_ url: URL) -> UIImage? {
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(url.absoluteString.utf8)
        // Medium recovers about 15 percent of the code, which is plenty for
        // a screen and keeps the modules large.
        filter.correctionLevel = "M"
        guard let output = filter.outputImage,
              let cgImage = CIContext().createCGImage(output, from: output.extent)
        else { return nil }
        return UIImage(cgImage: cgImage)
    }
}
