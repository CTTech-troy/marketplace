// frontend/src/pages/auth/authPage.jsx
import React, { useState } from 'react'
import AuthLayout from '../../components/auth/AuthLayout'
import LoginForm from '../../components/auth/LoginForm'
import CreateAccountForm from '../../components/auth/CreateAccountForm'
export default function App() {
  const [activeForm, setActiveForm] = useState('login')

  const toggleForm = (form) => {
    setActiveForm(form)
  }

  return (
    <div className="min-h-screen bg-white-100 flex items-center justify-center p-10">
      <div className="w-full max-w-7xl h-[calc(100vh-80px)] bg-white rounded-2xl shadow-lg overflow-hidden">
        <AuthLayout
          activeForm={activeForm}
          leftSideContent={
            activeForm === 'login' ? 'Welcome!' : "Let's Get Started!"
          }
        >
          {activeForm === 'login' ? (
            <LoginForm onToggleForm={() => toggleForm('createAccount')} />
          ) : (
            <CreateAccountForm onToggleForm={() => toggleForm('login')} />
          )}
        </AuthLayout>
      </div>
    </div>
  )
}
