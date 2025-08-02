"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUserProfile, Profile } from "@/lib/profiles"
import { supabase } from "@/lib/supabase"
import { config, getTrackingScript } from "@/lib/config"
import {
  Copy,
  Plus,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Key,
  Globe,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Settings,
  Shield,
  Activity,
  Info,
  X
} from "lucide-react"
import { toast } from "sonner"

interface Website {
  id: string
  user_id: string
  name: string
  url: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  last_tracked?: string
  verification_code?: string | null
  is_verified: boolean
}

interface ApiKey {
  id: string
  user_id: string
  website_id: string
  name: string
  key_prefix: string
  status: 'active' | 'inactive' | 'revoked'
  created_at: string
  last_used?: string
  websites?: {
    id: string
    name: string
    url: string
  }
}

export default function IntegrationPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [websites, setWebsites] = useState<Website[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [addingWebsite, setAddingWebsite] = useState(false)
  const [creatingApiKey, setCreatingApiKey] = useState(false)
  const [verifyingWebsite, setVerifyingWebsite] = useState<string | null>(null)
  const [newWebsite, setNewWebsite] = useState({ name: '', url: '' })
  const [newApiKey, setNewApiKey] = useState({ websiteId: '', name: '' })
  const [copied, setCopied] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null)
  const [analyzeUrl, setAnalyzeUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load user profile
      const userProfile = await getCurrentUserProfile()
      setProfile(userProfile)

      if (!userProfile) return

      // Load user's websites
      const { data: websitesData, error: websitesError } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })

      if (websitesError) throw websitesError
      setWebsites(websitesData || [])

      // Load user's API keys
      const { data: apiKeysData, error: apiKeysError } = await supabase
        .from('api_keys')
        .select(`
          *,
          websites (
            id,
            name,
            url
          )
        `)
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })

      if (apiKeysError) throw apiKeysError
      setApiKeys(apiKeysData || [])

    } catch (err) {
      console.error('Error loading data:', err)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const addWebsite = async () => {
    if (!profile || !newWebsite.name || !newWebsite.url) return

    setAddingWebsite(true)
    try {
      // Validate URL
      const url = newWebsite.url.startsWith('http') ? newWebsite.url : `https://${newWebsite.url}`

      // Generate verification code
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data, error } = await supabase
        .from('websites')
        .insert({
          user_id: profile.id,
          name: newWebsite.name,
          url: url,
          status: 'pending',
          verification_code: verificationCode,
          is_verified: false
        })
        .select()
        .single()

      if (error) throw error

      setWebsites([data, ...websites])
      setNewWebsite({ name: '', url: '' })
      toast.success('Website added! Please verify it to activate tracking.')
    } catch (err) {
      console.error('Error adding website:', err)
      toast.error('Failed to add website')
    } finally {
      setAddingWebsite(false)
    }
  }

  const verifyWebsite = async (websiteId: string) => {
    setVerifyingWebsite(websiteId)
    try {
      const website = websites.find(w => w.id === websiteId);
      
      if (!website) {
        throw new Error("Website not found");
      }
      
      // Call the verification API to check if the code is present on the website
      const response = await fetch(`/api/websites/verify?token=${await getAuthToken()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: websiteId,
          websiteUrl: website.url,
          verificationCode: website.verification_code
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }
      
      if (data.verified) {
        // Update the website status in the database
        const { error } = await supabase
          .from('websites')
          .update({
            status: 'active',
            is_verified: true,
            verification_code: null
          })
          .eq('id', websiteId);

        if (error) throw error;

        setWebsites(websites.map(w =>
          w.id === websiteId
            ? { ...w, status: 'active', is_verified: true, verification_code: null }
            : w
        ));
        
        toast.success('Website verified successfully!');
      } else {
        toast.error('Verification code not found on website. Please check your implementation.');
      }
    } catch (err) {
      console.error('Error verifying website:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to verify website');
    } finally {
      setVerifyingWebsite(null);
    }
  }

  const createApiKey = async () => {
    if (!profile || !newApiKey.websiteId || !newApiKey.name) return

    setCreatingApiKey(true)
    try {
      const response = await fetch(`/api/api-keys?token=${await getAuthToken()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: newApiKey.websiteId,
          name: newApiKey.name
        })
      })

      if (!response.ok) throw new Error('Failed to create API key')

      const { apiKey, apiKeyRecord } = await response.json()

      setApiKeys([apiKeyRecord, ...apiKeys])
      setGeneratedApiKey(apiKey)
      setNewApiKey({ websiteId: '', name: '' })
      toast.success('API key created successfully!')
    } catch (err) {
      console.error('Error creating API key:', err)
      toast.error('Failed to create API key')
    } finally {
      setCreatingApiKey(false)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/api-keys?token=${await getAuthToken()}&id=${keyId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete API key')

      setApiKeys(apiKeys.filter(k => k.id !== keyId))
      toast.success('API key deleted successfully!')
    } catch (err) {
      console.error('Error deleting API key:', err)
      toast.error('Failed to delete API key')
    }
  }

  const removeWebsite = async (websiteId: string) => {
    try {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', websiteId)

      if (error) throw error
      setWebsites(websites.filter(w => w.id !== websiteId))
      toast.success('Website removed successfully!')
    } catch (err) {
      console.error('Error removing website:', err)
      toast.error('Failed to remove website')
    }
  }

  const analyzeWebsite = async () => {
    if (!analyzeUrl) return;
    
    setAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    
    try {
      const response = await fetch(`/api/websites/analyze?token=${await getAuthToken()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: analyzeUrl })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze website');
      }
      
      setAnalysisResult(data.analysis);
      toast.success('Website analyzed successfully!');
    } catch (err) {
      console.error('Error analyzing website:', err);
      setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze website');
      toast.error('Failed to analyze website');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
      toast.success('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy to clipboard')
    }
  }

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const getTrackingScriptForWebsite = (apiKey: string, websiteUrl: string) => {
    // Always use the production domain for the script and API endpoint
    return getTrackingScript(apiKey, 'https://cbmsystem.vercel.app/api')
  }

  const getVerificationInstructions = (website: Website) => {
    return `
1. Add this meta tag to your website's <head> section:
   <meta name="cbms-verification" content="${website.verification_code}">

2. Or add this script tag to your website:
   <script>window.CBMS_VERIFICATION = "${website.verification_code}";</script>

3. Click "Verify Website" below after adding the code.
    `
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access the integration page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Integration Center</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your websites and API keys for customer behavior tracking</p>
      </div>

      <Tabs defaultValue="websites" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4 overflow-x-auto">
          <TabsTrigger value="websites" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Websites</span>
            <span className="xs:hidden">Sites</span>
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Key className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">API Keys</span>
            <span className="xs:hidden">Keys</span>
          </TabsTrigger>
          <TabsTrigger value="analyzer" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Website Analyzer</span>
            <span className="xs:hidden">Analyzer</span>
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Setup Guide</span>
            <span className="xs:hidden">Guide</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="websites" className="space-y-6">
          {/* Add Website Section */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Website</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="website-name">Website Name</Label>
                  <Input
                    id="website-name"
                    placeholder="My E-commerce Site"
                    value={newWebsite.name}
                    onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="website-url">Website URL</Label>
                  <Input
                    id="website-url"
                    placeholder="https://example.com"
                    value={newWebsite.url}
                    onChange={(e) => setNewWebsite({ ...newWebsite, url: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={addWebsite} disabled={addingWebsite || !newWebsite.name || !newWebsite.url}>
                {addingWebsite ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Website
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Websites List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Websites</CardTitle>
            </CardHeader>
            <CardContent>
              {websites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No websites added yet. Add your first website above to start monitoring.
                </div>
              ) : (
                <div className="space-y-4">
                  {websites.map((website) => (
                    <div key={website.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{website.name}</h3>
                            <Badge variant={
                              website.status === 'active' ? 'default' :
                                website.status === 'pending' ? 'secondary' : 'destructive'
                            }>
                              {website.status === 'active' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : website.status === 'pending' ? (
                                <>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Pending Verification
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <ExternalLink className="h-3 w-3" />
                            <a href={website.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {website.url}
                            </a>
                          </div>
                          {website.last_tracked && (
                            <p className="text-xs text-gray-500">
                              Last tracked: {new Date(website.last_tracked).toLocaleString()}
                            </p>
                          )}
                          {website.status === 'pending' && website.verification_code && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-sm font-medium text-yellow-800 mb-2">Verification Required</p>
                              <p className="text-xs text-yellow-700 mb-2">
                                Add this verification code to your website: <code className="bg-yellow-100 px-1 rounded">{website.verification_code}</code>
                              </p>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">View Instructions</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Website Verification Instructions</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-sm text-gray-600">
                                      To verify your website ownership, add one of the following to your website:
                                    </p>
                                    <div className="bg-gray-100 p-4 rounded">
                                      <pre className="text-sm whitespace-pre-wrap">{getVerificationInstructions(website)}</pre>
                                    </div>
                                    <Button
                                      onClick={() => verifyWebsite(website.id)}
                                      disabled={verifyingWebsite === website.id}
                                    >
                                      {verifyingWebsite === website.id ? (
                                        <>
                                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                          Verifying...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Verify Website
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {website.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(getTrackingScriptForWebsite(generatedApiKey || 'YOUR_API_KEY', website.url), `script-${website.id}`)}
                            >
                              {copied === `script-${website.id}` ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy Script
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeWebsite(website.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          {/* Create API Key Section */}
          <Card>
            <CardHeader>
              <CardTitle>Create New API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api-key-website">Website</Label>
                  <select
                    id="api-key-website"
                    className="w-full p-2 border rounded-md"
                    value={newApiKey.websiteId}
                    onChange={(e) => setNewApiKey({ ...newApiKey, websiteId: e.target.value })}
                    title="Select website for API key"
                  >
                    <option value="">Select a website</option>
                    {websites.filter(w => w.status === 'active').map(website => (
                      <option key={website.id} value={website.id}>
                        {website.name} ({website.url})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="api-key-name">API Key Name</Label>
                  <Input
                    id="api-key-name"
                    placeholder="Production API Key"
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={createApiKey} disabled={creatingApiKey || !newApiKey.websiteId || !newApiKey.name}>
                {creatingApiKey ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Create API Key
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* API Keys List */}
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No API keys created yet. Create your first API key above.
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{apiKey.name}</h3>
                            <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>
                              {apiKey.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Website: {apiKey.websites?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(apiKey.created_at).toLocaleDateString()}
                            {apiKey.last_used && ` • Last used: ${new Date(apiKey.last_used).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                          >
                            {showApiKey === apiKey.id ? (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Show
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteApiKey(apiKey.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {showApiKey === apiKey.id && (
                        <div className="mt-3 p-3 bg-gray-100 rounded">
                          <p className="text-sm font-medium mb-2">API Key:</p>
                          <code className="text-sm break-all">{apiKey.key_prefix}...</code>
                          <p className="text-xs text-gray-500 mt-1">
                            Note: For security, only the prefix is shown. Use the full key from when it was created.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Setup Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Add Your Website</h4>
                    <p className="text-sm text-gray-600">Add your website URL in the Websites tab. The system will generate a verification code.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Verify Website Ownership</h4>
                    <p className="text-sm text-gray-600">Add the verification code to your website's HTML and click "Verify Website".</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Create API Key</h4>
                    <p className="text-sm text-gray-600">Create an API key for your verified website in the API Keys tab.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Add Tracking Script</h4>
                    <p className="text-sm text-gray-600">Copy the tracking script and add it to your website's &lt;head&gt; section.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    5
                  </div>
                  <div>
                    <h4 className="font-medium">Monitor Analytics</h4>
                    <p className="text-sm text-gray-600">View your customer behavior analytics in the Analytics dashboard.</p>
                  </div>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Note:</strong> Keep your API keys secure and never expose them in client-side code.
                  The tracking script handles API key transmission securely.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analyzer" className="space-y-6">
          {/* Website Analyzer */}
          <Card>
            <CardHeader>
              <CardTitle>Website Analyzer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter any website URL to analyze its content, technologies, and tracking capabilities.
                This helps you understand what analytics and tracking are already implemented on a site.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="https://example.com"
                  value={analyzeUrl}
                  onChange={(e) => setAnalyzeUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={analyzeWebsite} disabled={analyzing || !analyzeUrl}>
                  {analyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4 mr-2" />
                      Analyze Website
                    </>
                  )}
                </Button>
              </div>
              
              {analysisError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{analysisError}</AlertDescription>
                </Alert>
              )}
              
              {analysisResult && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Page Title</dt>
                            <dd className="text-sm">{analysisResult.title}</dd>
                          </div>
                          {analysisResult.metaTags.description && (
                            <div>
                              <dt className="text-xs font-medium text-gray-500">Meta Description</dt>
                              <dd className="text-sm">{analysisResult.metaTags.description}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Page Size</dt>
                            <dd className="text-sm">{Math.round(analysisResult.pageSize / 1024)} KB</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Links</dt>
                            <dd className="text-sm">
                              {analysisResult.links.internal} internal, {analysisResult.links.external} external
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Content Structure</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Headings</dt>
                            <dd className="text-sm">
                              {Object.entries(analysisResult.headings)
                                .filter(([_, count]) => (count as number) > 0)
                                .map(([tag, count]) => `${tag}: ${count as number}`)
                                .join(', ')}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Media</dt>
                            <dd className="text-sm">
                              {[
                                analysisResult.hasImages ? 'Images' : null,
                                analysisResult.hasVideos ? 'Videos' : null,
                                analysisResult.hasForms ? 'Forms' : null,
                              ]
                                .filter(Boolean)
                                .join(', ') || 'No media detected'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Resources</dt>
                            <dd className="text-sm">
                              {analysisResult.performance.resourceCount} total, 
                              {analysisResult.performance.scriptCount} scripts, 
                              {analysisResult.performance.cssCount} stylesheets
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Technologies</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Detected Technologies</dt>
                            <dd className="text-sm">
                              {analysisResult.technologies.length > 0 
                                ? analysisResult.technologies.join(', ') 
                                : 'No specific technologies detected'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Social Media</dt>
                            <dd className="text-sm">
                              {analysisResult.socialMedia.length > 0 
                                ? analysisResult.socialMedia.join(', ') 
                                : 'No social media detected'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Cookie Consent</dt>
                            <dd className="text-sm">
                              {analysisResult.hasCookieConsent ? 'Detected' : 'Not detected'}
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Analytics & Tracking</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Analytics Platforms</dt>
                            <dd className="text-sm">
                              {analysisResult.analytics.length > 0 
                                ? analysisResult.analytics.join(', ') 
                                : 'No analytics platforms detected'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Tracking Status</dt>
                            <dd className="text-sm flex items-center gap-1">
                              {analysisResult.hasTracking 
                                ? <><CheckCircle className="h-3 w-3 text-green-500" /> Tracking detected</>
                                : <><X className="h-3 w-3 text-red-500" /> No tracking detected</>}
                            </dd>
                          </div>
                          <div className="pt-2">
                            {analysisResult.hasTracking ? (
                              <Badge variant="destructive">Site already has tracking</Badge>
                            ) : (
                              <Badge variant="secondary">Site ready for CBMS tracking</Badge>
                            )}
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Recommendation:</strong> {analysisResult.hasTracking 
                        ? 'This site already has analytics tracking. Installing CBMS will give you deeper behavior insights alongside existing analytics.' 
                        : 'This site has no tracking detected. Installing CBMS will provide comprehensive analytics and customer behavior insights.'}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated API Key Dialog */}
      {generatedApiKey && (
        <Dialog open={!!generatedApiKey} onOpenChange={() => setGeneratedApiKey(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>API Key Created Successfully!</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> This is the only time you'll see the full API key.
                  Copy it now and store it securely.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label>Your API Key:</Label>
                <div className="bg-gray-100 p-4 rounded">
                  <code className="text-sm break-all">{generatedApiKey}</code>
                </div>
                <Button
                  onClick={() => copyToClipboard(generatedApiKey, 'generated-key')}
                  className="w-full"
                >
                  {copied === 'generated-key' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied API Key!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy API Key
                    </>
                  )}
                </Button>
              </div>
              
              <div className="space-y-2 mt-6">
                <Label>Tracking Script:</Label>
                <div className="bg-gray-100 p-4 rounded">
                  <code className="text-sm break-all whitespace-pre-wrap">
                    {getTrackingScript(generatedApiKey, 'https://cbmsystem.vercel.app/api')}
                  </code>
                </div>
                <Button
                  onClick={() => copyToClipboard(getTrackingScript(generatedApiKey, 'https://cbmsystem.vercel.app/api'), 'generated-script')}
                  className="w-full"
                >
                  {copied === 'generated-script' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied Script!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Tracking Script
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium">Installation Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Copy the tracking script above</li>
                  <li>Paste it into the <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code> section of your website</li>
                  <li>Your website will start tracking customer behavior immediately</li>
                </ol>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}