"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getCurrentUserProfile, updateProfile, Profile } from "@/lib/profiles"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

export default function SettingsPage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [notifications, setNotifications] = useState({ email: true, sms: false, push: true })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // Avatar upload
    const [avatarUploading, setAvatarUploading] = useState(false)
    // Password change
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [passwordChanged, setPasswordChanged] = useState(false)
    // Account deletion
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        setLoading(true)
        setError(null)
        try {
            const userProfile = await getCurrentUserProfile()
            if (userProfile) {
                setProfile(userProfile)
                setNotifications(userProfile.notification_preferences || { email: true, sms: false, push: true })
            }
        } catch (err) {
            setError("Failed to load profile.")
        } finally {
            setLoading(false)
        }
    }

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!profile) return
        setProfile({ ...profile, [e.target.name]: e.target.value })
    }

    const handleNotificationChange = (type: string, value: boolean) => {
        setNotifications({ ...notifications, [type]: value })
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !profile) return
        setAvatarUploading(true)
        setError(null)
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const filePath = `avatars/${profile.id}.${fileExt}`
        // Upload to Supabase Storage
        let { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true })
        if (uploadError) {
            setError("Failed to upload avatar.")
            setAvatarUploading(false)
            return
        }
        // Get public URL
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        const publicUrl = data.publicUrl
        // Update profile
        const { error: updateError } = await updateProfile({ avatar_url: publicUrl })
        if (updateError) {
            setError("Failed to update profile with avatar.")
            setAvatarUploading(false)
            return
        }
        setProfile({ ...profile, avatar_url: publicUrl })
        setAvatarUploading(false)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile) return
        setSaving(true)
        setError(null)
        try {
            const updates: Partial<Profile> = {
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email,
                notification_preferences: notifications,
            }
            const { error } = await updateProfile(updates)
            if (error) throw error
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            setError("Failed to save settings.")
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async () => {
        setError(null)
        setPasswordChanged(false)
        if (!newPassword) {
            setError("Please enter a new password.")
            return
        }
        // In production, you should re-authenticate the user before changing password!
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) {
            setError(error.message)
            return
        }
        setPasswordChanged(true)
        setCurrentPassword("")
        setNewPassword("")
    }

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
        setDeleting(true);
        setError(null);
        const user = await getCurrentUser();
        if (!user) {
            setError("Not authenticated.");
            setDeleting(false);
            return;
        }
        // Call the edge function
        const res = await fetch("https://rzqoxxgeiwsvdmcckzbu.functions.supabase.co/delete-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id }),
        });
        if (!res.ok) {
            const { error } = await res.json();
            setError(error || "Failed to delete account.");
            setDeleting(false);
            return;
        }
        alert("Account deleted. You will be logged out.");
        window.location.href = "/";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!profile) {
        return <div className="text-center text-red-600">Failed to load profile.</div>
    }

    return (
        <div className="max-w-2xl mx-auto py-8 space-y-6">
            <h1 className="text-3xl font-bold mb-4">Settings</h1>
            <form onSubmit={handleSave} className="space-y-6">
                {/* Profile Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <img
                                src={profile.avatar_url || "/placeholder-user.jpg"}
                                alt="Avatar"
                                className="w-16 h-16 rounded-full object-cover border"
                            />
                            <div>
                                <Label htmlFor="avatar">Change Avatar</Label>
                                <Input
                                    id="avatar"
                                    name="avatar"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={avatarUploading}
                                />
                                {avatarUploading && <span className="text-sm text-blue-600">Uploading...</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="first_name">First Name</Label>
                                <Input id="first_name" name="first_name" value={profile.first_name || ""} onChange={handleProfileChange} />
                            </div>
                            <div>
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input id="last_name" name="last_name" value={profile.last_name || ""} onChange={handleProfileChange} />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" value={profile.email} onChange={handleProfileChange} />
                        </div>
                    </CardContent>
                </Card>

                {/* Password Change Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="current_password">Current Password</Label>
                            <Input id="current_password" name="current_password" type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="new_password">New Password</Label>
                            <Input id="new_password" name="new_password" type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <Button type="button" onClick={handleChangePassword} disabled={!newPassword}>Change Password</Button>
                        {passwordChanged && <span className="text-green-600">Password changed!</span>}
                    </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="emailNotifications">Email Notifications</Label>
                            <Switch id="emailNotifications" checked={notifications.email} onCheckedChange={v => handleNotificationChange("email", v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="smsNotifications">SMS Notifications</Label>
                            <Switch id="smsNotifications" checked={notifications.sms} onCheckedChange={v => handleNotificationChange("sms", v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="pushNotifications">Push Notifications</Label>
                            <Switch id="pushNotifications" checked={notifications.push} onCheckedChange={v => handleNotificationChange("push", v)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Account Deletion Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button type="button" variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete Account"}
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex justify-end items-center gap-4">
                    <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                    {saved && <span className="text-green-600">Saved!</span>}
                    {error && <span className="text-red-600">{error}</span>}
                </div>
            </form>
        </div>
    )
} 