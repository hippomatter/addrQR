# Address QR Overlay

A browser-only tool for creating a 423 × 423 PNG with a high-error-correction
Ethereum address QR over a center-cropped JPEG or PNG. The QR's white modules
and quiet zone are transparent; its dark modules are opaque. Adjust the QR dot
shade from black toward light gray with the slider (default black); the image
background is not altered. Lighter dots may reduce scan reliability.

## Run locally

```sh
npm install
npm run dev
```

## Use the live app

The app is published at <https://hippomatter.github.io/addrQR/>. GitHub Actions
deploys the site to GitHub Pages whenever changes are pushed to `main`.

Enter a 40-character hexadecimal Ethereum address (with or without the
`ethereum:` prefix), select a JPEG or PNG, and choose **Generate QR image**. The
application checks the address format but cannot determine whether an address
belongs to an externally owned account. Image processing runs locally in the
browser; images are not uploaded.

The QR uses Model 2, version 6, error correction level H, and a three-module
quiet zone. Scan-test the downloaded image before relying on it, since an
image-backed transparent quiet zone may reduce readability on some scanners.
