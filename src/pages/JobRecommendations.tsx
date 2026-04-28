import { MainLayout } from "@/components/layout/MainLayout";
import { useJobRecommendations } from "@/hooks/useJobRecommendations";
import { useApplyToJob, useSaveJob, useSavedJobs, useMyApplications } from "@/hooks/useJobs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Send,
  Building2,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

function MatchScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return "bg-green-500/10 text-success border-green-500/20";
    if (score >= 60) return "bg-yellow-500/10 text-warning border-yellow-500/20";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${getColor()}`}>
      <Sparkles className="h-3.5 w-3.5" />
      {score}% Match
    </div>
  );
}

export default function JobRecommendations() {
  const { data: jobs, isLoading, error } = useJobRecommendations();
  const { data: savedJobs } = useSavedJobs();
  const { data: applications } = useMyApplications();
  const saveJob = useSaveJob();
  const applyToJob = useApplyToJob();
  const [applyingToJob, setApplyingToJob] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");

  const handleApply = async () => {
    if (!applyingToJob) return;
    await applyToJob.mutateAsync({ jobId: applyingToJob, coverLetter });
    setApplyingToJob(null);
    setCoverLetter("");
  };

  const hasApplied = (jobId: string) => applications?.some((a) => a.job_id === jobId);
  const isSaved = (jobId: string) => savedJobs?.includes(jobId);

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Job Recommendations</h1>
              <p className="text-muted-foreground">
                AI-powered job matches based on your profile and skills
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Failed to load recommendations. Please try again.</p>
            </CardContent>
          </Card>
        ) : jobs?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No recommendations yet</h3>
              <p className="text-muted-foreground">Complete your profile to get personalized job recommendations.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs?.map((job) => (
              <Card key={job.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <Avatar className="h-14 w-14 rounded-lg">
                      <AvatarImage src={job.company?.logo_url || undefined} />
                      <AvatarFallback className="rounded-lg">
                        <Building2 className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="text-muted-foreground">{job.company?.name || "Company"}</p>
                        </div>
                        <MatchScoreBadge score={job.match_score} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {job.job_type}
                        </span>
                        {(job.salary_min || job.salary_max) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary_min && job.salary_max
                              ? `${job.salary_currency || "$"}${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k`
                              : job.salary_min
                              ? `From ${job.salary_currency || "$"}${(job.salary_min / 1000).toFixed(0)}k`
                              : `Up to ${job.salary_currency || "$"}${(job.salary_max! / 1000).toFixed(0)}k`}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">{job.experience_level}</Badge>
                        {job.requirements?.slice(0, 3).map((req, i) => (
                          <Badge key={i} variant="outline">{req}</Badge>
                        ))}
                      </div>

                      {(job as any).match_reason && (
                        <p className="mt-3 text-sm text-muted-foreground italic">
                          "{(job as any).match_reason}"
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                        {hasApplied(job.id) ? (
                          <Button variant="outline" disabled>
                            <Send className="mr-2 h-4 w-4" />
                            Applied
                          </Button>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button onClick={() => setApplyingToJob(job.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Apply Now
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Apply to {job.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  at {job.company?.name || "Company"}
                                </p>
                                <div>
                                  <label className="text-sm font-medium">Cover Letter (optional)</label>
                                  <Textarea
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Why are you a great fit for this role?"
                                    rows={5}
                                    className="mt-2"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={handleApply} disabled={applyToJob.isPending}>
                                  {applyToJob.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                  )}
                                  Submit Application
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => saveJob.mutate({ jobId: job.id, save: !isSaved(job.id) })}
                        >
                          {isSaved(job.id) ? (
                            <BookmarkCheck className="h-4 w-4" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground">
                        Posted {format(new Date(job.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
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
