import { makePlate, W, H } from '@kit/plate';
import { C, loadBrandFonts } from './brand';

export { W, H };
export const Plate = makePlate({ bg: C.bg, loadFonts: loadBrandFonts });
