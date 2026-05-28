/**
 * Core image processing and inpainting utilities.
 */

/**
 * Iterative Fast Marching-inspired boundary interpolation (Telea-style inpainting).
 * Propagates surrounding known pixel data inwards into the masked region.
 */
export const inpaintImage = (imageData, maskData, width, height, radius = 4) => {
  const img = imageData.data; // RGBA
  const mask = maskData.data; // R channel holds mask values (255 = masked, 0 = unmasked)

  let pixelsToInpaint = [];

  // 1. Gather all masked pixel indices
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (mask[idx] > 128) {
        pixelsToInpaint.push({ x, y, idx });
      }
    }
  }

  if (pixelsToInpaint.length === 0) return;

  const maxIterations = 8;

  // 2. Iteratively fill the boundary inwards
  for (let iter = 0; iter < maxIterations; iter++) {
    const nextRound = [];
    
    for (let i = 0; i < pixelsToInpaint.length; i++) {
      const { x, y, idx } = pixelsToInpaint[i];

      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      let weightSum = 0;

      // Scan search neighborhood
      for (let ny = Math.max(0, y - radius); ny <= Math.min(height - 1, y + radius); ny++) {
        for (let nx = Math.max(0, x - radius); nx <= Math.min(width - 1, x + radius); nx++) {
          const nIdx = (ny * width + nx) * 4;
          
          // If the neighbor is outside the mask (known pixel)
          if (mask[nIdx] <= 128) {
            const dx = nx - x;
            const dy = ny - y;
            const distSq = dx * dx + dy * dy;
            
            // Inverse distance weighting
            const weight = 1.0 / (Math.sqrt(distSq) + 0.1);

            rSum += img[nIdx] * weight;
            gSum += img[nIdx + 1] * weight;
            bSum += img[nIdx + 2] * weight;
            aSum += img[nIdx + 3] * weight;
            weightSum += weight;
          }
        }
      }

      if (weightSum > 0) {
        img[idx] = Math.round(rSum / weightSum);
        img[idx + 1] = Math.round(gSum / weightSum);
        img[idx + 2] = Math.round(bSum / weightSum);
        img[idx + 3] = Math.round(aSum / weightSum);
        // Mark this pixel as filled so it can help fill deeper pixels in the next iteration
        mask[idx] = 0;
      } else {
        // Keep it for the next round
        nextRound.push({ x, y, idx });
      }
    }

    if (nextRound.length === 0 || nextRound.length === pixelsToInpaint.length) {
      break;
    }
    pixelsToInpaint = nextRound;
  }
};

/**
 * Erase the brushed region (set alpha to 0).
 */
export const eraseRegion = (imageData, maskData, width, height) => {
  const img = imageData.data;
  const mask = maskData.data;

  for (let i = 0; i < mask.length; i += 4) {
    if (mask[i] > 128) {
      img[i + 3] = 0; // Set Alpha to fully transparent
    }
  }
};
