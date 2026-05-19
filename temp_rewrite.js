const fs = require('fs');

function renderTagSection(title, listState, moveFn, removeFn, newLabel, newEmoji, setLabel, setEmoji, addFn, showSuggestions, description) {
  return `
            {/* ${title} */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>${title}</h3>
              ${description ? `<p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>${description}</p>` : ''}
              
              {${listState}.length === 0 ? (
                <div style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14, padding: '24px 20px', textAlign: 'center', marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No tags yet. Add some below.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {${listState}.map((tag, idx) => (
                    <div key={tag.id} className="tag-chip" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                      <input value={tag.emoji} onChange={e => set${listState.charAt(0).toUpperCase() + listState.slice(1)}(prev => prev.map(t => t.id === tag.id ? { ...t, emoji: e.target.value } : t))} style={{ width: 40, textAlign: 'center', fontSize: 18, background: 'transparent', border: 'none', outline: 'none', cursor: 'text', color: '#fff' }} maxLength={4} />
                      <input value={tag.label} onChange={e => set${listState.charAt(0).toUpperCase() + listState.slice(1)}(prev => prev.map(t => t.id === tag.id ? { ...t, label: e.target.value } : t))} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#fff', fontFamily: "'DM Sans', sans-serif" }} />
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => ${moveFn}(tag.id, -1)} disabled={idx === 0} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: idx === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', fontSize: 12, cursor: idx === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                        <button onClick={() => ${moveFn}(tag.id, 1)} disabled={idx === ${listState}.length - 1} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: idx === ${listState}.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', fontSize: 12, cursor: idx === ${listState}.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
                      </div>
                      <button onClick={() => ${removeFn}(tag.id)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.7)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ background: 'rgba(246,110,18,0.05)', border: '1px solid rgba(246,110,18,0.15)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input value={${newEmoji}} onChange={e => ${setEmoji}(e.target.value)} maxLength={4} placeholder="😊" style={{ width: 52, textAlign: 'center', fontSize: 20, padding: '10px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', outline: 'none' }} />
                  <input value={${newLabel}} onChange={e => ${setLabel}(e.target.value)} onKeyDown={e => e.key === 'Enter' && ${addFn}()} placeholder="Add new tag..." style={{ flex: 1, padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 13, color: '#fff', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
                  <button onClick={${addFn}} disabled={!${newLabel}.trim()} style={{ padding: '11px 18px', background: ${newLabel}.trim() ? 'linear-gradient(135deg,#FF9500,#F66E12)' : 'rgba(246,110,18,0.15)', border: 'none', borderRadius: 10, color: ${newLabel}.trim() ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 600, cursor: ${newLabel}.trim() ? 'pointer' : 'not-allowed', fontFamily: "'Syne', sans-serif", whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
                ${showSuggestions ? `
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>QUICK ADD:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {DEFAULT_TAG_SUGGESTIONS.filter(s => !${listState}.some(t => t.label === s.label)).slice(0, 6).map(s => (
                      <button key={s.id} onClick={() => set${listState.charAt(0).toUpperCase() + listState.slice(1)}(prev => [...prev, { ...s, id: uid() }])} style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>{s.emoji} {s.label}</button>
                    ))}
                  </div>
                </div>` : ''}
              </div>
            </div>`;
}

const serviceTagsUI = renderTagSection('Service Tags', 'editingServiceTags', 'moveServiceTag', 'removeServiceTag', 'newServiceTagLabel', 'newServiceTagEmoji', 'setNewServiceTagLabel', 'setNewServiceTagEmoji', 'addServiceTag', false, 'Customers must pick exactly ONE Service Tag (e.g. Service, Product, AC Repair).');
const categoryTagsUI = renderTagSection('Category Tags', 'editingCategoryTags', 'moveCategoryTag', 'removeCategoryTag', 'newCategoryTagLabel', 'newCategoryTagEmoji', 'setNewCategoryTagLabel', 'setNewCategoryTagEmoji', 'addCategoryTag', true, 'Customers must pick AT LEAST ONE Category Tag (e.g. Great Value, Fast Service).');

const defaultServiceTagsUI = renderTagSection('Default Service Tags', 'defaultServiceTags', '()=>{}', 'removeDefaultServiceTag', 'newDefaultServiceLabel', 'newDefaultServiceEmoji', 'setNewDefaultServiceLabel', 'setNewDefaultServiceEmoji', 'addDefaultServiceTag', false);
const defaultCategoryTagsUI = renderTagSection('Default Category Tags', 'defaultCategoryTags', '()=>{}', 'removeDefaultCategoryTag', 'newDefaultCategoryLabel', 'newDefaultCategoryEmoji', 'setNewDefaultCategoryLabel', 'setNewDefaultCategoryEmoji', 'addDefaultCategoryTag', true);

let code = fs.readFileSync('src/app/super-admin/page.tsx', 'utf8');

const OLD_TAGS_UI_START = '{/* Current tags list */}';
const OLD_TAGS_UI_END = '{/* Actions */}';

let startIdx = code.indexOf(OLD_TAGS_UI_START);
let endIdx = code.indexOf(OLD_TAGS_UI_END, startIdx);
if(startIdx > -1 && endIdx > -1) {
    code = code.substring(0, startIdx) + 
           serviceTagsUI + "\n" + categoryTagsUI + "\n" + 
           code.substring(endIdx);
}

const OLD_DEFAULT_UI_START = '{/* Default tags list */}';
const OLD_DEFAULT_UI_END = '<div style={{ display: "flex", gap: 10 }}>';

startIdx = code.indexOf(OLD_DEFAULT_UI_START);
endIdx = code.indexOf(OLD_DEFAULT_UI_END, startIdx);
if(startIdx > -1 && endIdx > -1) {
    code = code.substring(0, startIdx) + 
           defaultServiceTagsUI + "\n" + defaultCategoryTagsUI + "\n" + 
           code.substring(endIdx);
}

fs.writeFileSync('src/app/super-admin/page.tsx', code);
