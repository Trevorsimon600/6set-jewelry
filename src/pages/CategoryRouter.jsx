import CategoryPage from './CategoryPage'

// ============================================================
// CATEGORY ROUTER
// ============================================================
//
// Every category — earrings, necklaces, bracelets, rings, and
// anything added later from the admin — goes through the same
// generic CategoryPage. It looks up the category by slug itself
// (via useParams) and already handles "not found" on its own,
// so there's nothing left for this component to decide.
//
// Kept as its own file/route target rather than pointing
// App.jsx straight at CategoryPage, in case a real per-category
// special case ever comes up again later.
//
// ============================================================

function CategoryRouter() {
  return <CategoryPage />
}

export default CategoryRouter