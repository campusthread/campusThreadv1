import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Grid2X2,
  Heart,
  Inbox,
  Package,
  RotateCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  User,
} from 'lucide-react'
import Carousel from '../components/Carousel'
import Navbar from '../components/Navbar'
import NotificationToast from '../components/NotificationToast'
import SectionLoader from '../components/SectionLoader'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import { useGetProductsQuery } from '../redux/slices/productApiSlice'
import { useGetBrandsQuery } from '../redux/slices/brandApiSlice'
import { useGetCategoriesQuery } from '../redux/slices/categoryApiSlice'
import { NIGERIAN_UNIVERSITIES } from '../utils/constants'

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/explore', label: 'Explore Brands' },
  { path: '/cart', label: 'Cart' },
  { path: '/favorites', label: 'Favorites' },
]

const viewTabs = [
  { key: 'all', icon: Grid2X2, label: 'All Products' },
  { key: 'universities', icon: Building2, label: 'By University' },
  { key: 'brands', icon: User, label: 'By Brand' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Shop() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { notifications } = useNotification()

  // Fetch from API instead of localStorage
  const { data: productsData = [], error: productsError, isFetching: productsFetching } = useGetProductsQuery({ limit: 50 })
  const { data: brandsData = [], isFetching: brandsFetching } = useGetBrandsQuery()
  const { data: categoriesData = [], isFetching: categoriesFetching } = useGetCategoriesQuery()

  const allProducts = useMemo(() => Array.isArray(productsData) ? productsData : [], [productsData])
  const brands = useMemo(() => Array.isArray(brandsData) ? brandsData.map(b => b.name) : [], [brandsData])
  const categories = useMemo(() => Array.isArray(categoriesData) ? categoriesData.map(c => c.name) : [], [categoriesData])

  const filtered = useMemo(() => {
    const sorted = [...allProducts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return sorted
  }, [allProducts])

  const [currentFiltered, setCurrentFiltered] = useState([])
  const [activeView, setActiveView] = useState('all')
  const [backendError, setBackendError] = useState(null)

  const [uniFilter, setUniFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [priceFilter, setPriceFilter] = useState('')

  const safeCategories = useMemo(() => Array.isArray(categories) && categories.length > 0 ? categories : [], [categories])
  const safeBrands = useMemo(() => Array.isArray(brands) ? brands : [], [brands])
  const filtersLoading = brandsFetching || categoriesFetching

  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark
    ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30'
    : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'
  const inputClass = cx(
    'mt-2 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20',
    isDark
      ? 'border-white/10 bg-slate-950 text-slate-100 placeholder:text-slate-500'
      : 'border-slate-200 bg-white text-slate-950 placeholder:text-slate-400',
  )

  const stats = useMemo(() => {
    const universities = new Set(allProducts.map((product) => product.university).filter(Boolean)).size
    const productBrands = new Set(allProducts.map((product) => product.brand).filter(Boolean)).size

    return [
      { label: 'Products', value: allProducts.length },
      { label: 'Universities', value: universities },
      { label: 'Brands', value: productBrands },
    ]
  }, [allProducts])

  useEffect(() => {
    if (productsError) {
      setBackendError(productsError?.data?.message || productsError?.error || 'Unable to load marketplace products')
    }
  }, [productsError])

  const applyFilters = () => {
    const maxPrice = parseFloat(priceFilter) || Infinity
    const result = allProducts.filter(
      (product) =>
        (!uniFilter || product.university === uniFilter) &&
        (!brandFilter || product.brand === brandFilter) &&
        (!catFilter || product.category === catFilter) &&
        (product.price || 0) <= maxPrice,
    )
    setCurrentFiltered(result)
    setActiveView('all')
  }

  const resetFilters = () => {
    setUniFilter('')
    setBrandFilter('')
    setCatFilter('')
    setPriceFilter('')
    setCurrentFiltered([])
    setActiveView('all')
  }

  const renderProducts = (products) =>
    products.length === 0 ? (
      <EmptyState isDark={isDark} />
    ) : (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id || product._id}
            product={product}
            isDark={isDark}
            surfaceClass={surfaceClass}
            mutedText={mutedText}
            onView={() => navigate(`/product/${product._id || product.id}`)}
          />
        ))}
      </div>
    )

  const renderByGroup = (groupFn, Icon) => {
    const productsToUse = currentFiltered.length > 0 ? currentFiltered : filtered
    const groups = [...new Set(productsToUse.map(groupFn))].filter(Boolean)
    if (groups.length === 0) return <EmptyState isDark={isDark} />

    return groups.map((group) => (
      <section key={group} className="mb-12">
        <h2 className="mb-5 flex items-center gap-3 text-2xl font-black tracking-normal">
          <span className={cx('flex h-10 w-10 items-center justify-center rounded-lg', isDark ? 'bg-violet-300/10 text-violet-200' : 'bg-violet-50 text-violet-700')}>
            <Icon size={20} />
          </span>
          {group}
        </h2>
        {renderProducts(productsToUse.filter((product) => groupFn(product) === group))}
      </section>
    ))
  }

  return (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <NotificationToast notifications={notifications} />
      <Navbar links={navLinks} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 border-b border-slate-200/70 pb-8 dark:border-white/10 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className={cx('mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', isDark ? 'border-violet-300/20 bg-violet-300/10 text-violet-200' : 'border-violet-200 bg-violet-50 text-violet-700')}>
              <ShoppingBag size={14} />
              Campus marketplace
            </p>
            <h1 className="text-4xl font-black tracking-normal sm:text-5xl">Shop CampusThread</h1>
            <p className={cx('mt-4 max-w-2xl text-base leading-7', mutedText)}>
              Browse products from vendors across different universities and brands. Filter by campus, brand, category, or budget.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className={cx('rounded-xl border p-4 text-center shadow-sm', surfaceClass)}>
                <strong className="block text-2xl font-black text-violet-700">{stat.value}</strong>
                <span className={cx('mt-1 block text-xs font-semibold', mutedText)}>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {backendError && (
          <div className={cx('mt-6 rounded-xl border px-4 py-3 text-sm', isDark ? 'border-amber-300/20 bg-amber-300/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-800')}>
            {backendError}. Showing locally cached products when available.
          </div>
        )}

        <section className={cx('mt-8 rounded-2xl border p-5 shadow-lg', surfaceClass)}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black tracking-normal">
                <SlidersHorizontal size={20} className="text-violet-700" />
                Filter Products
              </h2>
              <p className={cx('mt-1 text-sm', mutedText)}>
                {productsFetching ? 'Refreshing product list...' : `${filtered.length} products visible`}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtersLoading ? (
              <div className="col-span-4">
                <SectionLoader message="Loading filters..." isDark={isDark} />
              </div>
            ) : (
              <>
                <FilterField label="University" isDark={isDark}>
                  <select value={uniFilter} onChange={(event) => setUniFilter(event.target.value)} disabled={filtersLoading} className={inputClass}>
                    <option value="">All Universities</option>
                    {NIGERIAN_UNIVERSITIES.map((university) => (
                      <option key={university} value={university}>
                        {university}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Brand" isDark={isDark}>
                  <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} disabled={filtersLoading} className={inputClass}>
                    <option value="">All Brands</option>
                    {safeBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Category" isDark={isDark}>
                  <select value={catFilter} onChange={(event) => setCatFilter(event.target.value)} disabled={filtersLoading} className={inputClass}>
                    <option value="">All Categories</option>
                    {safeCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Max Price (NGN)" isDark={isDark}>
                  <input
                    type="number"
                    placeholder="e.g., 50000"
                    value={priceFilter}
                    onChange={(event) => setPriceFilter(event.target.value)}
                    min="0"
                    disabled={filtersLoading}
                    className={inputClass}
                  />
                </FilterField>
              </>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={applyFilters} disabled={productsFetching} className={cx('inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition', productsFetching ? 'bg-violet-500 cursor-not-allowed' : 'bg-violet-700 hover:bg-violet-800')}>
              <Search size={16} />
              Apply Filters
            </button>
            <button type="button" onClick={resetFilters} disabled={productsFetching} className={cx('inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition', productsFetching ? 'cursor-not-allowed opacity-70' : isDark ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-100')}>
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </section>

        <section className="mt-8">
          <div className={cx('mb-6 flex flex-wrap gap-2 border-b pb-4', isDark ? 'border-white/10' : 'border-slate-200')}>
            {viewTabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveView(key)}
                className={cx(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition',
                  activeView === key
                    ? 'bg-violet-700 text-white'
                    : isDark
                      ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {activeView === 'all' && (productsFetching && allProducts.length === 0 ? <SectionLoader message="Loading products..." isDark={isDark} /> : renderProducts(currentFiltered.length > 0 ? currentFiltered : filtered))}
          {activeView === 'universities' && renderByGroup((product) => product.university, Building2)}
          {activeView === 'brands' && renderByGroup((product) => product.brand, User)}
        </section>
      </main>

      <footer className={cx('mt-12 border-t px-4 py-8 text-center text-sm sm:px-6 lg:px-8', isDark ? 'border-white/10 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-500')}>
        &copy; 2024 CampusThread. All rights reserved.
      </footer>
    </div>
  )
}

function FilterField({ label, isDark, children }) {
  return (
    <label className="block">
      <span className={cx('text-sm font-bold', isDark ? 'text-slate-200' : 'text-slate-700')}>{label}</span>
      {children}
    </label>
  )
}

function ProductCard({ product, isDark, surfaceClass, mutedText, onView }) {
  const imageSlides = product.images?.length ? product.images.slice(0, 4) : []
  const videoUrl = product.videos?.[0]?.url
  const fallbackImage = product.images?.[0]?.url || product.media

  return (
    <article className={cx('group flex overflow-hidden rounded-xl border shadow-lg transition hover:-translate-y-1 hover:shadow-xl', surfaceClass)}>
      <div className="flex w-full flex-col">
        <div className={cx('relative h-48 md:h-56 lg:h-64 w-full overflow-hidden', isDark ? 'bg-slate-950' : 'bg-slate-100')}>
          {videoUrl ? (
            <video className="h-full w-full object-cover" controls>
              <source src={videoUrl} />
            </video>
          ) : imageSlides.length > 1 ? (
            <Carousel images={imageSlides} interval={3000} className="h-full w-full" />
          ) : fallbackImage ? (
            <img src={fallbackImage} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" alt={product.name} />
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <Package size={42} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className={cx('text-xs font-black uppercase tracking-wide', isDark ? 'text-violet-200' : 'text-violet-700')}>{product.category || 'Uncategorized'}</p>
          <h3 className="mt-2 line-clamp-2 text-lg font-black tracking-normal">{product.name}</h3>
          <div className={cx('mt-3 grid gap-2 text-sm', mutedText)}>
            <span className="flex items-center gap-2">
              <Building2 size={15} />
              {product.university || 'No campus listed'}
            </span>
            <span className="flex items-center gap-2">
              <Store size={15} />
              {product.brand || 'No brand listed'}
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="text-xl font-black text-violet-700">NGN {(product.price || 0).toLocaleString()}</span>
            <button type="button" onClick={onView} className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-violet-800">
              View
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function EmptyState({ isDark }) {
  return (
    <div className={cx('rounded-2xl border-2 border-dashed p-10 text-center', isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
      <Inbox size={36} className="mx-auto mb-3" />
      <p className="font-semibold">No products found. Try adjusting your filters or check back later.</p>
    </div>
  )
}
