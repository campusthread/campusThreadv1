import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, CreditCard, Heart, Minus, Package, Plus, ShoppingCart, Store, Tag, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import NotificationToast from '../components/NotificationToast'
import SectionLoader from '../components/SectionLoader'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../context/AuthContext'
import { useGetCartQuery, useUpdateCartMutation, useGetFavoritesQuery, useUpdateFavoritesMutation } from '../redux/slices/cartFavoritesApiSlice'

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/explore', label: 'Explore Brands' },
  { path: '/cart', label: 'Cart' },
  { path: '/favorites', label: 'Favorites' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Cart() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { notifications, showNotification } = useNotification()
  const { user } = useAuth()
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const isAuthenticated = Boolean(user || token)
  const skipAuthQueries = !isAuthenticated
  // Fetch cart and favorites from API (skipped for guests)
  const { data: cartData = [], isFetching: cartFetching } = useGetCartQuery(undefined, { skip: skipAuthQueries })
  const { data: favoritesData = [], isFetching: favoritesFetching } = useGetFavoritesQuery(undefined, { skip: skipAuthQueries })
  const [updateCart, { isLoading: updateCartLoading }] = useUpdateCartMutation()
  const [updateFavorites, { isLoading: updateFavoritesLoading }] = useUpdateFavoritesMutation()

  // Use API-backed data only (guests see empty lists and must sign in to persist)
  const cart = Array.isArray(cartData) ? cartData : []
  const favorites = Array.isArray(favoritesData) ? favoritesData : []
  const cartUpdating = updateCartLoading || updateFavoritesLoading
  const cartRequiresLoader = isAuthenticated && cartFetching

  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'

  const saveCart = async (updatedCart) => {
    if (!isAuthenticated) {
      showNotification('Please sign in to update your cart', 'info')
      return
    }
    await updateCart(updatedCart).unwrap()
  }

  const saveFavorites = async (updatedFavorites) => {
    if (!isAuthenticated) {
      showNotification('Please sign in to save favorites', 'info')
      return
    }
    await updateFavorites(updatedFavorites).unwrap()
  }

  const updateQuantity = async (itemId, delta) => {
    const itemIndex = cart.findIndex((item) => String(item._id || item.id) === String(itemId))
    if (itemIndex === -1) return

    const updated = [...cart]
    const newQuantity = (updated[itemIndex].quantity || 1) + delta
    if (newQuantity < 1) {
      updated.splice(itemIndex, 1)
    } else {
      updated[itemIndex] = { ...updated[itemIndex], quantity: newQuantity }
    }
    try {
      await saveCart(updated)
    } catch (err) {
      showNotification(err?.data?.message || 'Failed to update cart', 'error')
    }
  }

  const removeFromCart = async (itemId) => {
    const itemIndex = cart.findIndex((item) => String(item._id || item.id) === String(itemId))
    if (itemIndex === -1) return

    const name = cart[itemIndex].name
    const updated = [...cart]
    updated.splice(itemIndex, 1)
    try {
      await saveCart(updated)
      showNotification(`Removed "${name}" from cart`, 'info')
    } catch (err) {
      showNotification(err?.data?.message || 'Failed to remove item', 'error')
    }
  }

  const addToFavorite = async (itemId) => {
    const itemIndex = cart.findIndex((item) => String(item._id || item.id) === String(itemId))
    if (itemIndex === -1) return

    const item = cart[itemIndex]
    if (favorites.find((favorite) => String(favorite._id || favorite.id) === String(itemId))) {
      showNotification(`"${item.name}" is already in favorites!`, 'info')
      return
    }
    const updated = [...favorites, { ...item, _id: itemId, id: itemId, addedAt: new Date().toISOString() }]
    try {
      await saveFavorites(updated)
      showNotification(`"${item.name}" added to favorites!`, 'success')
    } catch (err) {
      showNotification(err?.data?.message || 'Failed to add to favorites', 'error')
    }
  }

  const checkout = () => {
    if (cart.length === 0) {
      showNotification('Your cart is empty!', 'info')
      return
    }

    if (!isAuthenticated) {
      showNotification('Please sign in to checkout', 'info')
      navigate('/auth')
      return
    }

    navigate('/checkout')
  }

  const totalPrice = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)

  if (cartRequiresLoader) {
    return (
      <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
        <Navbar links={NAV_LINKS} />
        <NotificationToast notifications={notifications} />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionLoader message="Loading cart..." isDark={isDark} />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <Navbar links={NAV_LINKS} />
      <NotificationToast notifications={notifications} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8 border-b border-slate-200/70 pb-8 dark:border-white/10">
          <p className={cx('mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', isDark ? 'border-violet-300/20 bg-violet-300/10 text-violet-200' : 'border-violet-200 bg-violet-50 text-violet-700')}>
            <ShoppingCart size={14} />
            {totalItems} cart item{totalItems === 1 ? '' : 's'}
          </p>
          <h1 className="text-4xl font-black tracking-normal sm:text-5xl">Shopping Cart</h1>
          <p className={cx('mt-3 text-sm font-semibold', mutedText)}>
            <Link to="/" className="text-violet-700">Home</Link> / <Link to="/shop" className="text-violet-700">Shop</Link> / Cart
          </p>
        </section>

        {cart.length === 0 ? (
          <div className={cx('rounded-2xl border-2 border-dashed p-12 text-center', isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
            <ShoppingCart size={42} className="mx-auto mb-4" />
            <p className="text-lg font-bold">Your cart is empty.</p>
            <Link to="/shop" className="mt-6 inline-flex rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <section className={cx('overflow-hidden rounded-2xl border shadow-lg', surfaceClass)}>
              <div className={cx('flex items-center gap-2 border-b p-5 text-lg font-black', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
                <ShoppingCart size={20} />
                Cart Items ({totalItems})
              </div>
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {cart.map((item, index) => (
                  <CartItem
                    key={`${item._id || item.id}-${index}`}
                    item={item}
                    isDark={isDark}
                    mutedText={mutedText}
                    updating={cartUpdating}
                    onMinus={() => updateQuantity(item._id || item.id, -1)}
                    onPlus={() => updateQuantity(item._id || item.id, 1)}
                    onFavorite={() => addToFavorite(item._id || item.id)}
                    onRemove={() => removeFromCart(item._id || item.id)}
                  />
                ))}
              </div>
            </section>

            <aside className={cx('h-fit rounded-2xl border p-6 shadow-lg lg:sticky lg:top-24', surfaceClass)}>
              <h3 className="text-xl font-black tracking-normal">Order Summary</h3>
              <div className="mt-5 grid gap-3 text-sm">
                <SummaryRow label="Subtotal" value={`NGN ${totalPrice.toLocaleString()}`} />
                <SummaryRow label="Shipping" value="NGN 0" />
                <SummaryRow label="Tax" value="NGN 0" />
              </div>
              <div className="mt-5 flex justify-between border-t border-slate-200 pt-5 text-xl font-black text-violet-700 dark:border-white/10">
                <span>Total</span>
                <span>NGN {totalPrice.toLocaleString()}</span>
              </div>
              <button type="button" onClick={checkout} disabled={cartUpdating || cartFetching} className={cx('mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition', cartUpdating || cartFetching ? 'cursor-not-allowed bg-violet-500' : 'bg-violet-700 hover:bg-violet-800')}>
                <CreditCard size={18} />
                Proceed to Checkout
              </button>
              <Link to="/shop" className={cx('mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-bold transition', isDark ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-100')}>
                <ArrowLeft size={18} />
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

function CartItem({ item, isDark, mutedText, updating, onMinus, onPlus, onFavorite, onRemove }) {
  const media = item.images?.[0]?.url || item.media
  const video = item.videos?.[0]?.url || (item.mediaType?.startsWith('video/') ? item.media : '')

  return (
    <article className="grid gap-4 p-5 sm:grid-cols-[6rem_1fr] xl:grid-cols-[6rem_1fr_auto] xl:items-center">
      <div className={cx('flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl', isDark ? 'bg-slate-950' : 'bg-slate-100')}>
        {video ? (
          <video className="h-full w-full object-cover" controls><source src={video} /></video>
        ) : media ? (
          <img src={media} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <Package size={32} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
        )}
      </div>
      <div>
        <h3 className="text-lg font-black tracking-normal">{item.name}</h3>
        <div className={cx('mt-2 flex flex-wrap gap-3 text-sm', mutedText)}>
          <span className="flex items-center gap-1"><Tag size={14} /> {item.category || 'Uncategorized'}</span>
          <span className="flex items-center gap-1"><Building2 size={14} /> {item.university || 'N/A'}</span>
          <span className="flex items-center gap-1"><Store size={14} /> {item.brand || 'N/A'}</span>
        </div>
        <p className="mt-3 text-xl font-black text-violet-700">NGN {(item.price || 0).toLocaleString()}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 xl:justify-end">
        <div className={cx('inline-flex items-center rounded-lg border', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
          <button type="button" onClick={onMinus} disabled={updating} className="p-2 disabled:cursor-not-allowed disabled:opacity-50"><Minus size={16} /></button>
          <span className="min-w-8 text-center font-bold">{item.quantity || 1}</span>
          <button type="button" onClick={onPlus} disabled={updating} className="p-2 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} /></button>
        </div>
        <button type="button" onClick={onFavorite} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50">
          <Heart size={16} />
          Favorite
        </button>
        <button type="button" onClick={onRemove} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Trash2 size={16} />
          Remove
        </button>
      </div>
    </article>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}
