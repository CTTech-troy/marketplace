import React, { useState, useEffect } from 'react'
import { OtpInput } from './OtpInput'
import { useSearchParams, useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function VerifyCode() {
  const [otp, setOtp] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resendTimer, setResendTimer] = useState(0)

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email')

  // Redirect if no email in query
  useEffect(() => {
    if (!email) {
      console.warn('No email provided in query')
      navigate('/') // redirect if no email
    }
  }, [email, navigate])

  // Countdown timer for resend button
  useEffect(() => {
    let timer
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [resendTimer])

  // ------------------ Verify OTP ------------------
  const handleVerify = async (e) => {
    e.preventDefault()
    setError(null)

    const code = otp.join('')
    if (code.length !== 4) {
      setError('Please enter the 4-digit code')
      return
    }

    setLoading(true)
    try {
      const resp = await fetch(`${API}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Verification failed')

      alert('Email verified successfully!')
      navigate('/dashboard') // redirect after success
    } catch (err) {
      console.error('OTP verification error:', err)
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  // ------------------ Resend OTP ------------------
  const handleResendCode = async () => {
    setError(null)
    setResendLoading(true)
    try {
      const resp = await fetch(`${API}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Failed to resend OTP')
      alert('OTP resent successfully! Check your email.')
      setResendTimer(30) // 30-second cooldown
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white-100 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Illustration */}
          <div className="p-5 md:p-10 flex items-center justify-center md:w-1/2">
            <img
              src="../../../assets/2fa.jpg"
              alt="Two Factor Authentication"
              className="w-80 h-80 object-cover"
            />
          </div>

          {/* Form */}
          <div className="p-8 md:p-12 md:w-1/2 flex flex-col justify-center">
            <h1 className="text-3xl font-bold mb-2 text-center md:text-left">
              Verify Code
            </h1>
            <p className="text-gray-600 mb-6 text-center md:text-left">
              We have sent an OTP to your email. Enter the code below to verify
            </p>

            {error && (
              <div className="mb-3 bg-red-100 text-red-500 border border-red-200 rounded p-2">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="flex flex-col items-center md:items-stretch">
              <div className="mb-6 w-full">
                <OtpInput value={otp} onChange={setOtp} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-md font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={handleResendCode}
                disabled={resendLoading || resendTimer > 0}
                className="text-gray-600 hover:text-gray-800 text-sm disabled:opacity-50"
              >
                {resendLoading
                  ? 'Resending...'
                  : resendTimer > 0
                  ? `Resend code in ${resendTimer}s`
                  : 'Resend code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}