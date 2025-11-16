

export const PLAN_CREDITS = {
  STARTER:   { credits: 25,  ai: 50 },
  GROWTH:    { credits: 100, ai: 150 },
  SCALE:     { credits: 250, ai: 300 },
  UNLIMITED: { credits: -1,  ai: 1000 }, 
} as const;


export const FREE_SLIDESHOW_QUOTA = 5;