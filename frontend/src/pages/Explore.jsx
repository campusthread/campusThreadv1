import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Inbox, Package, Store, University } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SectionLoader from '../components/SectionLoader'
import NotificationToast from '../components/NotificationToast'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import { useGetBrandsQuery } from '../redux/slices/brandApiSlice'
import { useGetProductsQuery } from '../redux/slices/productApiSlice'

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/explore', label: 'Explore' },
  { path: '/cart', label: 'Cart' },
  { path: '/favorites', label: 'Favorites' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Explore() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { notifications } = useNotification()
  const navigate = useNavigate()

  // Fetch brands and products from API instead of localStorage
  const { data: brandsData = [], isLoading: brandsLoading } = useGetBrandsQuery()
  const { data: productsData = [], isLoading: productsLoading } = useGetProductsQuery()

  const [currentBrand, setCurrentBrand] = useState(null)

  const brandNamesFromBrands = Array.isArray(brandsData) ? brandsData.map((b) => b.name).filter(Boolean) : []
  const brandNamesFromProducts = Array.isArray(productsData)
    ? productsData.map((product) => product.brand).filter(Boolean)
    : []
  const safeBrands = Array.from(new Set([...brandNamesFromBrands, ...brandNamesFromProducts])).sort()
  const brandProducts = currentBrand ? productsData.filter((product) => product.brand === currentBrand) : []
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'
  const isLoading = brandsLoading || productsLoading

  useEffect(() => {
    if (safeBrands.length > 0 && !currentBrand) {
      setCurrentBrand(safeBrands[0])
    } else if (currentBrand && !safeBrands.includes(currentBrand)) {
      setCurrentBrand(safeBrands[0])
    }
  }, [safeBrands, currentBrand])

  return (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <Navbar links={NAV_LINKS} />
      <NotificationToast notifications={notifications} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {isLoading ? (
          <SectionLoader isDark={isDark} message="Loading brands and products…" />
        ) : (
          <>
            <section className="text-center">
              <p className={cx('mx-auto mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', isDark ? 'border-violet-300/20 bg-violet-300/10 text-violet-200' : 'border-violet-200 bg-violet-50 text-violet-700')}>
                <Store size={14} />
                Brand discovery
              </p>
              <h1 className="text-4xl font-black tracking-normal sm:text-5xl">
                Explore <span className="text-violet-700">Brands</span>
              </h1>
              <p className={cx('mx-auto mt-4 max-w-2xl text-base leading-7', mutedText)}>
                Discover products from campus brands, student stores, and independent vendors.
              </p>
            </section>

            <section className={cx('mt-10 rounded-2xl border p-5 shadow-lg', surfaceClass)}>
              <label className="text-sm font-black uppercase tracking-wide">Filter by Brand</label>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {safeBrands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setCurrentBrand(brand)}
                    className={cx(
                      'shrink-0 rounded-full border px-5 py-2 text-sm font-bold uppercase tracking-wide transition',
                      currentBrand === brand
                        ? 'border-violet-700 bg-violet-700 text-white'
                        : isDark
                          ? 'border-violet-300/40 text-violet-100 hover:bg-violet-300/10'
                          : 'border-violet-700 text-violet-700 hover:bg-violet-50',
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-black tracking-normal">
                    <Building2 className="text-violet-700" size={22} />
                    {currentBrand || 'Brand'} Products
                  </h2>
                  <p className={cx('mt-1 text-sm', mutedText)}>Browse this brand’s current campus catalog.</p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-violet-700 px-4 py-2 text-sm font-bold text-white">
                  {brandProducts.length} {brandProducts.length === 1 ? 'Product' : 'Products'}
                </span>
              </div>

              {brandProducts.length === 0 ? (
                <div className={cx('rounded-2xl border-2 border-dashed p-12 text-center', isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
                  <Inbox size={42} className="mx-auto mb-4" />
                  <h3 className="text-xl font-black">No Products Found</h3>
                  <p className="mt-2">Try selecting another brand or check back later.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {brandProducts.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} isDark={isDark} surfaceClass={surfaceClass} mutedText={mutedText} onView={() => navigate(`/product/${product._id || product.id}`)} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

function ProductCard({ product, isDark, surfaceClass, mutedText, onView }) {
  const media = product.images?.[0]?.url || product.media
  const video = product.videos?.[0]?.url || (product.mediaType?.startsWith('video/') ? product.media : '')

  return (
    <article className={cx('group overflow-hidden rounded-xl border shadow-lg transition hover:-translate-y-1 hover:shadow-xl', surfaceClass)}>
      <div className={cx('relative h-48 md:h-56 lg:h-64 w-full overflow-hidden', isDark ? 'bg-slate-950' : 'bg-slate-100')}>
        {video ? (
          <video className="h-full w-full object-cover" controls>
            <source src={video} />
          </video>
        ) : media ? (
          <img src={media} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" alt={product.name} />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <Package size={40} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-wide text-violet-700">{product.category || 'Uncategorized'}</p>
        <h3 className="mt-2 line-clamp-2 text-lg font-black tracking-normal">{product.name}</h3>
        <div className={cx('mt-3 grid gap-2 text-sm', mutedText)}>
          <span className="flex items-center gap-2"><Store size={15} /> {product.brand || 'N/A'}</span>
          <span className="flex items-center gap-2"><University size={15} /> {product.university || 'N/A'}</span>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xl font-black text-violet-700">NGN {parseFloat(product.price || 0).toLocaleString()}</span>
          <button type="button" className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-violet-800" onClick={onView}>
            View
          </button>
        </div>
      </div>
    </article>
  )
}
