import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/hooks/useSettings";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import {
  Bell,
  Shield,
  User,
  Eye,
  Mail,
  Briefcase,
  Users,
  MessageSquare,
  Calendar,
  LogOut,
  Smartphone,
  Loader2,
  Globe,
} from "lucide-react";

export default function Settings() {
  const { settings, isLoading, updateSettings } = useSettings();
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe, isSubscribing } = usePushNotifications();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and privacy</p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="language">
              <Globe className="h-4 w-4 mr-2" />
              Language
            </TabsTrigger>
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Choose what updates you want to receive via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your activity
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings?.email_notifications ?? true}
                    onCheckedChange={(checked) =>
                      updateSettings.mutate({ email_notifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="job-alerts" className="font-medium">
                        Job Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about new job opportunities
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="job-alerts"
                    checked={settings?.job_alerts ?? true}
                    onCheckedChange={(checked) =>
                      updateSettings.mutate({ job_alerts: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="mentorship-notifications" className="font-medium">
                        Mentorship Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Updates about mentorship requests and sessions
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="mentorship-notifications"
                    checked={settings?.mentorship_notifications ?? true}
                    onCheckedChange={(checked) =>
                      updateSettings.mutate({ mentorship_notifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="message-notifications" className="font-medium">
                        Message Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you receive new messages
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="message-notifications"
                    checked={settings?.message_notifications ?? true}
                    onCheckedChange={(checked) =>
                      updateSettings.mutate({ message_notifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="event-reminders" className="font-medium">
                        Event Reminders
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive reminders for upcoming events
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="event-reminders"
                    checked={settings?.event_reminders ?? true}
                    onCheckedChange={(checked) =>
                      updateSettings.mutate({ event_reminders: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {!isSupported 
                          ? "Not supported in this browser"
                          : permission === "denied"
                          ? "Notifications blocked - enable in browser settings"
                          : "Get real-time alerts when the app is in the background"
                        }
                      </p>
                    </div>
                  </div>
                  {isSupported && permission !== "denied" && (
                    <Button
                      variant={isSubscribed ? "outline" : "default"}
                      size="sm"
                      onClick={() => isSubscribed ? unsubscribe() : subscribe()}
                      disabled={isSubscribing}
                    >
                      {isSubscribing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isSubscribed ? (
                        "Disable"
                      ) : (
                        "Enable"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control who can see your information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="font-medium">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">
                        Control who can view your profile
                      </p>
                    </div>
                  </div>
                  <Select
                    value={settings?.profile_visibility ?? "public"}
                    onValueChange={(value) =>
                      updateSettings.mutate({ profile_visibility: value })
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="connections">Connections Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-email" className="font-medium">
                      Show Email Address
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Display your email on your public profile
                    </p>
                  </div>
                  <Switch
                    id="show-email"
                    checked={settings?.show_email ?? false}
                    onCheckedChange={(checked) =>
                      updateSettings.mutate({ show_email: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-phone" className="font-medium">
                      Show Phone Number
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Display your phone number on your profile
                    </p>
                  </div>
                  <Switch
                    id="show-phone"
                    checked={settings?.show_phone ?? false}
                    onCheckedChange={(checked) =>
                      updateSettings.mutate({ show_phone: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-location" className="font-medium">
                      Show Location
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Display your location on your profile
                    </p>
                  </div>
                  <Switch
                    id="show-location"
                    checked={settings?.show_location ?? true}
                    onCheckedChange={(checked) =>
                      updateSettings.mutate({ show_location: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language">
            <Card>
              <CardHeader>
                <CardTitle>Language Preferences</CardTitle>
                <CardDescription>
                  Choose your preferred language for the interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageSelector />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Account Created</span>
                    <span className="font-medium">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manage Profile</CardTitle>
                  <CardDescription>Update your profile information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => navigate("/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible account actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sign Out</p>
                      <p className="text-sm text-muted-foreground">
                        Sign out from your account on this device
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
