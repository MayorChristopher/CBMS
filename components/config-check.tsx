"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Settings, Database } from "lucide-react"

export function ConfigCheck() {
    const [isConfigured, setIsConfigured] = useState<boolean | null>(null)

    useEffect(() => {
        // Check configuration immediately on mount
        const checkConfig = () => {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            const configured = !!(url && key &&
                url !== 'https://placeholder.supabase.co' &&
                key !== 'placeholder-key')

            setIsConfigured(configured)
        }

        // Run check immediately
        checkConfig()
    }, [])

    // Show loading state briefly to prevent flash
    if (isConfigured === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking configuration...</p>
                </div>
            </div>
        )
    }

    if (isConfigured) {
        return null // Everything is configured
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <Settings className="h-5 w-5" />
                        Configuration Required
                    </CardTitle>
                    <CardDescription>
                        Your CBMS application needs to be configured with Supabase credentials before it can function properly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Database className="h-4 w-4" />
                        <AlertTitle>Missing Environment Variables</AlertTitle>
                        <AlertDescription>
                            The application cannot connect to Supabase because the required environment variables are not set.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                        <h3 className="font-semibold">Setup Steps:</h3>

                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                                <div>
                                    <p className="font-medium">Create a Supabase Project</p>
                                    <p className="text-sm text-gray-600">Go to Supabase Dashboard and create a new project</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                                <div>
                                    <p className="font-medium">Get Your Credentials</p>
                                    <p className="text-sm text-gray-600">Navigate to Settings → API and copy your Project URL and anon key</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                                <div>
                                    <p className="font-medium">Create Environment File</p>
                                    <p className="text-sm text-gray-600">Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your project root</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                                <div>
                                    <p className="font-medium">Add Your Credentials</p>
                                    <p className="text-sm text-gray-600">Add the following to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file:</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                            <div>NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co</div>
                            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
                        </div>

                        <div className="flex items-start gap-2">
                            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                            <div>
                                <p className="font-medium">Restart Development Server</p>
                                <p className="text-sm text-gray-600">Stop and restart your development server for the changes to take effect</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button asChild>
                            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Go to Supabase Dashboard
                            </a>
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Check Again
                        </Button>
                    </div>

                    <div className="text-xs text-gray-500 pt-4 border-t">
                        <p>For detailed setup instructions, see the <code className="bg-gray-100 px-1 rounded">SETUP.md</code> file in your project root.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}