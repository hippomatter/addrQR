import QRCode from 'qrcode';
import './style.css';

const OUTPUT_SIZE = 423;
const QR_VERSION = 6;
const QUIET_ZONE_MODULES = 3;
const DEFAULT_ADDRESS =
  'ethereum:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

const addressInput = document.querySelector('#address');
const imageInput = document.querySelector('#image');
const imageLighteningInput = document.querySelector('#image-lightening');
const imageLighteningValue = document.querySelector('#image-lightening-value');
const generateButton = document.querySelector('#generate');
const status = document.querySelector('#status');
const sourceFrame = document.querySelector('#source-frame');
const outputFrame = document.querySelector('#output-frame');
const downloadLink = document.querySelector('#download');

let backgroundImage = null;
let sourceObjectUrl = null;

addressInput.value = '';
addressInput.placeholder = DEFAULT_ADDRESS;

function getAddress() {
  const value = addressInput.value.trim();
  const address = value.replace(/^ethereum:/i, '');

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return null;
  }

  return address;
}

function updateButton() {
  generateButton.disabled = !backgroundImage || !getAddress();
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function clearOutput() {
  downloadLink.hidden = true;
  outputFrame.innerHTML =
    '<p class="empty-state">Your generated 423 × 423 QR image will appear here.</p>';
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The selected file could not be decoded as an image.'));
    };
    image.src = objectUrl;
  });
}

function drawOverlay() {
  const address = getAddress();
  if (!address || !backgroundImage) {
    throw new Error('Enter a valid Ethereum address and choose a JPEG or PNG image.');
  }

  const payload = `ethereum:${address}`;
  const qr = QRCode.create(payload, {
    errorCorrectionLevel: 'H',
    version: QR_VERSION,
  });
  const moduleCount = qr.modules.size;
  const totalModules = moduleCount + QUIET_ZONE_MODULES * 2;

  if (totalModules !== 47 || OUTPUT_SIZE % totalModules !== 0) {
    throw new Error('Could not create the expected 423-pixel QR layout.');
  }

  const moduleSize = OUTPUT_SIZE / totalModules;
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is unavailable in this browser.');
  }

  const cropSize = Math.min(backgroundImage.width, backgroundImage.height);
  const cropX = (backgroundImage.width - cropSize) / 2;
  const cropY = (backgroundImage.height - cropSize) / 2;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  const lightening = Number(imageLighteningInput.value) / 100;
  context.save();
  context.filter = `brightness(${100 + lightening * 50}%)`;
  context.drawImage(
    backgroundImage,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );
  context.restore();

  context.fillStyle = `rgba(255, 255, 255, ${lightening * 0.45})`;
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  context.fillStyle = '#000';
  const quietZoneOffset = QUIET_ZONE_MODULES * moduleSize;
  for (let row = 0; row < moduleCount; row += 1) {
    for (let column = 0; column < moduleCount; column += 1) {
      if (qr.modules.get(row, column)) {
        context.fillRect(
          quietZoneOffset + column * moduleSize,
          quietZoneOffset + row * moduleSize,
          moduleSize,
          moduleSize,
        );
      }
    }
  }

  return canvas;
}

addressInput.addEventListener('input', () => {
  clearOutput();
  updateButton();
  if (addressInput.value && !getAddress()) {
    setStatus('Enter a valid 0x-prefixed address with 40 hexadecimal characters.', true);
  } else {
    setStatus('');
  }
});

imageInput.addEventListener('change', async () => {
  const [file] = imageInput.files ?? [];
  backgroundImage = null;
  updateButton();
  clearOutput();

  if (sourceObjectUrl) {
    URL.revokeObjectURL(sourceObjectUrl);
    sourceObjectUrl = null;
  }

  if (!file) {
    sourceFrame.innerHTML =
      '<p class="empty-state">Choose a JPEG or PNG image to preview it here.</p>';
    setStatus('');
    return;
  }

  const supportedType = ['image/jpeg', 'image/png', ''].includes(file.type);
  const supportedExtension = /\.(jpe?g|png)$/i.test(file.name);
  if (!supportedType || !supportedExtension) {
    imageInput.value = '';
    sourceFrame.innerHTML =
      '<p class="empty-state">Choose a JPEG or PNG file.</p>';
    setStatus('Only JPEG and PNG images are supported.', true);
    return;
  }

  setStatus('Loading image…');
  try {
    const loaded = await loadImage(file);
    backgroundImage = loaded.image;
    sourceObjectUrl = loaded.objectUrl;

    const preview = document.createElement('img');
    preview.src = sourceObjectUrl;
    preview.alt = 'Selected background image';
    sourceFrame.replaceChildren(preview);
    setStatus('Image ready. Enter a valid address to generate the QR image.');
  } catch (error) {
    imageInput.value = '';
    sourceFrame.innerHTML =
      '<p class="empty-state">The selected file could not be opened.</p>';
    setStatus(error.message, true);
  }

  updateButton();
});

generateButton.addEventListener('click', () => {
  try {
    renderOverlay();
  } catch (error) {
    setStatus(error.message, true);
  }
});

function renderOverlay() {
  const canvas = drawOverlay();
  const output = document.createElement('img');
  output.src = canvas.toDataURL('image/png');
  output.alt = '423 by 423 pixel address QR code over the selected image';
  outputFrame.replaceChildren(output);
  downloadLink.href = output.src;
  downloadLink.hidden = false;
  setStatus('QR image generated.');
}

imageLighteningInput.addEventListener('input', () => {
  imageLighteningValue.value = `${imageLighteningInput.value}%`;
  if (backgroundImage && getAddress() && !downloadLink.hidden) {
    try {
      renderOverlay();
    } catch (error) {
      setStatus(error.message, true);
    }
  }
});
