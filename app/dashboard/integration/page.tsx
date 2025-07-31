"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getCurrentUserProfile, Profile } from "@/lib/profiles"
import { supabase } from "@/lib/supabase"
import { Copy, Plus, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"

interface Website {
  id: string
  user_id: string
  name: string
  url: string
  status: 'active' | 'inactive'
  created_at: string
  last_tracked?: string
}

export default function IntegrationPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [addingWebsite, setAddingWebsite] = useState(false)
  const [newWebsite, setNewWebsite] = useState({ name: '', url: '' })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load user profile
      const userProfile = await getCurrentUserProfile()
      setProfile(userProfile)

      // Load user's websites
      const { data: websitesData, error } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWebsites(websitesData || [])
    } catch (err) {
      console.error('Error loading data:', err)
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
      
      const { data, error } = await supabase
        .from('websites')
        .insert({
          user_id: profile.id,
          name: newWebsite.name,
          url: url,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      setWebsites([data, ...websites])
      setNewWebsite({ name: '', url: '' })
    } catch (err) {
      console.error('Error adding website:', err)
    } finally {
      setAddingWebsite(false)
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
    } catch (err) {
      console.error('Error removing website:', err)
    }
  }

  const copyTrackingScript = async () => {
    if (!profile) return
    
    const script = `<script src="${window.location.origin}/tracking.js?key=${profile.id}"></script>`
    
    try {
      await navigator.clipboard.writeText(script)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getTrackingScript = () => {
    if (!profile) return ''
    return `<script src="${window.location.origin}/tracking.js?key=${profile.id}"></script>`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Integration</h1>
        <p className="text-gray-600">Add your tracking script to websites and monitor user behavior</p>
      </div>

      {/* Tracking Script Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tracking Script</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Copy this script and add it to the &lt;head&gt; section of your website to start tracking user behavior.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <code className="text-sm break-all">{getTrackingScript()}</code>
          </div>
          <Button onClick={copyTrackingScript} disabled={copied}>
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Script
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Add Website Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add Website to Monitor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div key={website.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{website.name}</h3>
                      <Badge variant={website.status === 'active' ? 'default' : 'secondary'}>
                        {website.status === 'active' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ExternalLink className="h-3 w-3" />
                      <a href={website.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {website.url}
                      </a>
                    </div>
                    {website.last_tracked && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last tracked: {new Date(website.last_tracked).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeWebsite(website.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Copy Your Tracking Script</h4>
                <p className="text-sm text-gray-600">Use the "Copy Script" button above to copy your unique tracking code.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Add to Your Website</h4>
                <p className="text-sm text-gray-600">Paste the script in the &lt;head&gt; section of your HTML, before the closing &lt;/head&gt; tag.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Add Website to Monitor</h4>
                <p className="text-sm text-gray-600">Add your website URL above to start collecting data and viewing analytics.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium">View Analytics</h4>
                <p className="text-sm text-gray-600">Check your dashboard to see real-time user behavior data and insights.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 