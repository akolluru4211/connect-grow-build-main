import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isSameDay } from "date-fns";
import { CalendarIcon, MapPin, Users, Video, Plus, Clock } from "lucide-react";

export default function Events() {
  const { user } = useAuth();
  const { events, isLoading, createEvent, rsvpEvent, cancelRsvp } = useEvents();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_type: "workshop",
    start_date: "",
    end_date: "",
    location: "",
    is_virtual: false,
    virtual_link: "",
    max_attendees: 0,
  });

  const handleCreateEvent = async () => {
    await createEvent.mutateAsync({
      ...newEvent,
      start_date: newEvent.start_date || new Date().toISOString(),
      max_attendees: newEvent.max_attendees || null,
    });
    setCreateDialogOpen(false);
    setNewEvent({
      title: "",
      description: "",
      event_type: "workshop",
      start_date: "",
      end_date: "",
      location: "",
      is_virtual: false,
      virtual_link: "",
      max_attendees: 0,
    });
  };

  const filteredEvents = selectedDate
    ? events?.filter((event) => isSameDay(parseISO(event.start_date), selectedDate))
    : events;

  const upcomingEvents = events?.filter((event) => new Date(event.start_date) >= new Date()) || [];

  const eventTypeBadgeColor = (type: string) => {
    switch (type) {
      case "workshop":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "webinar":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "networking":
        return "bg-green-500/10 text-success border-green-500/20";
      case "conference":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground">Discover and join events in your field</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Event description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Event Type</Label>
                    <Select
                      value={newEvent.event_type}
                      onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="webinar">Webinar</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                        <SelectItem value="conference">Conference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Max Attendees</Label>
                    <Input
                      type="number"
                      value={newEvent.max_attendees || ""}
                      onChange={(e) => setNewEvent({ ...newEvent, max_attendees: parseInt(e.target.value) || 0 })}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.start_date}
                      onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.end_date}
                      onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newEvent.is_virtual}
                    onCheckedChange={(checked) => setNewEvent({ ...newEvent, is_virtual: checked })}
                  />
                  <Label>Virtual Event</Label>
                </div>
                {newEvent.is_virtual ? (
                  <div>
                    <Label>Virtual Link</Label>
                    <Input
                      value={newEvent.virtual_link}
                      onChange={(e) => setNewEvent({ ...newEvent, virtual_link: e.target.value })}
                      placeholder="https://zoom.us/..."
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Event location"
                    />
                  </div>
                )}
                <Button onClick={handleCreateEvent} disabled={!newEvent.title || createEvent.isPending}>
                  {createEvent.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <div className="grid gap-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading events...</div>
              ) : upcomingEvents.length === 0 ? (
                <Card className="py-12 text-center">
                  <CardContent>
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No upcoming events</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className={eventTypeBadgeColor(event.event_type)}>{event.event_type}</Badge>
                          <CardTitle className="mt-2">{event.title}</CardTitle>
                          <CardDescription className="mt-1">{event.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(parseISO(event.start_date), "PPP p")}
                        </div>
                        {event.is_virtual ? (
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            Virtual Event
                          </div>
                        ) : (
                          event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          )
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.rsvp_count} attending
                          {event.max_attendees && ` / ${event.max_attendees} max`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {event.user_rsvp === "going" ? (
                          <Button variant="outline" onClick={() => cancelRsvp.mutate(event.id)}>
                            Cancel RSVP
                          </Button>
                        ) : (
                          <Button onClick={() => rsvpEvent.mutate({ eventId: event.id, status: "going" })}>
                            RSVP Now
                          </Button>
                        )}
                        {event.is_virtual && event.virtual_link && event.user_rsvp === "going" && (
                          <Button variant="outline" asChild>
                            <a href={event.virtual_link} target="_blank" rel="noopener noreferrer">
                              Join Virtual Event
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <div className="grid md:grid-cols-[300px_1fr] gap-6">
              <Card>
                <CardContent className="pt-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md"
                  />
                </CardContent>
              </Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Events on {selectedDate ? format(selectedDate, "PPP") : "selected date"}
                </h3>
                {filteredEvents?.length === 0 ? (
                  <Card className="py-8 text-center">
                    <CardContent>
                      <p className="text-muted-foreground">No events on this date</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredEvents?.map((event) => (
                    <Card key={event.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge className={eventTypeBadgeColor(event.event_type)}>{event.event_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(event.start_date), "p")}
                          </span>
                        </div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          {event.user_rsvp === "going" ? (
                            <Button size="sm" variant="outline" onClick={() => cancelRsvp.mutate(event.id)}>
                              Cancel RSVP
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => rsvpEvent.mutate({ eventId: event.id, status: "going" })}>
                              RSVP
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
