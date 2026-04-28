import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useBannerUpload } from "@/hooks/useBannerUpload";

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { WorkExperienceSection, EducationSection } from "@/components/profile/ExperienceForms";
import { SkillsSection } from "@/components/profile/SkillsSection";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { CertificationsSection } from "@/components/profile/CertificationsSection";
import { GithubStats } from "@/components/profile/GithubStats";
import { DigitalIDCard } from "@/components/profile/DigitalIDCard";
import { generateIdNumber, generateEdworldEmail } from "@/lib/idUtils";
import { getDisplayName, getDisplayAvatar } from "@/lib/edworldProfile";
import {
  Camera,
  MapPin,
  Link as LinkIcon,
  Linkedin,
  Github,
  Twitter,
  Loader2,
  Save,
  ImagePlus,
  MessageSquare,
  UserPlus,
  Crown,
  Scan,
} from "lucide-react";
import { useNetwork } from "@/hooks/useNetwork";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [searchParams] = useSearchParams();
  const viewingUserId = searchParams.get("id");
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const isOwnProfile = !viewingUserId || viewingUserId === user?.id;
  
  
  // Use appropriate hook based on whose profile we're viewing
  const { profile: ownProfile, isLoading: isOwnLoading, updateProfile, isUpdating } = useProfile();
  const { data: otherProfile, isLoading: isOtherLoading } = useUserProfile(isOwnProfile ? null : viewingUserId);
  
  const profile = isOwnProfile ? ownProfile : otherProfile;
  const isLoading = isOwnProfile ? isOwnLoading : isOtherLoading;
  
  const { uploadAvatar, isUploading } = useAvatarUpload();
  const { uploadBanner, isUploading: isBannerUploading } = useBannerUpload();
  const { sendRequest, connections, pendingRequests, sentRequests } = useNetwork();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  // Check connection status with viewed user
  const isConnected = !isOwnProfile && connections?.some(
    conn => conn.profile?.id === viewingUserId
  );
  const hasPendingRequest = !isOwnProfile && pendingRequests?.some(
    req => req.requester_id === viewingUserId
  );
  const hasSentRequest = !isOwnProfile && sentRequests?.some(
    req => req.receiver_id === viewingUserId && req.status === "pending"
  );
  
  const [formData, setFormData] = useState({
    full_name: "",
    headline: "",
    bio: "",
    location: "",
    website: "",
    linkedin_url: "",
    github_url: "",
    twitter_url: "",
    phone: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  // Initialize form data when profile loads
  useState(() => {
    if (profile && isOwnProfile) {
      setFormData({
        full_name: profile.full_name || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
        linkedin_url: profile.linkedin_url || "",
        github_url: profile.github_url || "",
        twitter_url: profile.twitter_url || "",
        phone: (profile as any).phone || "",
      });
    }
  });

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (isOwnProfile) {
      fileInputRef.current?.click();
    }
  };

  const handleBannerClick = () => {
    if (isOwnProfile) {
      bannerInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadBanner(file);
    }
  };

  const handleConnect = () => {
    if (viewingUserId) {
      sendRequest.mutate(viewingUserId);
    }
  };

  const handleMessage = () => {
    if (viewingUserId) {
      navigate(`/messages?user=${viewingUserId}`);
    }
  };

  const displayName = getDisplayName(profile?.full_name);
  const displayAvatar = getDisplayAvatar(profile?.full_name, profile?.avatar_url);

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isOwnProfile && !profile) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">User not found</p>
          <Button onClick={() => navigate("/network")}>Back to Network</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mx-auto max-w-6xl">
          {/* Profile Header */}
          <Card className="overflow-hidden rounded-[2.5rem] border border-border/50 shadow-2xl shadow-primary/5">
            <div 
              className="h-40 md:h-64 relative bg-gradient-to-r from-primary/20 via-primary to-accent"
              style={profile?.banner_url ? { 
                backgroundImage: `url(${profile.banner_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : undefined}
            >
              {isOwnProfile && (
                <>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-2 right-2 gap-2 shadow-md"
                    onClick={handleBannerClick}
                    disabled={isBannerUploading}
                  >
                    {isBannerUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    {isBannerUploading ? "Uploading..." : "Edit Banner"}
                  </Button>
                </>
              )}
            </div>
            <CardContent className="-mt-16 pb-8 sm:-mt-20 md:-mt-24">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-card shadow-medium">
                    <AvatarImage src={displayAvatar} />
                    <AvatarFallback className="bg-primary text-3xl text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-soft"
                        onClick={handleAvatarClick}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      {displayName}
                    </h1>
                  </div>
                  <p className="text-muted-foreground">
                    {profile?.headline || "Member of Edworld"}
                  </p>
                  {profile?.location && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                </div>

                {isOwnProfile ? (
                  <Button onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleMessage}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    {isConnected ? (
                      <Button variant="secondary" disabled>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Connected
                      </Button>
                    ) : hasSentRequest ? (
                      <Button variant="secondary" disabled>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Request Sent
                      </Button>
                    ) : hasPendingRequest ? (
                      <Button variant="default" onClick={() => navigate("/network")}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Accept Request
                      </Button>
                    ) : (
                      <Button onClick={handleConnect} disabled={sendRequest.isPending}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Achievements Section */}
          <div className="mt-6">
            {(isOwnProfile && user) ? (
              <ProfileBadges userId={user.id} isOwnProfile />
            ) : viewingUserId ? (
              <ProfileBadges userId={viewingUserId} isOwnProfile={false} />
            ) : null}
          </div>

          {/* Profile Content */}
          <div className="mt-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <div className="overflow-x-auto pb-2 scrollbar-hide">
                <TabsList className="glass-white p-1 rounded-xl h-12 flex w-max min-w-full space-x-1">
                  <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4">Overview</TabsTrigger>
                  <TabsTrigger value="experience" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4">Experience</TabsTrigger>
                  <TabsTrigger value="education" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4">Education</TabsTrigger>
                  <TabsTrigger value="certifications" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4">Certificates</TabsTrigger>
                  <TabsTrigger value="skills" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4">Skills</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6">
                <div className="flex flex-col lg:flex-row gap-6 mb-8 mt-2 items-stretch">
                    <div className="w-full lg:w-[340px] flex flex-col items-center lg:items-start gap-4">
                       <DigitalIDCard 
                         profile={profile} 
                         initials={getInitials()} 
                         idNumber={generateIdNumber(profile?.id)} 
                         edworldEmail={generateEdworldEmail(profile, profile?.id, (profile as any)?.email)}
                         className="w-full"
                       />
                       {isOwnProfile && (
                         <Button
                           variant="outline"
                           className="w-full max-w-[280px] sm:max-w-[340px] rounded-xl border-slate-200 hover:bg-slate-50 gap-2 h-11"
                           onClick={() => navigate("/network", { state: { openScanner: true } })}
                         >
                           <Scan className="h-4 w-4 text-primary" />
                           Scan Someone to Connect
                         </Button>
                       )}
                    </div>
                   <div className="flex-1 glass-card p-5 sm:p-6 md:p-8 rounded-[2rem] border-slate-100 flex flex-col justify-center min-h-[180px]">
                      <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-primary mb-2 sm:mb-3">Institutional Status</h2>
                      <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">
                        This digital identity confirms your status as a certified member of the EdWorld Career Operating System.
                        It tracks your velocity, course completion, and institutional standing in real-time.
                      </p>
                      <div className="mt-6 sm:mt-8 flex gap-3 sm:gap-4">
                         <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                         </div>
                         <div className="flex-1">
                            <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-900">Premium Scholar</div>
                            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-0.5 uppercase">Full Access Granted</div>
                         </div>
                      </div>
                   </div>
                </div>

                {profile?.github_url && (
                  <GithubStats githubUrl={profile.github_url} />
                )}
                
                <Card className="glass-card border-none">
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                      {isOwnProfile ? "Your professional narrative" : `About ${displayName}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isEditing && isOwnProfile ? (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                              id="full_name"
                              value={formData.full_name}
                              onChange={(e) =>
                                setFormData({ ...formData, full_name: e.target.value })
                              }
                              placeholder="John Doe"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                              }
                              placeholder="+1 (555) 000-0000"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="headline">Professional Headline</Label>
                          <Input
                            id="headline"
                            value={formData.headline}
                            onChange={(e) =>
                              setFormData({ ...formData, headline: e.target.value })
                            }
                            placeholder="Senior Software Engineer | React Expert"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) =>
                              setFormData({ ...formData, bio: e.target.value })
                            }
                            placeholder="Tell others about your background, skills, and interests..."
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({ ...formData, location: e.target.value })
                            }
                            placeholder="San Francisco, CA"
                          />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="font-medium">Links</h3>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="website" className="flex items-center gap-2">
                                <LinkIcon className="h-4 w-4" /> Website
                              </Label>
                              <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) =>
                                  setFormData({ ...formData, website: e.target.value })
                                }
                                placeholder="https://yourwebsite.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="linkedin" className="flex items-center gap-2">
                                <Linkedin className="h-4 w-4" /> LinkedIn
                              </Label>
                              <Input
                                id="linkedin"
                                value={formData.linkedin_url}
                                onChange={(e) =>
                                  setFormData({ ...formData, linkedin_url: e.target.value })
                                }
                                placeholder="https://linkedin.com/in/yourprofile"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="github" className="flex items-center gap-2">
                                <Github className="h-4 w-4" /> GitHub
                              </Label>
                              <Input
                                id="github"
                                value={formData.github_url}
                                onChange={(e) =>
                                  setFormData({ ...formData, github_url: e.target.value })
                                }
                                placeholder="https://github.com/yourusername"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="twitter" className="flex items-center gap-2">
                                <Twitter className="h-4 w-4" /> Twitter
                              </Label>
                              <Input
                                id="twitter"
                                value={formData.twitter_url}
                                onChange={(e) =>
                                  setFormData({ ...formData, twitter_url: e.target.value })
                                }
                                placeholder="https://twitter.com/yourusername"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={handleSave} disabled={isUpdating}>
                            {isUpdating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          {profile?.bio || (isOwnProfile ? "No bio added yet. Click Edit Profile to add one." : "No bio available.")}
                        </p>
                        {(profile?.website || profile?.linkedin_url || profile?.github_url) && (
                          <>
                            <Separator />
                            <div className="flex flex-wrap gap-3">
                              {profile?.website && (
                                <a
                                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <LinkIcon className="h-4 w-4" /> Website
                                </a>
                              )}
                              {profile?.linkedin_url && (
                                <a
                                  href={profile.linkedin_url.startsWith('http') ? profile.linkedin_url : (profile.linkedin_url.includes('linkedin.com') ? `https://${profile.linkedin_url}` : `https://linkedin.com/in/${profile.linkedin_url.replace('@', '')}`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <Linkedin className="h-4 w-4" /> LinkedIn
                                </a>
                              )}
                              {profile?.github_url && (
                                <a
                                  href={profile.github_url.startsWith('http') ? profile.github_url : (profile.github_url.includes('github.com') ? `https://${profile.github_url}` : `https://github.com/${profile.github_url.replace('@', '')}`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <Github className="h-4 w-4" /> GitHub
                                </a>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {isOwnProfile && (
                <>
                  <TabsContent value="experience">
                    <WorkExperienceSection />
                  </TabsContent>

                  <TabsContent value="education">
                    <EducationSection />
                  </TabsContent>

                  <TabsContent value="certifications">
                    {user && <CertificationsSection userId={user.id} isOwnProfile />}
                  </TabsContent>

                  <TabsContent value="skills">
                    {user && <SkillsSection userId={user.id} isOwnProfile />}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
