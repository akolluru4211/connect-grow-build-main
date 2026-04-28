import { MainLayout } from "@/components/layout/MainLayout";
import { useJobFairEvents, useUserRegistrations, useRegisterForEvent, useCancelRegistration, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/hooks/useJobFairs";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Users, Video, Building2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function JobFairs() {
  const { user } = useAuth();
  const { data: events = [], isLoading } = useJobFairEvents();
  const { data: registrations = [] } = useUserRegistrations();
  const registerForEvent = useRegisterForEvent();
  const cancelRegistration = useCancelRegistration();

  const isRegistered = (eventId: string) => 
    registrations.some((r) => r.event_id === eventId && r.status === "registered");

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Virtual Job Fairs & Events</h1>
          <p className="mt-2 text-muted-foreground">
            Join live hiring events, employer panels, and career workshops
          </p>
        </div>

        {!user && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between py-4">
              <p className="text-sm">Sign in to register for events and join live sessions</p>
              <Button asChild size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="mb-4 h-6 w-3/4" />
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="flex h-48 flex-col items-center justify-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No upcoming events. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => {
              const registered = isRegistered(event.id);
              return (
                <Card key={event.id} className="transition-all hover:shadow-soft">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge className={EVENT_TYPE_COLORS[event.event_type]}>
                            {EVENT_TYPE_LABELS[event.event_type]}
                          </Badge>
                          {registered && (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="h-3 w-3" /> Registered
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        {event.company && (
                          <CardDescription className="mt-1 flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={event.company.logo_url || undefined} />
                              <AvatarFallback>
                                <Building2 className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            {event.company.name}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>

                    <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.start_time), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(event.start_time), "h:mm a")}
                      </span>
                      {event.max_participants && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Max {event.max_participants} participants
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {user ? (
                        registered ? (
                          <>
                            {event.virtual_link && (
                              <Button asChild className="flex-1">
                                <a href={event.virtual_link} target="_blank" rel="noopener noreferrer">
                                  <Video className="mr-2 h-4 w-4" /> Join Event
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => cancelRegistration.mutate(event.id)}
                              disabled={cancelRegistration.isPending}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => registerForEvent.mutate(event.id)}
                            disabled={registerForEvent.isPending}
                          >
                            Register Now
                          </Button>
                        )
                      ) : (
                        <Button asChild className="w-full" variant="outline">
                          <Link to="/auth">Sign in to Register</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
