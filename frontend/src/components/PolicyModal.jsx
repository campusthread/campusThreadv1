import { X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const policies = {
  terms: {
    title: 'Terms of Service – CampusThread',
    sections: [
      {
        heading: 'Welcome',
        content: 'By using CampusThread, you agree to these terms and conditions. CampusThread is a marketplace platform that connects fashion brands and vendors with customers. Vendors are responsible for managing their products, deliveries, and customer interactions.',
      },
      {
        heading: 'User Accounts',
        content: 'Users must provide accurate information during registration. CampusThread reserves the right to suspend or remove accounts involved in fraud, abuse, or policy violations.',
      },
      {
        heading: 'Vendor Responsibilities',
        content: 'Vendors must provide accurate product information, deliver products within agreed timelines, maintain product quality standards, and avoid counterfeit or prohibited products. CampusThread reserves the right to remove vendors who violate these rules.',
      },
      {
        heading: 'Payments & Commissions',
        content: 'All payments are processed through CampusThread. CampusThread deducts a 10% commission from completed sales before vendor payouts are made. Vendor payouts are processed after successful order confirmation.',
      },
      {
        heading: 'Refunds & Disputes',
        content: 'Customers may report issues involving wrong products, damaged products, or non-delivery. CampusThread may temporarily hold vendor payouts during dispute investigations.',
      },
      {
        heading: 'Prohibited Activities',
        content: 'Users may not engage in fraud or scams, upload harmful or illegal content, impersonate others, or manipulate reviews or transactions.',
      },
      {
        heading: 'Intellectual Property',
        content: 'All CampusThread branding, logos, and platform content remain the property of CampusThread.',
      },
      {
        heading: 'Limitation of Liability',
        content: 'CampusThread acts as a marketplace platform and is not directly responsible for vendor products, delivery delays, or damages caused by third-party actions.',
      },
      {
        heading: 'Modifications',
        content: 'CampusThread may update these terms at any time. Continued use of the platform means acceptance of updated terms.',
      },
      {
        heading: 'Contact',
        content: 'For support or complaints, email campusthread7@gmail.com or call 08124742475 / 09152713730.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy – CampusThread',
    sections: [
      {
        heading: 'Information We Collect',
        content: 'We may collect name, email address, phone number, delivery address, payment information, and vendor business details.',
      },
      {
        heading: 'How We Use Your Information',
        content: 'Your information may be used to process orders and payments, improve user experience, verify vendor accounts, provide customer support, and send updates and promotional content.',
      },
      {
        heading: 'Payment Security',
        content: 'Payment transactions are processed through secure third-party payment providers. CampusThread does not store sensitive card details.',
      },
      {
        heading: 'Information Sharing',
        content: 'CampusThread does not sell personal information. We may share limited information with vendors or logistics partners only when necessary to complete orders.',
      },
      {
        heading: 'Account Security',
        content: 'Users are responsible for keeping their account credentials secure.',
      },
      {
        heading: 'Cookies & Analytics',
        content: 'CampusThread may use cookies and analytics tools to improve platform performance and user experience.',
      },
      {
        heading: 'User Rights',
        content: 'Users may request access to their data, correction of inaccurate information, or account deletion.',
      },
      {
        heading: 'Policy Updates',
        content: 'This Privacy Policy may be updated periodically. Continued use of CampusThread means acceptance of any changes.',
      },
      {
        heading: 'Contact',
        content: 'For privacy-related concerns, email campusthread7@gmail.com or call 08124742475.',
      },
    ],
  },
}

export default function PolicyModal({ open, type, onClose }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const policy = policies[type]

  if (!open || !policy) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className={cx('max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border p-6 shadow-2xl', isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{policy.title}</h2>
            <p className={cx('mt-2 text-sm', isDark ? 'text-slate-300' : 'text-slate-500')}>Effective Date: [Insert Date]</p>
          </div>
          <button type="button" onClick={onClose} className={cx('rounded-full p-2 transition', isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')}>
            <X size={20} />
          </button>
        </div>

        {policy.sections.map((section) => (
          <section key={section.heading} className="mb-5">
            <h3 className="text-lg font-bold">{section.heading}</h3>
            <p className={cx('mt-2 leading-7', isDark ? 'text-slate-300' : 'text-slate-600')}>{section.content}</p>
          </section>
        ))}

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className={cx('rounded-lg border px-5 py-3 text-sm font-semibold transition', isDark ? 'border-white/10 text-slate-100 hover:bg-white/5' : 'border-slate-200 text-slate-900 hover:bg-slate-100')}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
