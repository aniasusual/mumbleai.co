import AppKit
import Foundation

enum IconStyle {
    case full
    case foreground
}

struct IconOutput {
    let path: String
    let size: Int
    let style: IconStyle
}

let brandIndigo = NSColor(srgbRed: 79.0 / 255.0, green: 70.0 / 255.0, blue: 229.0 / 255.0, alpha: 1.0)
let brandWhite = NSColor.white
let rotationRadians = CGFloat(-8.0 * .pi / 180.0)

let outputs: [IconOutput] = [
    IconOutput(path: "../frontend/public/apple-touch-icon.png", size: 180, style: .full),
    IconOutput(path: "../frontend/public/icon-192.png", size: 192, style: .full),
    IconOutput(path: "../frontend/public/icon-512.png", size: 512, style: .full),
    IconOutput(path: "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", size: 1024, style: .full),
    IconOutput(path: "android/app/src/main/res/mipmap-mdpi/ic_launcher.png", size: 48, style: .full),
    IconOutput(path: "android/app/src/main/res/mipmap-hdpi/ic_launcher.png", size: 72, style: .full),
    IconOutput(path: "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png", size: 96, style: .full),
    IconOutput(path: "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png", size: 144, style: .full),
    IconOutput(path: "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png", size: 192, style: .full),
    IconOutput(path: "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png", size: 48, style: .full),
    IconOutput(path: "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png", size: 72, style: .full),
    IconOutput(path: "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png", size: 96, style: .full),
    IconOutput(path: "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png", size: 144, style: .full),
    IconOutput(path: "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png", size: 192, style: .full),
    IconOutput(path: "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png", size: 108, style: .foreground),
    IconOutput(path: "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png", size: 162, style: .foreground),
    IconOutput(path: "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png", size: 216, style: .foreground),
    IconOutput(path: "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png", size: 324, style: .foreground),
    IconOutput(path: "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png", size: 432, style: .foreground),
]

let fileManager = FileManager.default

func createWaveformPath() -> CGPath {
    let path = CGMutablePath()
    path.move(to: CGPoint(x: 10, y: 48))
    path.addCurve(to: CGPoint(x: 16, y: 14), control1: CGPoint(x: 10, y: 48), control2: CGPoint(x: 12, y: 16))
    path.addCurve(to: CGPoint(x: 26, y: 40), control1: CGPoint(x: 20, y: 12), control2: CGPoint(x: 22, y: 38))
    path.addCurve(to: CGPoint(x: 34, y: 12), control1: CGPoint(x: 30, y: 42), control2: CGPoint(x: 30, y: 14))
    path.addCurve(to: CGPoint(x: 42, y: 42), control1: CGPoint(x: 38, y: 10), control2: CGPoint(x: 38, y: 40))
    path.addCurve(to: CGPoint(x: 50, y: 14), control1: CGPoint(x: 46, y: 44), control2: CGPoint(x: 46, y: 16))
    path.addCurve(to: CGPoint(x: 56, y: 48), control1: CGPoint(x: 54, y: 12), control2: CGPoint(x: 56, y: 48))
    return path
}

func renderIcon(size: Int, style: IconStyle) -> Data? {
    guard let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size,
        pixelsHigh: size,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ) else {
        return nil
    }

    rep.size = NSSize(width: size, height: size)

    guard let graphicsContext = NSGraphicsContext(bitmapImageRep: rep) else {
        return nil
    }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = graphicsContext

    let canvas = CGRect(x: 0, y: 0, width: size, height: size)
    if style == .full {
        brandIndigo.setFill()
    } else {
        NSColor.clear.setFill()
    }
    NSBezierPath(rect: canvas).fill()

    let context = graphicsContext.cgContext
    context.setShouldAntialias(true)
    context.interpolationQuality = .high

    // Flip once so the drawing coordinates match the SVG coordinate space.
    context.translateBy(x: 0, y: CGFloat(size))
    context.scaleBy(x: 1, y: -1)
    context.translateBy(x: CGFloat(size) / 2.0, y: CGFloat(size) / 2.0)
    context.rotate(by: rotationRadians)

    let scaleMultiplier: CGFloat = style == .full ? 0.96 : 0.80
    let scale = (CGFloat(size) / 64.0) * scaleMultiplier
    context.scaleBy(x: scale, y: scale)
    context.translateBy(x: -32.0, y: -32.0)

    context.addPath(createWaveformPath())
    context.setLineWidth(4.5)
    context.setLineCap(.round)
    context.setLineJoin(.round)
    context.setStrokeColor(brandWhite.cgColor)
    context.strokePath()

    NSGraphicsContext.restoreGraphicsState()
    return rep.representation(using: .png, properties: [:])
}

func writeIcon(_ output: IconOutput) throws {
    let outputURL = URL(fileURLWithPath: output.path)
    let directoryURL = outputURL.deletingLastPathComponent()
    try fileManager.createDirectory(at: directoryURL, withIntermediateDirectories: true)

    guard let pngData = renderIcon(size: output.size, style: output.style) else {
        throw NSError(domain: "generate-icons", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed rendering \(output.path)"])
    }

    try pngData.write(to: outputURL, options: .atomic)
    print("Wrote \(output.path)")
}

do {
    for output in outputs {
        try writeIcon(output)
    }
} catch {
    fputs("Icon generation failed: \(error.localizedDescription)\n", stderr)
    exit(1)
}
