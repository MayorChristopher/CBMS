"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn, signUp } from "@/lib/auth"
import { Loader2, Info } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let result
      if (isSignUp) {
        result = await signUp(email, password)
        if (result.data.user && !result.error) {
          setError("Please check your email to confirm your account before signing in.")
          setIsSignUp(false)
          setLoading(false)
          return
        }
      } else {
        result = await signIn(email, password)
      }

      if (result.error) {
        setError(result.error.message)
      } else if (result.data.user) {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    }

    setLoading(false)
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setError("")

    // First try to sign up the demo user
    const signUpResult = await signUp("admin@cbms.com", "password123")

    if (signUpResult.error && !signUpResult.error.message.includes("already registered")) {
      setError(signUpResult.error.message)
      setLoading(false)
      return
    }

    // Then try to sign in
    const signInResult = await signIn("admin@cbms.com", "password123")

    if (signInResult.error) {
      setError("Demo account created! Please check your email to confirm the account, then try logging in again.")
    } else if (signInResult.data.user) {
      router.push("/dashboard")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{isSignUp ? "Create Account" : "CBMS Login"}</CardTitle>
          <CardDescription className="text-center">Customer Behaviour Monitoring System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant={error.includes("check your email") ? "default" : "destructive"}>
                <Info className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button variant="outline" className="w-full bg-transparent" onClick={handleDemoLogin} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Try Demo Account
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError("")
              }}
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <div className="space-y-1">
              <div>Click "Try Demo Account" to create and use demo credentials</div>
              <div className="text-xs">Or create your own account using the Sign Up option</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
