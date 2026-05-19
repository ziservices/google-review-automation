const fs = require('fs');
let code = fs.readFileSync('src/app/review-builder/page.tsx', 'utf8');

// Replace DEFAULT_TAGS with DEFAULT_SERVICE_TAGS and DEFAULT_CATEGORY_TAGS
code = code.replace(
  /const DEFAULT_TAGS: ServiceTag\[\] = \[([\s\S]*?)\];/,
  `const DEFAULT_SERVICE_TAGS: ServiceTag[] = [
  { id: "ds1", emoji: "🛠️", label: "Service" },
  { id: "ds2", emoji: "📦", label: "Product" },
];

const DEFAULT_CATEGORY_TAGS: ServiceTag[] = [
  { id: "d1", emoji: "😊", label: "Friendly Staff" },
  { id: "d2", emoji: "✨", label: "Clean & Tidy" },
  { id: "d3", emoji: "⚡", label: "Fast Service" },
  { id: "d4", emoji: "💰", label: "Great Value" },
  { id: "d5", emoji: "🏆", label: "Professional" },
  { id: "d6", emoji: "❤️", label: "Caring" },
];`
);

// Replace selectedTags and setServiceTags declarations
code = code.replace(
  /const \[selectedTags, setSelectedTags\] = useState<string\[\]>\(\[\]\);\s*const \[serviceTags, setServiceTags\] = useState<ServiceTag\[\]>\(DEFAULT_TAGS\);/,
  `const [selectedServiceTag, setSelectedServiceTag] = useState<string | null>(null);
  const [selectedCategoryTags, setSelectedCategoryTags] = useState<string[]>([]);
  const [serviceTags, setServiceTags] = useState<ServiceTag[]>(DEFAULT_SERVICE_TAGS);
  const [categoryTags, setCategoryTags] = useState<ServiceTag[]>(DEFAULT_CATEGORY_TAGS);
  
  const selectedTags = [selectedServiceTag, ...selectedCategoryTags].filter(Boolean) as string[];`
);

// Replace fetch logic
code = code.replace(
  /if \(error \|\| !business\) \{\s*setServiceTags\(DEFAULT_TAGS\);\s*setTagsLoaded\(true\);\s*return;\s*\}/,
  `if (error || !business) {
        setServiceTags(DEFAULT_SERVICE_TAGS);
        setCategoryTags(DEFAULT_CATEGORY_TAGS);
        setTagsLoaded(true);
        return;
      }`
);

code = code.replace(
  /const json = await res\.json\(\);\s*const tags: ServiceTag\[\] = Array\.isArray\(json\.tags\) && json\.tags\.length > 0\s*\? json\.tags\s*: DEFAULT_TAGS;\s*setServiceTags\(tags\);\s*\} else \{\s*setServiceTags\(DEFAULT_TAGS\);\s*\}/,
  `const json = await res.json();
          setServiceTags(json.serviceTags && json.serviceTags.length > 0 ? json.serviceTags : DEFAULT_SERVICE_TAGS);
          setCategoryTags(json.categoryTags && json.categoryTags.length > 0 ? json.categoryTags : DEFAULT_CATEGORY_TAGS);
        } else {
          setServiceTags(DEFAULT_SERVICE_TAGS);
          setCategoryTags(DEFAULT_CATEGORY_TAGS);
        }`
);

code = code.replace(
  /catch \{\s*setServiceTags\(DEFAULT_TAGS\);\s*\}/,
  `catch {
        setServiceTags(DEFAULT_SERVICE_TAGS);
        setCategoryTags(DEFAULT_CATEGORY_TAGS);
      }`
);

// Replace toggleTag and tagLabelsFrom
code = code.replace(
  /function toggleTag\(tagId: string\) \{[\s\S]*?if \(activeStep === 1\) setActiveStep\(2\);\s*\}/,
  `function toggleServiceTag(tagId: string) {
    setSelectedServiceTag(prev => prev === tagId ? null : tagId);
    if (activeStep === 1 && selectedCategoryTags.length > 0) setActiveStep(2);
  }

  function toggleCategoryTag(tagId: string) {
    setSelectedCategoryTags(prev => {
      if (prev.includes(tagId)) return prev.filter(t => t !== tagId);
      if (prev.length >= maxTagSelections) return prev;
      return [...prev, tagId];
    });
    if (activeStep === 1 && selectedServiceTag) setActiveStep(2);
  }`
);

code = code.replace(
  /const tagLabelsFrom = useCallback\([\s\S]*?\[serviceTags\]\s*\);/,
  `const tagLabelsFrom = useCallback(
    (tagIds: string[]) => {
      const allTags = [...serviceTags, ...categoryTags];
      return tagIds.map((id) => {
        const tag = allTags.find(t => t.id === id);
        return tag ? tag.label : id;
      });
    },
    [serviceTags, categoryTags]
  );`
);

// Replace Step 1 UI
code = code.replace(
  /\{\/\* Step 1 — Tags \*\/\}[\s\S]*?\{\/\* Step 2 — Write \*\/\}/,
  `{/* Step 1 — Tags */}
        <div style={{ ...rb.card, border: activeStep === 1 ? "1.5px solid #6366f1" : "1.5px solid transparent", boxShadow: activeStep === 1 ? "0 8px 24px rgba(99,102,241,0.12)" : rb.card.boxShadow }}>
          <div style={rb.stepHeader}>
            <div style={{ ...rb.stepBadge, background: activeStep >= 1 ? "#6366f1" : "#f1f5f9" }}>
              <span style={{ color: activeStep >= 1 ? "white" : "#94a3b8", fontSize: 13, fontWeight: 700 }}>1</span>
            </div>
            <div>
              <p style={rb.stepTitle}>What did you love?</p>
              <p style={rb.stepDesc}>
                Pick ONE Service Tag and AT LEAST ONE Category Tag.
              </p>
            </div>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 10 }}>Service (Pick exactly 1)</p>
            <div style={rb.tagsGrid}>
              {serviceTags.map((tag) => {
                const selected = selectedServiceTag === tag.id;
                return (
                <button key={tag.id} type="button" onClick={() => toggleServiceTag(tag.id)} style={{
                  padding: "8px 14px", borderRadius: 99, fontSize: 13, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                  border: selected ? "1.5px solid #6366f1" : "1px solid #e2e8f0",
                  background: selected ? "#eff6ff" : "white",
                  color: selected ? "#4f46e5" : "#475569",
                  boxShadow: selected ? "0 2px 8px rgba(99,102,241,0.15)" : "none",
                  transform: selected ? "scale(1.02)" : "scale(1)",
                }}>
                  {tag.emoji} {tag.label}
                </button>
              );})}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 10 }}>Categories (Pick at least 1)</p>
            <div style={rb.tagsGrid}>
              {categoryTags.map((tag) => {
                const selected = selectedCategoryTags.includes(tag.id);
                const atCap = !selected && selectedCategoryTags.length >= maxTagSelections;
                return (
                <button key={tag.id} type="button" disabled={atCap} onClick={() => toggleCategoryTag(tag.id)} style={{
                  padding: "8px 14px", borderRadius: 99, fontSize: 13, fontWeight: 500,
                  cursor: atCap ? "not-allowed" : "pointer", opacity: atCap ? 0.45 : 1, transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                  border: selected ? "1.5px solid #6366f1" : "1px solid #e2e8f0",
                  background: selected ? "#eff6ff" : "white",
                  color: selected ? "#4f46e5" : "#475569",
                  boxShadow: selected ? "0 2px 8px rgba(99,102,241,0.15)" : "none",
                  transform: selected ? "scale(1.02)" : "scale(1)",
                }}>
                  {tag.emoji} {tag.label}
                </button>
              );})}
            </div>
          </div>
        </div>

        {/* Step 2 — Write */}`
);

// Fix valid generation logic where we need selectedServiceTag AND selectedCategoryTags
code = code.replace(
  /const readyForReviews = selectedTags\.length >= 2;/,
  `const readyForReviews = selectedServiceTag !== null && selectedCategoryTags.length >= 1;`
);

fs.writeFileSync('src/app/review-builder/page.tsx', code);
