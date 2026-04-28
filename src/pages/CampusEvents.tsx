import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCampusEvents } from "@/hooks/useCampusEvents";
import { format, parseISO } from "date-fns";
import { Calendar, MapPin, Users, Video, Plus, Clock, GraduationCap } from "lucide-react";

export default function CampusEvents() {
  const { events, isLoading, createEvent, rsvpEvent, cancelRsvp } = useCampusEvents();
  const [createOpen, setCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "", description: "", event_type: "campus",
    college_name: "", club_name: "", start_date: "", end_date: "",
    location: "", is_virtual: false, virtual_link: "", max_attendees: null as number | null,
  });

  const handleCreate = async () => {
    await createEvent.mutateAsync({
      ...newEvent,
      start_date: newEvent.start_date || new Date().toISOString(),
      max_attendees: newEvent.max_attendees || null,
    } as any);
    setCreateOpen(false);
    setNewEvent({ title: "", description: "", event_type: "campus", college_name: "", club_name: "", start_date: "", end_date: "", location: "", is_virtual: false, virtual_link: "", max_attendees: null });
  };

  const upcoming = events.filter((e) => new Date(e.start_date) >= new Date());

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      campus: "bg-blue-500/10 text-blue-600",
      club: "bg-purple-500/10 text-purple-600",
      hackathon: "bg-orange-500/10 text-orange-600",
      fest: "bg-pink-500/10 text-pink-600",
      seminar: "bg-green-500/10 text-success",
    };
    return map[type] || "bg-muted text-muted-foreground";
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Campus Events
            </h1>
            <p className="text-muted-foreground mt-1">Discover college events, club activities, hackathons & more</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Create Event</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Campus Event</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Event title" /></div>
                <div><Label>Description</Label><Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Describe the event" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={newEvent.event_type} onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="campus">Campus</SelectItem>
                        <SelectItem value="club">Club Activity</SelectItem>
                        <SelectItem value="hackathon">Hackathon</SelectItem>
                        <SelectItem value="fest">Fest</SelectItem>
                        <SelectItem value="seminar">Seminar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>College</Label><Input value={newEvent.college_name || ""} onChange={(e) => setNewEvent({ ...newEvent, college_name: e.target.value })} placeholder="College name" /></div>
                </div>
                <div><Label>Club Name (optional)</Label><Input value={newEvent.club_name || ""} onChange={(e) => setNewEvent({ ...newEvent, club_name: e.target.value })} placeholder="e.g., Coding Club" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Start</Label><Input type="datetime-local" value={newEvent.start_date} onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })} /></div>
                  <div><Label>End</Label><Input type="datetime-local" value={newEvent.end_date || ""} onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newEvent.is_virtual} onCheckedChange={(c) => setNewEvent({ ...newEvent, is_virtual: c })} />
                  <Label>Virtual Event</Label>
                </div>
                {newEvent.is_virtual ? (
                  <div><Label>Virtual Link</Label><Input value={newEvent.virtual_link || ""} onChange={(e) => setNewEvent({ ...newEvent, virtual_link: e.target.value })} placeholder="https://meet.google.com/..." /></div>
                ) : (
                  <div><Label>Location</Label><Input value={newEvent.location || ""} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Event location" /></div>
                )}
                <Button onClick={handleCreate} disabled={!newEvent.title || createEvent.isPending}>
                  {createEvent.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading events...</div>
        ) : upcoming.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No upcoming campus events</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {upcoming.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex gap-2">
                      <Badge className={typeBadge(event.event_type)}>{event.event_type}</Badge>
                      {event.college_name && <Badge variant="outline">{event.college_name}</Badge>}
                      {event.club_name && <Badge variant="secondary">{event.club_name}</Badge>}
                    </div>
                  </div>
                  <CardTitle className="mt-2">{event.title}</CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(parseISO(event.start_date), "PPP p")}
                    </div>
                    {event.is_virtual ? (
                      <div className="flex items-center gap-1"><Video className="h-4 w-4" /> Virtual</div>
                    ) : event.location ? (
                      <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</div>
                    ) : null}
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" /> {event.rsvp_count} attending
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.user_rsvp ? (
                      <Button variant="outline" onClick={() => cancelRsvp.mutate(event.id)}>Cancel RSVP</Button>
                    ) : (
                      <Button onClick={() => rsvpEvent.mutate(event.id)}>RSVP Now</Button>
                    )}
                    {event.is_virtual && event.virtual_link && event.user_rsvp && (
                      <Button variant="outline" asChild>
                        <a href={event.virtual_link} target="_blank" rel="noopener noreferrer">Join</a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
