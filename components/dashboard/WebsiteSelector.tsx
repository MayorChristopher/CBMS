import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface WebsiteOption {
  id: string
  name: string
}

export function WebsiteSelector({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  const [websites, setWebsites] = useState<WebsiteOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWebsites() {
      setLoading(true)
      const { data, error } = await supabase.from("websites").select("id, name").eq("status", "active")
      if (!error && data) setWebsites(data)
      setLoading(false)
    }
    fetchWebsites()
  }, [])

  return (
    <>
      <label htmlFor="website-selector" className="sr-only">Select Website</label>
      <select
        id="website-selector"
        className="border rounded px-2 py-1 text-sm bg-white"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={loading}
        title="Select Website"
      >
        <option value="">All Websites</option>
        {websites.map(site => (
          <option key={site.id} value={site.id}>{site.name}</option>
        ))}
      </select>
    </>
  )
}
