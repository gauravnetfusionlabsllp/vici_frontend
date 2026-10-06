// Stringee's brand colours (#F5C50A0A in their Android theme is ARGB, i.e. red #C50A0A).
// Used wherever a call carried by Stringee, not VICIdial, needs to stand out.
export const STRINGEE = {
  red:    '#C50A0A',
  blue:   '#2196F3',
  purple: '#673AB7',
  orange: '#FF5722',
};

// The brand gradient at a given hex alpha suffix (e.g. '59' ≈ 35%).
export const stringeeGradient = (alpha, angle = '135deg') =>
  `linear-gradient(${angle}, ${STRINGEE.blue}${alpha} 0%, ${STRINGEE.purple}${alpha} 50%, ${STRINGEE.orange}${alpha} 100%)`;
