import { useState, useEffect } from 'react'
import { Search, Info, ArrowRight, ArrowLeft, Layers, Droplets, Home, ChevronRight, Paintbrush, Sparkles, FolderOpen, Trash2, Edit3, Package, Copy, Check } from 'lucide-react'
import paintData from './data/paints.json'


/* ── Reusable PaintTile ───────────────────────────── */
const PaintTile = ({ paint, descriptor, onClick, showType = false, showColorGroup = false, isOwned = false }) => {
  if (!paint) return null
  const isMetallic = paint.type?.toLowerCase().includes('metallic')

  return (
    <div className="relative w-full h-[72px]" onClick={onClick}>
      {/* 1. The Placeholder Wrapper - Keeps the grid stable */}

      {/* 2. The Absolute Tile - This is what actually grows */}
      <div
        className={`
          absolute top-0 left-0 w-full min-h-[72px] group
          flex flex-row gap-3 rounded-xl overflow-hidden cursor-pointer
          bg-bg-secondary border border-glass-border shadow-sm
          transition-all duration-200 ease-out origin-center z-10
          hover:z-50 hover:scale-[1.15] hover:bg-bg-secondary/95 
          hover:border-accent-primary/60 hover:shadow-2xl hover:h-auto
        `}
      >
        {/* Swatch - Stretches automatically if the height increases */}
        <div
          className={`w-20 flex-shrink-0 ${isMetallic ? 'metallic-swatch' : 'swatch-tile-bg'} transition-all duration-200`}
          style={{ backgroundColor: paint.hex }}
        />

        {/* Label Container */}
        <div className="pl-2 pr-4 py-2 flex flex-col justify-center flex-grow min-w-0 bg-bg-secondary/40 backdrop-blur-sm group-hover:bg-transparent transition-colors">

          {/* Type & Color Group Header */}
          <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider truncate group-hover:whitespace-normal group-hover:text-clip">
              {showType ? `Citadel · ${paint.type}` : 'Citadel'}
            </span>

            {/* Color Group Indicator */}
            {showColorGroup && paint.colorGroup && (
              <>
                <span className="text-text-muted/50 text-[10px] flex-shrink-0">•</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div
                    className="w-1.5 h-1.5 rounded-full shadow-sm border border-white/20"
                    style={{ backgroundColor: paint.hex }}
                  />
                  <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                    {paint.colorGroup}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Title & Owned Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-extrabold tracking-tight text-white leading-tight truncate group-hover:whitespace-normal group-hover:text-clip">
              {paint.name}
            </span>
            {isOwned && (
              <Package size={14} className="text-amber-500/90 flex-shrink-0" title="In Collection" />
            )}
          </div>

          {/* Description */}
          {paint.description && (
            <span className="text-[11px] text-accent-primary/90 italic font-semibold mt-0.5 truncate group-hover:whitespace-normal group-hover:text-clip">
              — {paint.description}
            </span>
          )}

          {/* Recipe Descriptor (Only shows in Highlights column) */}
          {descriptor && (
            <span className="text-[9px] bg-accent-secondary/20 text-accent-secondary px-1.5 py-0.5 rounded mt-1.5 self-start font-bold uppercase tracking-wider border border-accent-secondary/30">
              {descriptor}
            </span>
          )}
        </div>
      </div >
    </div >
  )
}

/* ── Main App ─────────────────────────────────────── */
export default function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [history, setHistory] = useState([])
  const [recipeGroups, setRecipeGroups] = useState([])

  /* ── Unified Filters & State ───────────── */
  const [currentView, setCurrentView] = useState('nexus')
  const [sortMethod, setSortMethod] = useState('Alpha')
  const [typeFilter, setTypeFilter] = useState('All')
  const [colorFilter, setColorFilter] = useState('All')
  const [ownershipFilter, setOwnershipFilter] = useState('All')

  /* ── Collection & Local Storage ───────────── */
  const [isEditingCollection, setIsEditingCollection] = useState(false)
  const [ownedPaints, setOwnedPaints] = useState(() => {
    const saved = localStorage.getItem('citadelOwnedPaints')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('citadelOwnedPaints', JSON.stringify(ownedPaints))
  }, [ownedPaints])

  /* ── Dynamic Filter Lists ───────────── */
  const DYNAMIC_TYPES = ['All', ...Array.from(new Set(paintData.paints.map(p => p.type).filter(Boolean))).sort()]

  // This splits "Orange/Brown" into "Orange" and "Brown", trims spaces, and removes duplicates!
  const DYNAMIC_COLORS = ['All', ...Array.from(new Set(
    paintData.paints.flatMap(p => p.colorGroup ? p.colorGroup.split('/').map(c => c.trim()) : [])
  )).sort()]

  /* ── Master Arrays ───────────── */
  const filteredPaints = paintData.paints
    .filter(p => {
      const term = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(term) ||
        (p.colorGroup && p.colorGroup.toLowerCase().includes(term)) ||
        (p.type && p.type.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term));
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const gridPaints = paintData.paints
    .filter(paint => {
      // 1. Type Filter
      if (typeFilter !== 'All' && paint.type !== typeFilter) return false;

      // 2. Color Filter (Now handles split categories!)
      if (colorFilter !== 'All') {
        if (!paint.colorGroup) return false;
        const paintColors = paint.colorGroup.split('/').map(c => c.trim());
        if (!paintColors.includes(colorFilter)) return false;
      }

      // 3. Ownership Filter
      const isOwned = ownedPaints.includes(paint.id);
      if (ownershipFilter === 'Owned' && !isOwned) return false;
      if (ownershipFilter === 'Missing' && isOwned) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortMethod === 'Color') {
        const colorCompare = (a.colorGroup || '').localeCompare(b.colorGroup || '');
        if (colorCompare !== 0) return colorCompare;
      }
      if (sortMethod === 'Type') {
        const typeCompare = (a.type || '').localeCompare(b.type || '');
        if (typeCompare !== 0) return typeCompare;
      }
      return a.name.localeCompare(b.name);
    });

  /* ── Navigation & Browser History ───────────────── */
  // 1. Listen for the physical browser back button
  useEffect(() => {
    // Set baseline state so the browser has something to pop back to
    window.history.replaceState({ view: 'nexus', history: [] }, '');

    const handlePopState = (event) => {
      if (event.state) {
        setCurrentView(event.state.view);
        setHistory(event.state.history);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectPaint = (paint) => {
    let nextHistory = [...history];
    const isAlreadySelected = nextHistory.some(h => h.id === paint.id);

    if (paint.type === 'Shade' && isAlreadySelected) {
      nextHistory = nextHistory.filter(p => p.id !== paint.id);
    } else {
      if (paint.type === 'Shade' && currentSelected?.shades) {
        nextHistory = nextHistory.filter(p => !currentSelected.shades.includes(p.id));
      }
      if (nextHistory.length > 0 && nextHistory[nextHistory.length - 1].id === paint.id) {
        // Do nothing if clicking the exact same paint
      } else {
        nextHistory = [...nextHistory, paint];
      }
    }

    setHistory(nextHistory);
    setCurrentView('nexus'); // Selecting a paint implicitly moves you to nexus view
    window.history.pushState({ view: 'nexus', history: nextHistory }, '');
    setSearchTerm('');
  }

  const handleSwitchView = (view) => {
    if (view === currentView) return;
    setCurrentView(view);
    window.history.pushState({ view, history }, '');
  }

  const goHome = () => {
    setHistory([]);
    setCurrentView('nexus');
    window.history.pushState({ view: 'nexus', history: [] }, '');
    setSearchTerm('');
  }

  const goBack = () => {
    // Trigger native browser back, which keeps our popstate completely synced!
    window.history.back();
  }

  const navigateToHistoryIndex = (index) => {
    const nextHistory = history.slice(0, index + 1);
    setHistory(nextHistory);
    setCurrentView('nexus');
    window.history.pushState({ view: 'nexus', history: nextHistory }, '');
  }

  /* ── Recipe Grouping ─────────────────────────── */
  const addPathToRecipe = () => {
    if (history.length === 0) return
    const groupName = `${history[0].name} ${history.length > 1 ? `→ ${history[history.length - 1].name}` : ''}`
    const newGroup = { id: crypto.randomUUID(), name: groupName, paints: [...history] }
    setRecipeGroups(prev => [...prev, newGroup])
  }

  const addToRecipe = (paint) => {
    const newGroup = { id: crypto.randomUUID(), name: paint.name, paints: [paint] }
    setRecipeGroups(prev => [...prev, newGroup])
  }

  const loadRecipeGroup = (group) => setHistory(group.paints)
  const deleteRecipeGroup = (id) => setRecipeGroups(prev => prev.filter(g => g.id !== id))

  /* ── Export & Collection Toggles ──────────────────────── */
  const toggleOwnedPaint = (paintId) => {
    setOwnedPaints(prev => prev.includes(paintId) ? prev.filter(id => id !== paintId) : [...prev, paintId])
  }

  const [copiedAction, setCopiedAction] = useState(null)

  const exportRecipes = () => {
    if (recipeGroups.length === 0) return;
    let exportText = "📋 Citadel Paints - Saved Recipes\n\n";
    recipeGroups.forEach((group, index) => {
      exportText += `${index + 1}. ${group.name}\n`;
      group.paints.forEach(p => { exportText += `   • ${p.name} (${p.type})\n`; });
      exportText += "\n";
    });
    navigator.clipboard.writeText(exportText.trim()).then(() => {
      setCopiedAction('recipe');
      setTimeout(() => setCopiedAction(null), 2000);
    });
  }

  const exportCollection = () => {
    if (gridPaints.length === 0) return;
    let exportText = `📋 Citadel Paints - ${ownershipFilter} Inventory\n\n`;
    gridPaints.forEach(p => {
      exportText += `[${ownedPaints.includes(p.id) ? 'x' : ' '}] ${p.name} (${p.type})\n`;
    });
    navigator.clipboard.writeText(exportText.trim()).then(() => {
      setCopiedAction('collection');
      setTimeout(() => setCopiedAction(null), 2000);
    });
  }

  /* ── Selection Logic ───────────────── */
  let currentSelected = history.length > 0 ? history[history.length - 1] : null;

  if (history.length > 1) {
    const lastPaint = history[history.length - 1];
    const prevPaint = history[history.length - 2];
    if (lastPaint.type === 'Shade' && prevPaint.shades?.includes(lastPaint.id)) {
      currentSelected = prevPaint;
    }
  }

  const reverseParents = currentSelected
    ? paintData.paints.filter(p =>
      p.highlights?.some(h => h.id === currentSelected.id) ||
      p.shades?.includes(currentSelected.id)
    )
    : [];

  /* ── UI Components ───────────────────────── */
  const renderControlCenter = () => (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 mb-6 bg-bg-secondary/30 p-4 rounded-xl border border-glass-border/40 animate-in">
      {/* Sort Group */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold ml-1">Sort By</span>
        <div className="flex gap-1 bg-bg-tertiary/50 p-1 rounded-lg border border-glass-border/30 w-fit">
          {['Alpha', 'Color', 'Type'].map(method => (
            <button
              key={method}
              onClick={() => setSortMethod(method)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${sortMethod === method ? 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30' : 'text-text-muted hover:text-white border border-transparent'}`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Group */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold ml-1">Filter By</span>
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={ownershipFilter}
            onChange={(e) => setOwnershipFilter(e.target.value)}
            className="bg-bg-tertiary border border-glass-border/50 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-accent-primary shadow-sm cursor-pointer"
          >
            <option value="All">All Inventory</option>
            <option value="Owned">Owned Only</option>
            <option value="Missing">Missing Only</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-bg-tertiary border border-glass-border/50 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-accent-primary shadow-sm cursor-pointer"
          >
            {DYNAMIC_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </select>

          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="bg-bg-tertiary border border-glass-border/50 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-accent-primary shadow-sm cursor-pointer"
          >
            {DYNAMIC_COLORS.map(c => <option key={c} value={c}>{c === 'All' ? 'All Colors' : c}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto flex flex-col">

      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-4xl md:text-5xl mb-2 text-gradient font-black">Paint Nexus</h1>
        <p className="text-text-secondary text-base">Map your painting journey from the beginning.</p>
      </header>

      {/* Breadcrumb Bar */}
      <nav className="glass px-4 py-3 mb-6 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={goHome}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${currentView === 'nexus' && !currentSelected ? 'bg-accent-primary/20 text-accent-primary' : 'text-text-muted hover:text-white hover:bg-bg-tertiary'}`}
        >
          <Home size={15} />
          Nexus
        </button>

        <button
          onClick={() => handleSwitchView('collection')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${currentView === 'collection' ? 'bg-amber-500/20 text-amber-400' : 'text-text-muted hover:text-white hover:bg-bg-tertiary'}`}
        >
          <Package size={15} />
          My Collection
        </button>

        <div className="w-px h-5 bg-glass-border mx-1 flex-shrink-0" />

        {history.length > 0 && (
          <button
            onClick={goBack}
            className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-sm font-semibold text-text-muted hover:text-white hover:bg-bg-tertiary transition-colors flex-shrink-0"
            title="Go back one step"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        )}

        <div className="w-px h-5 bg-glass-border mx-1 flex-shrink-0" />

        {history.map((paint, i) => (
          <div key={`${paint.id}-${i}`} className="flex items-center gap-1.5 flex-shrink-0 animate-in">
            {i > 0 && <ChevronRight size={14} className="text-text-muted" />}
            <button
              onClick={() => navigateToHistoryIndex(i)}
              className={`flex items-center gap-3 px-2.5 py-1 rounded-lg text-sm font-semibold truncate max-w-[140px] transition-colors ${i === history.length - 1
                ? 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30'
                : 'text-text-secondary hover:text-white hover:bg-bg-tertiary'
                }`}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: paint.hex }} />
              <span className="truncate">{paint.name}</span>
            </button>
          </div>
        ))}
      </nav>

      {currentView === 'collection' ? (
        /* ── My Collection View ──────────────────────── */
        <div className="glass p-6 animate-in h-full flex flex-col max-w-5xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-bg-secondary/30 p-4 rounded-xl border border-glass-border/40">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2 text-amber-400">
                <Package size={24} />
                My Paint Inventory
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                {ownedPaints.length} paints in your collection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">

              {/* Export Button */}
              <button
                onClick={exportCollection}
                className="text-xs flex items-center gap-1.5 font-bold px-3 py-2 rounded-lg bg-bg-tertiary/50 text-text-secondary hover:text-white hover:bg-bg-tertiary border border-glass-border/30 transition-all shadow-sm"
              >
                {copiedAction === 'collection' ? (
                  <><Check size={14} className="text-green-400" /> Copied List!</>
                ) : (
                  <><Copy size={14} /> Export List</>
                )}
              </button>

              <button
                onClick={() => setIsEditingCollection(!isEditingCollection)}
                className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg ${isEditingCollection ? 'bg-accent-primary text-white' : 'bg-bg-tertiary text-text-muted hover:text-white border border-glass-border'}`}
              >
                <Edit3 size={16} />
                {isEditingCollection ? 'Done Editing' : 'Edit Collection'}
              </button>
            </div>
          </div>

          {/* Injecting our Unified Control Center! */}
          {renderControlCenter()}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {gridPaints.map(paint => {
              const isOwned = ownedPaints.includes(paint.id);

              return (
                <div
                  key={paint.id}
                  className={`relative group ${isEditingCollection ? 'cursor-pointer' : ''}`}
                  onClick={() => isEditingCollection && toggleOwnedPaint(paint.id)}
                >
                  <div className={`transition-all ${!isOwned ? 'opacity-40 grayscale' : ''} ${isEditingCollection && !isOwned ? 'hover:opacity-80 hover:grayscale-[50%]' : ''}`}>
                    <PaintTile paint={paint} showType isOwned={isOwned} />
                  </div>

                  {isEditingCollection && isOwned && (
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 bg-green-500 text-white p-1 rounded-full shadow-lg border-2 border-green-400 animate-in zoom-in">
                      <Sparkles size={14} />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Empty states reflect our new master global filter */}
            {ownershipFilter === 'Owned' && gridPaints.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-50 text-center">
                <Package size={48} className="mb-4" />
                <p className="text-lg font-bold">No paints found.</p>
                <p className="text-sm mt-1">Switch to <strong>'All Inventory'</strong> to view the full catalog, or adjust your Color/Type filters.</p>
              </div>
            )}

            {ownershipFilter === 'Missing' && gridPaints.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-50 text-center text-green-400">
                <Sparkles size={48} className="mb-4" />
                <p className="text-lg font-bold">You own everything in this filter!</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Main Grid (Nexus View) ──────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">

          {/* ── Left Sidebar ────────────────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* Search */}
            <div className="glass p-5 relative z-20">
              <h2 className="text-lg mb-3 flex items-center gap-2 font-bold">
                <Search size={18} className="text-accent-primary" />
                Find Paint
              </h2>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredPaints.length > 0) {
                      handleSelectPaint(filteredPaints[0]);
                    }
                  }}
                  placeholder="Search by name, color, type, or description…"
                  className="w-full bg-bg-secondary border border-glass-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary transition-all text-sm font-medium"
                />
                {searchTerm && (
                  <div className="absolute top-full left-0 right-0 bg-bg-secondary/95 backdrop-blur-xl border border-glass-border rounded-lg mt-1.5 z-50 max-h-72 overflow-y-auto shadow-2xl animate-in">
                    {filteredPaints.map(paint => (
                      <button
                        key={paint.id}
                        onClick={() => handleSelectPaint(paint)}
                        className="w-full text-left px-3 py-2.5 hover:bg-bg-tertiary flex items-center gap-5 transition-colors border-b border-glass-border/30 last:border-none group"
                      >
                        <div className="w-7 h-7 rounded-md flex-shrink-0 border border-white/10 swatch-tile-bg" style={{ backgroundColor: paint.hex }} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-white group-hover:text-accent-primary transition-colors truncate">{paint.name}</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">{paint.type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Paint Profile */}
            {currentSelected && (
              <div className="glass p-5 animate-in relative overflow-hidden">

                {/* Subtle color glow based on hex */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: currentSelected.hex }}
                />

                <div className="flex items-start gap-5 mb-5 relative z-10">
                  <div
                    className="w-20 h-20 rounded-xl shadow-lg border-2 border-glass-border flex-shrink-0 swatch-tile-bg"
                    style={{ backgroundColor: currentSelected.hex }}
                  />
                  <div className="flex flex-col min-w-0 flex-grow">

                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-black text-white leading-tight pr-2">{currentSelected.name}</h3>
                      {ownedPaints.includes(currentSelected.id) && (
                        <div className="flex items-center gap-1 bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm flex-shrink-0 border border-amber-500/30">
                          <Package size={10} /> Owned
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5 mb-2.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary rounded uppercase font-bold tracking-wider text-text-secondary border border-glass-border/30">{currentSelected.type}</span>
                      <span className="text-text-muted text-xs font-medium">{currentSelected.colorGroup}</span>
                    </div>

                    {currentSelected.description && (
                      <p className="text-sm text-text-secondary italic leading-snug">
                        "{currentSelected.description}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 relative z-10">
                  <button
                    onClick={() => addToRecipe(currentSelected)}
                    className="flex-1 bg-accent-gradient py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all text-sm text-white shadow"
                  >
                    + Add Paint
                  </button>
                  {history.length > 1 && (
                    <button
                      onClick={addPathToRecipe}
                      className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30 hover:bg-accent-secondary/35 transition-colors"
                      title="Add entire navigation path to recipe"
                    >
                      + Add Recipe
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Recipe */}
            <div className="glass p-5 flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Layers size={18} className="text-green-400" />
                  Recipe
                  {recipeGroups.length > 0 && (
                    <span className="text-[10px] bg-green-400/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">{recipeGroups.length}</span>
                  )}
                </h2>

                {recipeGroups.length > 0 && (
                  <button
                    onClick={exportRecipes}
                    className="text-xs flex items-center gap-1.5 font-bold px-2 py-1.5 rounded-md bg-bg-tertiary/50 text-text-secondary hover:text-white hover:bg-bg-tertiary transition-all"
                  >
                    {copiedAction === 'recipe' ? (
                      <><Check size={14} className="text-green-400" /> Copied!</>
                    ) : (
                      <><Copy size={14} /> Export</>
                    )}
                  </button>
                )}
              </div>
              {recipeGroups.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {recipeGroups.map((group) => (
                    <div key={group.id} className="glass p-3 rounded-xl border border-glass-border/40 bg-bg-secondary/30 group animate-in">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-black text-white uppercase tracking-tight truncate flex-grow">
                          {group.name}
                        </h3>
                        <div className="flex gap-1.5 ml-2">
                          <button
                            onClick={() => loadRecipeGroup(group)}
                            title="Load Path"
                            className="w-7 h-7 bg-accent-primary/20 hover:bg-accent-primary/40 text-accent-primary rounded flex items-center justify-center transition-colors"
                          >
                            <FolderOpen size={14} />
                          </button>
                          <button
                            onClick={() => deleteRecipeGroup(group.id)}
                            title="Delete Recipe"
                            className="w-7 h-7 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-start gap-1 pt-3 border-t border-glass-border/20 mt-2">
                        {group.paints.map((paint, pIdx) => (
                          <div key={`${group.id}-${pIdx}`} className="flex items-start gap-1">

                            {/* Individual Paint Step */}
                            <div className="flex flex-col items-center w-14 gap-1.5 group/step cursor-help" title={`${paint.name} (${paint.type})`}>
                              <div className="relative">
                                <div
                                  className="w-7 h-7 rounded-full shadow-md border-2 border-bg-secondary transition-transform group-hover/step:scale-110"
                                  style={{ backgroundColor: paint.hex }}
                                />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-bg-tertiary rounded-full flex items-center justify-center text-[8px] font-black border border-glass-border shadow-sm text-white">
                                  {paint.type.charAt(0)}
                                </div>
                              </div>
                              <span className="text-[9px] text-center leading-tight text-text-secondary font-medium line-clamp-2 px-0.5">
                                {paint.name}
                              </span>
                            </div>

                            {/* Arrow separating steps */}
                            {pIdx < group.paints.length - 1 && (
                              <div className="h-7 flex items-center">
                                <ChevronRight size={14} className="text-text-muted/40" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-center opacity-40 py-10">
                  <p className="text-xs font-medium">Select paints and click '+ Add Recipe'</p>
                  <p className="text-[10px] mt-1 italic">Save your selection paths as groups</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Main Content Area ───────────────────── */}
          <div className="lg:col-span-2">
            {currentSelected ? (
              <div className="flex flex-col gap-5 animate-in">

                {/* Special Logic Banner */}
                {currentSelected.specialLogic && (
                  <div className="p-3.5 bg-accent-primary/10 border border-accent-primary/30 rounded-xl flex items-start gap-3">
                    <Info size={18} className="text-accent-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-blue-100">{currentSelected.specialLogic}</p>
                  </div>
                )}

                {/* Recommended Next Steps */}
                <section className="glass p-6">
                  <h2 className="text-lg font-black flex items-center gap-2 mb-6">
                    <Droplets size={20} className="text-accent-secondary" />
                    Recommended Next Steps
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-glass-border/30" />

                    {/* Shading column */}
                    <div>
                      <h4 className="text-xs uppercase tracking-[0.2em] text-text-muted font-bold mb-3 flex items-center gap-2">
                        <div className="w-1 h-3.5 bg-accent-secondary rounded-full" />
                        Depth (Washes)
                      </h4>
                      <div className="flex flex-col gap-2.5">
                        {currentSelected.shades?.length > 0 ? (
                          currentSelected.shades.map(id => {
                            const paint = paintData.paints.find(p => p.id === id)
                            const isSelected = history.some(h => h.id === id);

                            return (
                              <div key={id} className="relative group cursor-pointer">
                                <div className={`transition-all ${isSelected ? 'opacity-80 grayscale-[30%] group-hover:grayscale-0 group-hover:opacity-100' : ''}`}>
                                  <PaintTile paint={paint} showType isOwned={ownedPaints.includes(paint.id)} onClick={() => handleSelectPaint(paint)} />
                                </div>

                                {/* The Visual Tick */}
                                {isSelected && (
                                  <div className="absolute top-1/2 right-4 -translate-y-1/2 bg-green-500/20 text-green-400 p-1.5 rounded-full border border-green-500/30 shadow-lg backdrop-blur-sm animate-in zoom-in group-hover:bg-red-500/20 group-hover:text-red-400 group-hover:border-red-500/30 transition-colors pointer-events-none">
                                    <Sparkles size={16} className="group-hover:hidden" />
                                    <Trash2 size={16} className="hidden group-hover:block" />
                                  </div>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <div className="border border-dashed border-glass-border/40 rounded-xl p-4 text-center">
                            <p className="text-xs text-text-muted font-medium">
                              {currentSelected.type === 'Contrast' ? 'Contrast paints provide inherent shading.' : 'No recommendations.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Highlights column */}
                    <div>
                      <h4 className="text-xs uppercase tracking-[0.2em] text-text-muted font-bold mb-3 flex items-center gap-2">
                        <div className="w-1 h-3.5 bg-accent-primary rounded-full" />
                        Highlights (Layers)
                      </h4>
                      <div className="flex flex-col gap-2.5">
                        {currentSelected.highlights?.length > 0 ? (
                          currentSelected.highlights.map(h => {
                            const paint = paintData.paints.find(p => p.id === h.id)
                            return (
                              <PaintTile key={h.id} paint={paint} descriptor={h.descriptor} showType isOwned={ownedPaints.includes(paint.id)} onClick={() => paint && handleSelectPaint(paint)} />
                            )
                          })
                        ) : (
                          <div className="border border-dashed border-glass-border/40 rounded-xl p-4 text-center">
                            <p className="text-xs text-text-muted font-medium">Final highlight stage reached.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Reverse Highlights */}
                <section className="glass p-6 border-t-4 border-t-accent-secondary/40">
                  <h2 className="text-lg font-black flex items-center gap-2 mb-5">
                    <Layers size={20} className="text-accent-secondary" />
                    Used to Highlight…
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {reverseParents.length > 0 ? (
                      reverseParents.map(p => (
                        <PaintTile key={p.id} paint={p} showType isOwned={ownedPaints.includes(p.id)} onClick={() => handleSelectPaint(p)} />
                      ))
                    ) : (
                      <div className="col-span-full border border-dashed border-glass-border/40 rounded-xl p-5 text-center">
                        <p className="text-sm text-text-muted font-medium">This is typically a starting point or base layer.</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Cross-Range Analyst */}
                {currentSelected.crossRange && (
                  <section className="glass p-6 border border-amber-500/20 bg-amber-950/20">
                    <h2 className="text-lg font-black flex items-center gap-2 mb-4">
                      <Sparkles size={20} className="text-amber-400" />
                      Cross-Range Color Analyst
                    </h2>
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-xl swatch-tile-bg flex-shrink-0 border border-amber-500/30" style={{ backgroundColor: currentSelected.hex }} />
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-gray-300">
                          Closest match: <span className="text-white font-bold">{currentSelected.crossRange.match}</span>
                        </p>
                        <p className="text-xs text-text-muted">
                          Range: <span className="text-text-secondary font-semibold">{currentSelected.crossRange.range}</span>
                        </p>
                        <p className="text-sm mt-1">
                          Derived descriptor: <span className="text-amber-400 font-black italic text-base">{currentSelected.crossRange.derivedDescriptor}</span>
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            ) : (
              /* ── Home / Catalog ── */
              <div className="glass p-6 animate-in h-full flex flex-col">

                {/* Hero illustration */}
                <div className="flex items-center gap-5 mb-8 p-5 rounded-xl bg-gradient-to-r from-accent-primary/10 via-accent-secondary/10 to-transparent border border-glass-border/30">
                  <div className="w-16 h-16 rounded-2xl bg-accent-gradient flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Paintbrush size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Start Your Journey</h3>
                    <p className="text-sm text-text-secondary mt-0.5">Select a base coat or contrast paint below to map your complete painting recipe.</p>
                  </div>
                </div>

                {/* Injecting our Unified Control Center! */}
                {renderControlCenter()}

                {/* Paint Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {gridPaints.map(paint => (
                    <PaintTile
                      key={paint.id}
                      paint={paint}
                      showType
                      showColorGroup={sortMethod === 'Color' || sortMethod === 'Type'}
                      isOwned={ownedPaints.includes(paint.id)}
                      onClick={() => handleSelectPaint(paint)}
                    />
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}