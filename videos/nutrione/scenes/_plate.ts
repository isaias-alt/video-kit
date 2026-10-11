// The Plate base for this video (see src/kit/plate.ts).
import { makePlate, W, H } from '@kit/plate';
import { C, loadBrandFonts } from './_brand';

export { W, H };
export const Plate = makePlate({ bg: C.bg, loadFonts: loadBrandFonts });
