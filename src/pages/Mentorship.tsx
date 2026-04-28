import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMentorship } from "@/hooks/useMentorship";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Star, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { getDisplayName, getDisplayAvatar } from "@/lib/edworldProfile";

export default function Mentorship() {
  const { user } = useAuth();
  const {
    myProfile,
    profileLoading,
    mentors,
    mentorsLoading,
    connections,
    saveProfile,
    requestMentorship,
    updateConnectionStatus,
  } = useMentorship();

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    is_mentor: myProfile?.is_mentor || false,
    is_mentee: myProfile?.is_mentee || false,
    skills: myProfile?.skills?.join(", ") || "",
    goals: myProfile?.goals?.join(", ") || "",
    bio: myProfile?.bio || "",
    availability: myProfile?.availability || "",
    experience_years: myProfile?.experience_years || 0,
    max_mentees: myProfile?.max_mentees || 3,
  });

  const handleSaveProfile = async () => {
    await saveProfile.mutateAsync({
      is_mentor: profileForm.is_mentor,
      is_mentee: profileForm.is_mentee,
      skills: profileForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
      goals: profileForm.goals.split(",").map((s) => s.trim()).filter(Boolean),
      bio: profileForm.bio,
      availability: profileForm.availability,
      experience_years: profileForm.experience_years,
      max_mentees: profileForm.max_mentees,
    });
    setProfileDialogOpen(false);
  };

  const handleRequestMentorship = async () => {
    if (!selectedMentor) return;
    await requestMentorship.mutateAsync({
      mentorId: selectedMentor,
      message: requestMessage,
    });
    setRequestDialogOpen(false);
    setSelectedMentor(null);
    setRequestMessage("");
  };

  const pendingRequests = connections?.filter(
    (c) => c.status === "pending" && c.mentor_id === user?.id
  );

  const myConnections = connections?.filter((c) => c.status === "accepted");

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mentorship</h1>
            <p className="text-muted-foreground">Connect with mentors or become one yourself</p>
          </div>
          <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                {myProfile ? "Edit Profile" : "Setup Profile"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Mentorship Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={profileForm.is_mentor}
                      onCheckedChange={(checked) => setProfileForm({ ...profileForm, is_mentor: checked })}
                    />
                    <Label>I want to be a mentor</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={profileForm.is_mentee}
                      onCheckedChange={(checked) => setProfileForm({ ...profileForm, is_mentee: checked })}
                    />
                    <Label>I'm looking for a mentor</Label>
                  </div>
                </div>
                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <Label>Skills (comma-separated)</Label>
                  <Input
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                    placeholder="React, JavaScript, Career Advice..."
                  />
                </div>
                <div>
                  <Label>Goals (comma-separated)</Label>
                  <Input
                    value={profileForm.goals}
                    onChange={(e) => setProfileForm({ ...profileForm, goals: e.target.value })}
                    placeholder="Learn React, Get first job, Career transition..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Years of Experience</Label>
                    <Input
                      type="number"
                      value={profileForm.experience_years}
                      onChange={(e) => setProfileForm({ ...profileForm, experience_years: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Max Mentees</Label>
                    <Input
                      type="number"
                      value={profileForm.max_mentees}
                      onChange={(e) => setProfileForm({ ...profileForm, max_mentees: parseInt(e.target.value) || 3 })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Availability</Label>
                  <Input
                    value={profileForm.availability}
                    onChange={(e) => setProfileForm({ ...profileForm, availability: e.target.value })}
                    placeholder="Weekends, 2 hours/week..."
                  />
                </div>
                <Button onClick={handleSaveProfile} disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="find" className="space-y-6">
          <TabsList>
            <TabsTrigger value="find">Find Mentors</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {pendingRequests && pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="connections">My Connections</TabsTrigger>
          </TabsList>

          <TabsContent value="find">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentorsLoading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">Loading mentors...</div>
              ) : mentors?.length === 0 ? (
                <Card className="col-span-full py-12 text-center">
                  <CardContent>
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No mentors available yet</p>
                  </CardContent>
                </Card>
              ) : (
                mentors?.filter((m) => m.user_id !== user?.id).map((mentor) => (
                  <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={getDisplayAvatar(mentor.profile?.full_name, mentor.profile?.avatar_url)} />
                          <AvatarFallback>
                            {getDisplayName(mentor.profile?.full_name).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{getDisplayName(mentor.profile?.full_name)}</CardTitle>
                          <CardDescription>{mentor.profile?.headline}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{mentor.bio}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {mentor.skills?.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          {mentor.experience_years} years
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {mentor.availability || "Flexible"}
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          setSelectedMentor(mentor.user_id);
                          setRequestDialogOpen(true);
                        }}
                        disabled={connections?.some(
                          (c) => c.mentor_id === mentor.user_id && c.mentee_id === user?.id
                        )}
                      >
                        {connections?.some(
                          (c) => c.mentor_id === mentor.user_id && c.mentee_id === user?.id
                        )
                          ? "Request Sent"
                          : "Request Mentorship"}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <div className="space-y-4">
              {pendingRequests?.length === 0 ? (
                <Card className="py-12 text-center">
                  <CardContent>
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No pending requests</p>
                  </CardContent>
                </Card>
              ) : (
                pendingRequests?.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Mentorship Request</p>
                          <p className="text-sm text-muted-foreground">{request.message}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              updateConnectionStatus.mutate({ connectionId: request.id, status: "accepted" })
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateConnectionStatus.mutate({ connectionId: request.id, status: "rejected" })
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="connections">
            <div className="space-y-4">
              {myConnections?.length === 0 ? (
                <Card className="py-12 text-center">
                  <CardContent>
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No active connections</p>
                  </CardContent>
                </Card>
              ) : (
                myConnections?.map((connection) => (
                  <Card key={connection.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {connection.mentor_id === user?.id ? "ME" : "MR"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {connection.mentor_id === user?.id ? "Mentee" : "Mentor"} Connection
                            </p>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Mentorship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Message (optional)</Label>
                <Textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Introduce yourself and explain why you'd like to connect..."
                  rows={4}
                />
              </div>
              <Button onClick={handleRequestMentorship} disabled={requestMentorship.isPending}>
                {requestMentorship.isPending ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
