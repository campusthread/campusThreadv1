import { useEffect } from 'react'
import { CalendarDays, Heart, MessageCircle, Package, ShoppingCart, Store, University, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useGetCartQuery, useUpdateCartMutation, useGetFavoritesQuery, useUpdateFavoritesMutation } from '../redux/slices/cartFavoritesApiSlice'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function ProductModal({ product, onClose, showNotification }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { user } = useAuth()
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const isAuthenticated = Boolean(user || token)
  const skipAuthQueries = !isAuthenticated

  // Fetch cart and favorites from API only when signed in
  const { data: cartData = [] } = useGetCartQuery(undefined, { skip: skipAuthQueries })
  const { data: favoritesData = [] } = useGetFavoritesQuery(undefined, { skip: skipAuthQueries })
  const [updateCart] = useUpdateCartMutation()
  const [updateFavorites] = useUpdateFavoritesMutation()

  const cart = Array.isArray(cartData) ? cartData : []
  const favorites = Array.isArray(favoritesData) ? favoritesData : []
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  if (!product) return null

  const productId = product._id || product.id
  const isInCart = cart.some((item) => String(item._id || item.id) === String(productId))
  const isInFavorites = favorites.some((item) => String(item._id || item.id) === String(productId))
  const media = product.images?.[0]?.url || product.media
  const video = product.videos?.[0]?.url || (product.mediaType?.startsWith('video/') ? product.media : '')
  const socialLink = product.vendorSocialLink?.trim() || '#'
  const surface = isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-950'
  const muted = isDark ? 'text-slate-300' : 'text-slate-600'

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showNotification('Please sign in to add items to your cart', 'info')
      return
    }

    const updated = isInCart
      ? cart.map((item) =>
        String(item._id || item.id) === String(productId)
          ? { ...item, quantity: (item.quantity || 1) + 1 }
          : item,
      )
      : [...cart, { ...product, _id: productId, id: productId, quantity: 1, addedAt: new Date().toISOString() }]

    try {
      await updateCart(updated).unwrap()
      showNotification(
        isInCart ? 'Cart quantity updated!' : `"${product.name}" added to cart!`,
        'success',
        'View Cart',
        '/cart',
      )
    } catch (err) {
      showNotification(err?.data?.message || 'Failed to add to cart', 'error')
    }
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showNotification('Please sign in to save favorites', 'info')
      return
    }

    const updated = isInFavorites
      ? favorites.filter((item) => String(item._id || item.id) !== String(productId))
      : [...favorites, { ...product, _id: productId, id: productId, addedAt: new Date().toISOString() }]

    try {
      await updateFavorites(updated).unwrap()
      showNotification(
        isInFavorites ? `"${product.name}" removed from favorites!` : `"${product.name}" added to favorites!`,
        isInFavorites ? 'info' : 'success',
        isInFavorites ? undefined : 'View Favorites',
        isInFavorites ? undefined : '/favorites',
      )
    } catch (err) {
      showNotification(err?.data?.message || 'Failed to update favorites', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className={cx('relative mx-auto grid max-w-5xl overflow-hidden rounded-2xl shadow-2xl md:grid-cols-[0.9fr_1.1fr]', surface)}>
        <button
          type="button"
          onClick={onClose}
          className={cx('absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full', isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-700 shadow')}
          aria-label="Close product modal"
        >
          <X size={18} />
        </button>

        <div className={cx('flex min-h-72 items-center justify-center overflow-hidden', isDark ? 'bg-slate-950' : 'bg-slate-100')}>
          {video ? (
            <video className="h-full w-full object-cover" controls>
              <source src={video} />
            </video>
          ) : media ? (
            <img src={media} className="h-full w-full object-cover" alt={product.name} />
          ) : (
            <Package size={58} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
          )}
        </div>

        <div className="flex flex-col p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-wide text-violet-700">{product.category || 'Uncategorized'}</p>
          <h2 className="mt-2 text-3xl font-black tracking-normal">{product.name}</h2>

          <div className={cx('mt-5 grid gap-2 text-sm', muted)}>
            <span className="flex items-center gap-2"><University size={16} /> {product.university || 'N/A'}</span>
            <span className="flex items-center gap-2"><Store size={16} /> {product.brand || 'N/A'}</span>
            <span className="flex items-center gap-2"><CalendarDays size={16} /> {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>

          <p className="mt-5 text-3xl font-black text-violet-700">NGN {parseFloat(product.price || 0).toLocaleString()}</p>

          <div className={cx('mt-5 rounded-xl border p-4 text-sm', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
            <p><strong>File Name:</strong> {product.mediaName || 'N/A'}</p>
            <p className="mt-2"><strong>Media Type:</strong> {product.mediaType || (video ? 'video' : media ? 'image' : 'N/A')}</p>
          </div>

          <p className={cx('mt-5 leading-7', muted)}>{product.description || 'No description available.'}</p>

          <div className="mt-auto grid gap-3 border-t border-slate-200/70 pt-6 dark:border-white/10">
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800" onClick={handleAddToCart}>
              <ShoppingCart size={18} />
              {isInCart ? 'In Cart' : 'Add to Cart'}
            </button>

            <button type="button" className={cx('inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-bold transition', isInFavorites ? 'border-red-500 bg-red-600 text-white' : isDark ? 'border-violet-300/40 text-violet-100 hover:bg-violet-300/10' : 'border-violet-700 text-violet-700 hover:bg-violet-50')} onClick={handleToggleFavorite}>
              <Heart size={18} />
              {isInFavorites ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>

            <a
              href={socialLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cx('inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800', socialLink === '#' && 'pointer-events-none opacity-60')}
            >
              <MessageCircle size={18} />
              Contact Vendor
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
