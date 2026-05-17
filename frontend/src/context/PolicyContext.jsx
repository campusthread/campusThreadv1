import { createContext, useContext, useState } from 'react'
import PolicyModal from '../components/PolicyModal'

const PolicyContext = createContext()

export function PolicyProvider({ children }) {
  const [policyOpen, setPolicyOpen] = useState(null)

  const openPolicy = (type) => setPolicyOpen(type)
  const closePolicy = () => setPolicyOpen(null)

  return (
    <PolicyContext.Provider value={{ openPolicy, closePolicy }}>
      {children}
      <PolicyModal open={Boolean(policyOpen)} type={policyOpen} onClose={closePolicy} />
    </PolicyContext.Provider>
  )
}

export function usePolicyModal() {
  const context = useContext(PolicyContext)
  if (!context) {
    throw new Error('usePolicyModal must be used within PolicyProvider')
  }
  return context
}
