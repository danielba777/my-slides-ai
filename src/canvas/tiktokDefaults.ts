export const TIKTOK_OUTLINE_WIDTH = 7;
export const TIKTOK_OUTLINE_COLOR = "#000000";
export const TIKTOK_TEXT_COLOR = "#ffffff";

export const TIKTOK_BACKGROUND_MODE = "block" as const;
// TikTok Highlight-Box uses white background with black text
export const TIKTOK_BACKGROUND_COLOR = "#ffffff";
export const TIKTOK_BACKGROUND_OPACITY = 1;
// TikTok uses 0.3em border-radius for rounded corners
// At 72px base font: 0.3em = ~22px
export const TIKTOK_BACKGROUND_RADIUS = 22; // 0.3em at 72px
// TikTok uses 0.2em vertical and 0.4em horizontal padding
// At 72px base font: 0.2em = ~14px, 0.4em = ~29px
export const TIKTOK_BACKGROUND_PADDING_Y = 14; // 0.2em at 72px
export const TIKTOK_BACKGROUND_PADDING_X = 29; // 0.4em at 72px
export const TIKTOK_BACKGROUND_PADDING = 22; // deprecated, use PADDING_X/Y instead
