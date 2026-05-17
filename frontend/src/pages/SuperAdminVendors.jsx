import { useMemo, useState } from 'react'
import { ArrowLeft, Search, Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useGetAllVendorsQuery, useApproveVendorMutation, useRejectVendorMutation } from '../redux/slices/adminApiSlice'

const formatCurrency = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0))
const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function SuperAdminVendors() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actioningId, setActioningId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(null)
  const { data, isLoading, isError } = useGetAllVendorsQuery({ search, page: 1, limit: 100 })
  const [approveVendor, { isLoading: isApproving }] = useApproveVendorMutation()
  const [rejectVendor, { isLoading: isRejecting }] = useRejectVendorMutation()
  const vendors = data?.vendors || []
  const totalVendors = vendors.length

  const statusCounts = useMemo(() => {
    return vendors.reduce(
      (counts, vendor) => {
        counts[vendor.vendorStatus || 'pending'] = (counts[vendor.vendorStatus || 'pending'] || 0) + 1
        return counts
      },
      { all: vendors.length, approved: 0, pending: 0, rejected: 0 },
    )
  }, [vendors])

  const filteredVendors = useMemo(() => {
    const query = search.toLowerCase()
    return vendors.filter((vendor) => {
      const matchesStatus = statusFilter === 'all' || vendor.vendorStatus === statusFilter
      if (!matchesStatus) return false
      if (!search) return true
      return [vendor.brandName, vendor.name, vendor.email, vendor.accountHolderName, vendor.bankName, vendor.accountNumber, vendor.vendorStatus, vendor.phone]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(query))
    })
  }, [search, vendors, statusFilter])

  const handleApprove = async (vendorId) => {
    try {
      setActioningId(vendorId)
      await approveVendor(vendorId).unwrap()
    } catch (err) {
      alert('Failed to approve vendor: ' + (err?.data?.message || err.message))
    } finally {
      setActioningId(null)
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    try {
      setActioningId(showRejectModal)
      await rejectVendor({ vendorId: showRejectModal, reason: rejectReason }).unwrap()
      setRejectReason('')
      setShowRejectModal(null)
    } catch (err) {
      alert('Failed to reject vendor: ' + (err?.data?.message || err.message))
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className={cx('min-h-screen', isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950')}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/super-admin')}
          className={cx(
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition',
            isDark ? 'border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400',
          )}
        >
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <div className={cx('mt-6 rounded-3xl border p-6 shadow-sm', isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white')}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Vendor Profiles</h1>
              <p className={cx('mt-2 max-w-2xl text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
                All registered vendors and their profile details. Search by vendor name, email, bank, or status.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className={cx('relative overflow-hidden rounded-full border px-4 py-2', isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-100')}>
                <Search size={16} className={cx('absolute left-4 top-1/2 -translate-y-1/2', isDark ? 'text-slate-400' : 'text-slate-500')} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vendors..."
                  className={cx(
                    'w-full rounded-full border-none bg-transparent py-1 pl-10 pr-4 text-sm outline-none',
                    isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-500',
                  )}
                />
              </div>
              <div className={cx('rounded-3xl px-4 py-2 text-sm font-semibold', isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-900')}>
                Total profiles: {totalVendors}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cx(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  statusFilter === status
                    ? 'bg-violet-700 text-white shadow-sm'
                    : isDark
                      ? 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-900'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
                )}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status] || 0})
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-transparent text-sm shadow-sm dark:border-slate-800">
            <table className="min-w-full table-auto text-left">
              <thead className={cx('border-b', isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
                <tr>
                  {['Brand Name', 'Brand Owner', 'Email', 'Phone', 'Status', 'Bank', 'Account Number', 'Created', 'Actions'].map((heading) => (
                    <th key={heading} className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={cx('divide-y', isDark ? 'divide-slate-800' : 'divide-slate-200')}>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                      Loading vendor profiles...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-red-600 dark:text-red-400">
                      Failed to load vendor profiles.
                    </td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                      No vendors found.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor._id || vendor.id} className={cx(isDark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:bg-slate-50', 'transition-colors')}>
                      <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100">{vendor.brandName || vendor.name || 'Unknown'}</td>
                      <td className={cx('px-4 py-4', isDark ? 'text-slate-300' : 'text-slate-600')}>{vendor.accountHolderName || vendor.ownerName || vendor.name || 'N/A'}</td>
                      <td className={cx('px-4 py-4', isDark ? 'text-slate-300' : 'text-slate-600')}>{vendor.email || 'N/A'}</td>
                      <td className={cx('px-4 py-4', isDark ? 'text-slate-300' : 'text-slate-600')}>{vendor.phone || 'N/A'}</td>
                      <td className="px-4 py-4">
                        <span className={cx('inline-flex rounded-full px-3 py-1 text-xs font-semibold', vendor.vendorStatus === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200' : vendor.vendorStatus === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}>
                          {vendor.vendorStatus || 'unknown'}
                        </span>
                      </td>
                      <td className={cx('px-4 py-4', isDark ? 'text-slate-300' : 'text-slate-600')}>{vendor.bankName || 'N/A'}</td>
                      <td className={cx('px-4 py-4', isDark ? 'text-slate-300' : 'text-slate-600')}>{vendor.accountNumber || 'N/A'}</td>
                      <td className={cx('px-4 py-4', isDark ? 'text-slate-300' : 'text-slate-600')}>{new Date(vendor.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        {vendor.vendorStatus === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(vendor._id || vendor.id)}
                              disabled={actioningId === (vendor._id || vendor.id) || isApproving}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Check size={14} />
                              {actioningId === (vendor._id || vendor.id) && isApproving ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowRejectModal(vendor._id || vendor.id)}
                              disabled={actioningId === (vendor._id || vendor.id) || isRejecting}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X size={14} />
                              {actioningId === (vendor._id || vendor.id) && isRejecting ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <span className={cx('text-xs font-semibold', vendor.vendorStatus === 'approved' ? 'text-emerald-600' : 'text-slate-500')}>
                            {vendor.vendorStatus === 'approved' ? '✓ Approved' : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className={cx('w-full max-w-md rounded-3xl border p-6 shadow-2xl', isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white')}>
            <h3 className="text-2xl font-black">Reject Vendor?</h3>
            <p className={cx('mt-2 text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
              Please provide a reason for rejecting this vendor. They will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className={cx('mt-4 w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20', isDark ? 'border-white/10 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-950')}
              rows={4}
            />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectReason('')
                }}
                className={cx('flex-1 rounded-lg border px-4 py-2 text-sm font-bold transition', isDark ? 'border-slate-700 text-slate-100 hover:bg-slate-900' : 'border-slate-200 text-slate-900 hover:bg-slate-100')}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={isRejecting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejecting ? 'Rejecting...' : 'Reject Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
