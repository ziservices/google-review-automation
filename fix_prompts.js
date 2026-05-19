const fs = require('fs');

// 1. Fix Review Builder
let rbCode = fs.readFileSync('src/app/review-builder/page.tsx', 'utf8');

// A. Import useMemo
rbCode = rbCode.replace(
  'import { useState, Suspense, useEffect, useCallback, useRef } from "react";',
  'import { useState, Suspense, useEffect, useCallback, useRef, useMemo } from "react";'
);

// B. Memoize selectedTags
rbCode = rbCode.replace(
  'const selectedTags = [selectedServiceTag, ...selectedCategoryTags].filter(Boolean) as string[];',
  'const selectedTags = useMemo(() => [selectedServiceTag, ...selectedCategoryTags].filter(Boolean) as string[], [selectedServiceTag, selectedCategoryTags]);'
);

// C. Fix VARIANT_HINTS
rbCode = rbCode.replace(
  `const VARIANT_HINTS = [
  "Lead with food or drink quality.",
  "Lead with service or atmosphere.",
  "Lead with overall vibe and whether you'd return.",
] as const;`,
  `const VARIANT_HINTS = [
  "Focus on the primary service or product provided.",
  "Focus on the customer service and overall experience.",
  "Focus on the results, value, and whether you'd recommend them.",
] as const;`
);

// D. Fix fallbacks (both occurrences in review-builder)
rbCode = rbCode.split(
  '"Really enjoyed our visit here! The food was delicious and the staff were so welcoming. Definitely coming back soon!"'
).join(
  '"Had a great experience! The service was excellent and the team was very helpful. Highly recommended!"'
);

fs.writeFileSync('src/app/review-builder/page.tsx', rbCode);


// 2. Fix Generate Review API
let apiCode = fs.readFileSync('src/app/api/generate-review/route.ts', 'utf8');

// A. Fix prompt
apiCode = apiCode.replace(
  'Write a short, genuine Google review for a restaurant/bar that received a ${rating}-star rating.',
  'Write a short, genuine Google review for a business that received a ${rating}-star rating.'
);

// B. Fix fallbacks
apiCode = apiCode.replace(
  `const fallbacks = [
      "Really enjoyed our visit here. The food was great and the staff were super friendly. Definitely coming back!",
      "Had a great time at this place. Everything was just as expected — good food, good service, good vibes.",
      "Solid spot for a meal out. Food came quickly, tasted fresh, and the team was welcoming. Would recommend.",
    ];`,
  `const fallbacks = [
      "Really enjoyed my experience. The service was great and the staff were super friendly. Definitely coming back!",
      "Had a great time. Everything was just as expected — excellent service and good vibes.",
      "Solid choice. The service was prompt, everything was well-handled, and the team was welcoming. Would recommend.",
    ];`
);

fs.writeFileSync('src/app/api/generate-review/route.ts', apiCode);
