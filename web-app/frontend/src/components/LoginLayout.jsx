import { motion } from 'framer-motion'

const LoginLayout = ({ children, userType }) => {
  return (
    <div className="min-h-screen bg-[#FAFBFC] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        {/* Subtle accent line */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent/50 via-accent to-accent/50"></div>

        <div className="w-full flex flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src="/LOGO.png" alt="CognivusLabs" className="h-12 w-auto" />
          </div>

          {/* Content */}
          <div className="space-y-8 max-w-md">
            <div className="space-y-4">
              <h2 className="text-4xl font-display font-semibold text-white leading-tight tracking-tight">
                Continuous Health Monitoring System
              </h2>
              <p className="text-base text-gray-400 leading-relaxed font-normal">
                Real-time patient monitoring with AI-driven insights and automated interventions
                for comprehensive chronic care management.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-4">
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-white">24/7</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Monitoring</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-white">AI</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Powered</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-white">IoT</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Enabled</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-600">
            © 2025 CognivusLabs. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center space-x-2.5 mb-10">
            <img src="/LOGO.png" alt="CognivusLabs" className="h-10 w-auto" />
          </div>

          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-display font-semibold text-gray-900 mb-2 tracking-tight">
              {userType} Sign In
            </h2>
            <p className="text-sm text-gray-600">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form */}
          {children}

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {userType === 'Doctor' ? (
                <>
                  Not a doctor?{' '}
                  <a href="/staff/login" className="text-accent font-medium hover:text-accent/80 transition-colors">
                    Staff Login
                  </a>
                </>
              ) : (
                <>
                  Not a staff member?{' '}
                  <a href="/doctor/login" className="text-accent font-medium hover:text-accent/80 transition-colors">
                    Doctor Login
                  </a>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginLayout
