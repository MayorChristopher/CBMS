"use client"

import { useEffect } from "react"
import { getCurrentUserProfile } from "@/lib/profiles"
import { useTheme } from "next-themes"

export function ThemeSync() {
    const { setTheme } = useTheme()
    useEffect(() => {
        (async () => {
            try {
                const profile = await getCurrentUserProfile()
                if (profile && profile.theme) {
                    setTheme(profile.theme)
                }
            } catch { }
        })()
    }, [setTheme])
    return null
}