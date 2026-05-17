import { Link } from 'react-router-dom'
import { Building2, Heart, Package, ShoppingCart, Store, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import NotificationToast from '../components/NotificationToast'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import { useGetFavoritesQuery, useUpdateFavoritesMutation, useGetCartQuery, useUpdateCartMutation } from '../redux/slices/cartFavoritesApiSlice'

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/explore', label: 'Explore Brands' },
  { path: '/cart', label: 'Cart' },
  { path: '/favorites', label: 'Favorites' },
]

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Favorites() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { notifications, showNotification } = useNotification()
  
  // Fetch favorites and cart from API
  const { data: favoritesData = [] } = useGetFavoritesQuery()
  const { data: cartData = [] } = useGetCartQuery()
  const [updateFavorites] = useUpdateFavoritesMutation()
  const [updateCart] = useUpdateCartMutation()

  const favorites = Array.isArray(favoritesData) ? favoritesData : []
  const cart = Array.isArray(cartData) ? cartData : []
  const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
  const surfaceClass = isDark ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30' : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'

  const addToCart = async (index) => {
    const item = favorites[index]
    const itemId = item._id || item.id
    const existing = cart.find((cartItem) => String(cartItem._id || cartItem.id) === String(itemId))
    const updated = existing
      ? cart.map((cartItem) => String(cartItem._id || cartItem.id) === String(itemId) ? { ...cartItem, quantity: (cartItem.quantity || 1) + 1 } : cartItem)
      : [...cart, { ...item, _id: itemId, id: itemId, quantity: 1, addedAt: new Date().toISOString() }]
    
    try {
      await updateCart(updated).unwrap()
      showNotification(`"${item.name}" added to cart!`, 'success')
    } catch (err) {
      showNotification(err?.data?.message || 'Failed to add to cart', 'error')
    }
  }

  const removeFromFavorites = async (index) => {
    const name = favorites[index].name
    const updated = [...favorites]
    updated.splice(index, 1)
    try {
      await updateFavorites(updated).unwrap()
      showNotification(`Removed "${name}" from favorites`, 'info')
    } catch (err) {
      showNotification(err?.data?.message || 'Failed to remove from favorites', 'error')
    }
  }

  return (
    <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
      <Navbar links={NAV_LINKS} />
      <NotificationToast notifications={notifications} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8 border-b border-slate-200/70 pb-8 dark:border-white/10">
          <p className={cx('mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', isDark ? 'border-violet-300/20 bg-violet-300/10 text-violet-200' : 'border-violet-200 bg-violet-50 text-violet-700')}>
            <Heart size={14} />
            Saved products
          </p>
          <h1 className="text-4xl font-black tracking-normal sm:text-5xl">My Favorites</h1>
          <p className={cx('mt-3 text-sm font-semibold', mutedText)}>
            <Link to="/" className="text-violet-700">Home</Link> / <Link to="/shop" className="text-violet-700">Shop</Link> / Favorites
          </p>
        </section>

        {favorites.length === 0 ? (
          <div className={cx('rounded-2xl border-2 border-dashed p-12 text-center', isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
            <Heart size={42} className="mx-auto mb-4" />
            <p className="text-lg font-bold">You haven't added any favorites yet.</p>
            <Link to="/shop" className="mt-6 inline-flex rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((item, index) => (
              <FavoriteCard
                key={`${item._id || item.id}-${index}`}
                item={item}
                isDark={isDark}
                surfaceClass={surfaceClass}
                mutedText={mutedText}
                onAdd={() => addToCart(index)}
                onRemove={() => removeFromFavorites(index)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

function FavoriteCard({ item, isDark, surfaceClass, mutedText, onAdd, onRemove }) {
  const media = item.images?.[0]?.url || item.media
  const video = item.videos?.[0]?.url || (item.mediaType?.startsWith('video/') ? item.media : '')

  return (
    <article className={cx('group overflow-hidden rounded-xl border shadow-lg transition hover:-translate-y-1 hover:shadow-xl', surfaceClass)}>
      <div className={cx('flex h-56 items-center justify-center overflow-hidden', isDark ? 'bg-slate-950' : 'bg-slate-100')}>
        {video ? (
          <video className="h-full w-full object-cover" controls>
            <source src={video} />
          </video>
        ) : media ? (
          <img src={media} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <Package size={38} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
        )}
      </div>
      <div className="flex min-h-72 flex-col p-5">
        <p className="text-xs font-black uppercase tracking-wide text-violet-700">{item.category || 'Uncategorized'}</p>
        <h3 className="mt-2 text-lg font-black tracking-normal">{item.name}</h3>
        <div className={cx('mt-3 grid gap-2 text-sm', mutedText)}>
          <span className="flex items-center gap-2"><Building2 size={15} /> {item.university || 'N/A'}</span>
          <span className="flex items-center gap-2"><Store size={15} /> {item.brand || 'N/A'}</span>
        </div>
        <p className="mt-auto pt-5 text-xl font-black text-violet-700">NGN {(item.price || 0).toLocaleString()}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={onAdd} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-violet-800">
            <ShoppingCart size={16} />
            Add
          </button>
          <button type="button" onClick={onRemove} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700">
            <Trash2 size={16} />
            Remove
          </button>
        </div>
      </div>
    </article>
  )
}
