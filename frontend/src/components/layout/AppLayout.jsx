import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
