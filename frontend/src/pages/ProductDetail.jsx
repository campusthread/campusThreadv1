import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  Heart,
  Menu,
  Moon,
  PackageOpen,
  ShoppingBag,
  ShoppingCart,
  Sun,
  X,
} from 'lucide-react'
import NotificationToast from '../components/NotificationToast'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../context/AuthContext'
import { useGetCartQuery, useUpdateCartMutation, useGetFavoritesQuery, useUpdateFavoritesMutation } from '../redux/slices/cartFavoritesApiSlice'
import { useGetProductQuery } from '../redux/slices/productApiSlice'
const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/explore', label: 'Explore Brands' },
  { path: '/cart', label: 'Cart' },
  { path: '/favorites', label: 'Favorites' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const { notifications, showNotification } = useNotification()
  const { user } = useAuth()
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const isAuthenticated = Boolean(user || token)
  const skipAuthQueries = !isAuthenticated
  const [menuOpen, setMenuOpen] = useState(false)
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { data: cartData = [] } = useGetCartQuery(undefined, { skip: !isAuthenticated })
  const { data: favoritesData = [] } = useGetFavoritesQuery(undefined, { skip: !isAuthenticated })
  const [updateCart] = useUpdateCartMutation()
  const [updateFavorites] = useUpdateFavoritesMutation()
  const { data: productResponse, error: productError, isFetching } = useGetProductQuery(id, {
    skip: !id,
  })

  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark
    ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30'
    : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'
  const navLinkClass = (path) =>
    cx(
      'rounded-md px-3 py-2 text-sm font-semibold transition',
      location.pathname === path
        ? 'bg-violet-700 text-white'
        : isDark
          ? 'text-slate-200 hover:bg-violet-400/10 hover:text-violet-200'
          : 'text-slate-700 hover:bg-violet-100 hover:text-violet-700',
    )

  useEffect(() => {
    setLoading(isFetching)

    if (productResponse?.product) {
      setProduct(productResponse.product)
      setError(null)
      return
    }

    if (productError) {
      setError('Could not load product details.')
      setLoading(false)
    }
  }, [id, isFetching, productError, productResponse])

  const cart = Array.isArray(cartData) ? cartData : []
  const favorites = Array.isArray(favoritesData) ? favoritesData : []
  const normalizeFavorites = (items) => {
    const ids = new Set()
    return (items || []).filter((item) => {
      const itemId = String(item._id || item.id || item.product || '')
      if (!itemId || ids.has(itemId)) return false
      ids.add(itemId)
      return true
    })
  }

  const activeFavorites = normalizeFavorites(favorites)
  const isInCart = cart.some((item) => String(item._id || item.id) === String(product?._id))
  const isInFavorites = activeFavorites.some((item) => String(item._id || item.id) === String(product?._id))

  const saveCart = async (updatedCart) => {
    if (!isAuthenticated) {
      showNotification('Please login to update your cart', 'info')
      return
    }
    await updateCart(updatedCart).unwrap()
  }

  const saveFavorites = async (updatedFavorites) => {
    if (!isAuthenticated) {
      showNotification('Please login to save favorites', 'info')
      return
    }
    const normalizedFavorites = normalizeFavorites(updatedFavorites)
    console.log('saveFavorites payload', normalizedFavorites)
    const response = await updateFavorites(normalizedFavorites).unwrap()
    console.log('saveFavorites response', response)
    return response
  }

  const handleAddToCart = async () => {
    if (!product) return

    const existing = cart.find((item) => String(item._id || item.id) === String(product._id))
    const updatedCart = existing
      ? cart.map((item) =>
        String(item._id || item.id) === String(product._id)
          ? { ...item, quantity: (item.quantity || 1) + quantity }
          : item,
      )
      : [
        ...cart,
        {
          _id: product._id,
          id: product._id,
          name: product.name,
          price: product.price,
          quantity,
          category: product.category,
          university: product.university,
          brand: product.brand,
          media: product.images?.[0]?.url || product.videos?.[0]?.url || '',
          mediaType: product.videos?.length ? 'video/mp4' : 'image/jpeg',
          addedAt: new Date().toISOString(),
        },
      ]

    try {
      await saveCart(updatedCart)
      showNotification(isInCart ? 'Cart quantity updated!' : 'Product added to cart', 'success')
    } catch (err) {
      showNotification(err?.data?.message || 'Failed to update cart', 'error')
    }
  }

  const handleToggleFavorite = async () => {
    if (!product) return

    if (!isAuthenticated) {
      showNotification('Please login to save favorites', 'info')
      return
    }

    const itemId = product._id
    const existingFavorite = activeFavorites.some((item) => String(item._id || item.id) === String(itemId))
    console.log('toggleFavorite', { itemId, existingFavorite, favoritesCount: activeFavorites.length })
    const updatedFavorites = existingFavorite
      ? activeFavorites.filter((item) => String(item._id || item.id) !== String(itemId))
      : [
        ...activeFavorites,
        {
          _id: product._id,
          id: product._id,
          name: product.name,
          price: product.price,
          category: product.category,
          university: product.university,
          brand: product.brand,
          media: product.images?.[0]?.url || product.videos?.[0]?.url || '',
          mediaType: product.videos?.length ? 'video/mp4' : 'image/jpeg',
          addedAt: new Date().toISOString(),
        },
      ]

    console.log('toggleFavorite payload', updatedFavorites)
    try {
      await saveFavorites(updatedFavorites)
      showNotification(existingFavorite ? 'Removed from favorites' : 'Added to favorites', existingFavorite ? 'info' : 'success')
    } catch (err) {
      showNotification(err?.data?.message || 'Failed to update favorites', 'error')
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    navigate('/checkout')
  }

  const shell = (children) => (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <NotificationToast notifications={notifications} />
      <Header
        isDark={isDark}
        menuOpen={menuOpen}
        navLinkClass={navLinkClass}
        setMenuOpen={setMenuOpen}
        toggleTheme={toggleTheme}
      />
      {children}
      <footer className={cx('mt-12 border-t px-4 py-8 text-center text-sm sm:px-6 lg:px-8', isDark ? 'border-white/10 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-500')}>
        &copy; 2024 CampusThread. All rights reserved.
      </footer>
    </div>
  )

  if (loading) {
    return shell(
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className={cx('rounded-2xl border p-8 shadow-lg', surfaceClass)}>
          <div className={cx('h-6 w-48 animate-pulse rounded', isDark ? 'bg-slate-800' : 'bg-slate-200')} />
          <div className={cx('mt-6 h-80 animate-pulse rounded-xl', isDark ? 'bg-slate-800' : 'bg-slate-200')} />
        </div>
      </main>,
    )
  }

  if (error || !product) {
    return shell(
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className={cx('rounded-2xl border border-dashed p-10 text-center shadow-lg', surfaceClass)}>
          <PackageOpen size={42} className={cx('mx-auto mb-4', isDark ? 'text-slate-500' : 'text-slate-400')} />
          <p className="text-lg font-bold">{error || 'Product not available'}</p>
          <Link to="/shop" className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800">
            <ArrowLeft size={16} />
            Back to Shop
          </Link>
        </div>
      </main>,
    )
  }

  return shell(
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200/70 pb-8 dark:border-white/10 sm:flex-row sm:items-end">
        <div>
          <p className={cx('mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', isDark ? 'border-violet-300/20 bg-violet-300/10 text-violet-200' : 'border-violet-200 bg-violet-50 text-violet-700')}>
            <ShoppingBag size={14} />
            Product Detail
          </p>
          <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{product.name}</h1>
          <p className={cx('mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold', mutedText)}>
            <span>{product.category || 'Uncategorized'}</span>
            <span aria-hidden="true">•</span>
            <span>{product.university || 'No campus listed'}</span>
          </p>
        </div>

        <Link to="/shop" className={cx('inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition hover:bg-slate-50 dark:hover:bg-slate-800', isDark ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-100')}>
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] items-start">
        <div className={cx('overflow-hidden rounded-xl border shadow-lg', surfaceClass)}>
          <div className={cx('relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br', isDark ? 'from-slate-900 to-slate-950' : 'from-slate-50 to-slate-100')}>
            {product.images?.[0]?.url ? (
              <img
                src={product.images[0].url}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : product.videos?.[0]?.url ? (
              <video controls className="h-full w-full object-cover">
                <source src={product.videos[0].url} />
              </video>
            ) : (
              <div className={cx('grid place-items-center p-6 text-center', mutedText)}>
                <PackageOpen size={40} />
                <p className="mt-2 text-sm font-medium">No media uploaded yet</p>
              </div>
            )}

            {/* Favorites Heart Button - Top Right Corner */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={cx(
                'absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95',
                isInFavorites
                  ? 'border-red-500 bg-red-500 text-white shadow-red-500/30 hover:bg-red-600 hover:border-red-600'
                  : isDark
                    ? 'border-white/20 bg-slate-900/80 text-white backdrop-blur-sm hover:bg-slate-800/90 hover:border-white/30'
                    : 'border-white/80 bg-white/90 text-slate-700 backdrop-blur-sm hover:bg-white hover:border-white'
              )}
              title={isInFavorites ? 'Remove from Favorites' : 'Add to Favorites'}
              aria-label={isInFavorites ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              <Heart
                size={18}
                className={cx(
                  'transition-colors duration-200',
                  isInFavorites ? 'fill-current text-white' : 'fill-none'
                )}
              />
            </button>

            {/* Optional: Add a subtle overlay for better text contrast if needed */}
            {product.images?.[0]?.url && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
            )}
          </div>
        </div>

        <aside className="grid gap-3">
          <div className={cx('rounded-lg border p-3 shadow-md', surfaceClass)}>
            <div className="mb-3">
              <p className={cx('text-xs font-black uppercase tracking-wide mb-1', mutedText)}>Price</p>
              <p className="text-2xl font-black text-violet-700">NGN {(product.price || 0).toLocaleString()}</p>
            </div>

            <div className="grid gap-2 mb-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className={cx('font-black uppercase tracking-wide text-xs mb-0.5', mutedText)}>Brand</p>
                  <p className="font-semibold text-sm">{product.brand || 'Not listed'}</p>
                </div>
                <div>
                  <p className={cx('font-black uppercase tracking-wide text-xs mb-0.5', mutedText)}>Campus</p>
                  <p className="font-semibold text-sm">{product.university || 'Not listed'}</p>
                </div>
                <div className="col-span-2">
                  <p className={cx('font-black uppercase tracking-wide text-xs mb-0.5', mutedText)}>Stock</p>
                  <p className="font-semibold text-sm">{product.stock ?? 0} available</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="block">
                <span className="text-xs font-bold mb-1 block">Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value) || 1)}
                  className={cx('w-full rounded-md border px-2.5 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')}
                />
              </label>

              <div className="grid gap-1.5">
                <button type="button" className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-violet-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-800 shadow-md" onClick={handleAddToCart}>
                  <ShoppingCart size={14} />
                  {isInCart ? 'Update Cart' : 'Add to Cart'}
                </button>
                <button type="button" className={cx('inline-flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-bold transition shadow-md', isDark ? 'border-violet-300/40 text-violet-100 hover:bg-violet-300/10' : 'border-violet-700 text-violet-700 hover:bg-violet-50')} onClick={handleBuyNow}>
                  <CreditCard size={14} />
                  Buy Now
                </button>
              </div>
            </div>
          </div>

          <div className={cx('rounded-xl border p-4 shadow-lg', surfaceClass)}>
            <h2 className="text-lg font-black tracking-tight mb-3 flex items-center gap-2">
              <PackageOpen size={18} className="text-violet-700" />
              Product Details
            </h2>
            <div className="space-y-3">
              <p className={cx('leading-relaxed text-sm', mutedText)}>
                {product.description || 'No description available yet.'}
              </p>

              {/* Additional product info if available */}
              {product.tags && product.tags.length > 0 && (
                <div className="pt-3 border-t border-slate-200/50 dark:border-white/10">
                  <p className="text-sm font-bold mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/30 dark:text-violet-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>,
  )
}

function Header({ isDark, menuOpen, navLinkClass, setMenuOpen, toggleTheme }) {
  return (
    <header className={cx('sticky top-0 z-50 border-b backdrop-blur-xl', isDark ? 'border-white/10 bg-slate-950/90' : 'border-slate-200 bg-white/90')}>
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-black uppercase tracking-normal text-violet-700">
          Campus<span className={isDark ? 'text-slate-100' : 'text-slate-950'}>Thread</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className={navLinkClass(link.path)}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={cx('inline-flex h-10 w-10 items-center justify-center rounded-lg transition', isDark ? 'bg-slate-800 text-amber-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-violet-100')}
            title="Toggle Dark Mode"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            className={cx('inline-flex h-10 w-10 items-center justify-center rounded-lg md:hidden', isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-900')}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className={cx('border-t px-4 py-3 md:hidden', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white')}>
          <div className="mx-auto grid max-w-7xl gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={cx(navLinkClass(link.path), 'block px-4 py-3 text-base')} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

