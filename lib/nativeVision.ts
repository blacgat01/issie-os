
// Interface for the native Barcode Detection API
declare class BarcodeDetector {
  constructor(options?: { formats: string[] });
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>;
  static getSupportedFormats(): Promise<string[]>;
}

export const isBarcodeDetectionSupported = async (): Promise<boolean> => {
  if (!('BarcodeDetector' in window)) return false;
  try {
    // @ts-ignore
    const formats = await BarcodeDetector.getSupportedFormats();
    return formats.length > 0;
  } catch (e) {
    return false;
  }
};

export const detectBarcodesInFrame = async (imageSource: ImageBitmapSource): Promise<string[]> => {
  if (!('BarcodeDetector' in window)) {
    throw new Error("Native Barcode Detection not supported on this device.");
  }

  try {
    // @ts-ignore
    const detector = new BarcodeDetector({
      formats: ['qr_code', 'aztec', 'data_matrix', 'pdf417', 'ean_13', 'code_128']
    });
    
    const results = await detector.detect(imageSource);
    return results.map((res: any) => res.rawValue);
  } catch (e) {
    console.warn("Barcode detection failed:", e);
    return [];
  }
};
