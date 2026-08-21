#!/usr/bin/env swift
import Foundation
import Vision
import AppKit

guard CommandLine.arguments.count > 1 else {
    fputs("usage: ocr-image.swift <image-path>\n", stderr)
    exit(1)
}

let imagePath = CommandLine.arguments[1]
let imageURL = URL(fileURLWithPath: imagePath)

guard let image = NSImage(contentsOf: imageURL),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    fputs("failed to load image\n", stderr)
    exit(2)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["zh-Hans", "en-US"]
request.usesLanguageCorrection = true

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

do {
    try handler.perform([request])
} catch {
    fputs("ocr failed: \(error.localizedDescription)\n", stderr)
    exit(3)
}

let lines = request.results?
    .compactMap { $0.topCandidates(1).first?.string }
    .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty } ?? []

print(lines.joined(separator: "\n"))
