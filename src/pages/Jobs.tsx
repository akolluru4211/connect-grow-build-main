import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useJobs, useSavedJobs, useSaveJob, useApplyToJob, useMyApplications, Job } from "@/hooks/useJobs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  Bookmark,
  BookmarkCheck,
  Send,
  Filter,
  Sparkles,
  CheckCircle,
  ExternalLink,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleAd } from "@/components/ads/GoogleAd";

const jobTypes = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const experienceLevels = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  const { data: jobs, isLoading } = useJobs({
    search: search || undefined,
    location: location || undefined,
    jobType: jobType || undefined,
    experienceLevel: experienceLevel || undefined,
  });
  const { data: savedJobIds = [] } = useSavedJobs();
  const { data: applications = [] } = useMyApplications();
  const saveJob = useSaveJob();
  const applyToJob = useApplyToJob();
  const navigate = useNavigate();
  const [seenJobs, setSeenJobs] = useState<Set<string>>(new Set());

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setSeenJobs(prev => {
      const next = new Set(prev);
      next.add(job.id);
      return next;
    });
  };

  const appliedJobIds = applications.map(a => a.job_id);

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return null;
    const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return `Up to ${fmt(max!)}`;
  };

  const handleApply = () => {
    if (!selectedJob) return;
    applyToJob.mutate(
      { jobId: selectedJob.id, coverLetter },
      {
        onSuccess: () => {
          setShowApplyDialog(false);
          setCoverLetter("");
          setSelectedJob(null);
        },
      }
    );
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Find Your Dream Job</h1>
          <p className="mt-2 text-muted-foreground">
            Discover opportunities that match your skills and career goals
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 rounded-[2rem] border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search roles, skills, or companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 rounded-2xl border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
              <div className="relative flex-1 lg:max-w-[200px] w-full">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-12 h-12 rounded-2xl border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
              <Select value={jobType || "all"} onValueChange={(val) => setJobType(val === "all" ? "" : val)}>
                <SelectTrigger className="w-full lg:w-[150px] h-12 rounded-2xl border-border bg-background font-medium">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  {jobTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="rounded-lg">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={experienceLevel || "all"} onValueChange={(val) => setExperienceLevel(val === "all" ? "" : val)}>
                <SelectTrigger className="w-full lg:w-[150px] h-12 rounded-2xl border-border bg-background font-medium">
                  <SelectValue placeholder="Experience" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="all">All Levels</SelectItem>
                  {experienceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* AdSense Placement */}
        <div className="mb-6">
          <GoogleAd 
            className="rounded-xl border border-border/40 bg-card shadow-sm p-2 w-full" 
            adFormat="horizontal" 
          />
        </div>

        {/* Job Listings */}
        <div className="grid gap-4 lg:grid-cols-2">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="mb-4 h-6 w-3/4" />
                  <Skeleton className="mb-2 h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))
          ) : jobs?.length === 0 ? (
            <div className="col-span-2 flex h-64 items-center justify-center">
              <div className="text-center">
                <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No jobs found</h3>
                <p className="text-muted-foreground">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            jobs?.map((job) => {
              const isSaved = savedJobIds.includes(job.id);
              const hasApplied = appliedJobIds.includes(job.id);
              const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

              return (
                <Card
                  key={job.id}
                  className="group cursor-pointer transition-all glass-card border-none hover:-translate-y-1"
                  onClick={() => handleJobClick(job)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground font-medium">
                          <Building2 className="h-3.5 w-3.5" />
                          {job.companies?.name || "Global Tech"}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`shrink-0 h-9 w-9 rounded-xl hover:bg-primary/5 ${isSaved ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          saveJob.mutate({ jobId: job.id, save: !isSaved });
                        }}
                      >
                        {isSaved ? <BookmarkCheck className="h-5 w-5 fill-current" /> : <Bookmark className="h-5 w-5" />}
                      </Button>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground font-medium">
                      {job.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {job.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-bold uppercase tracking-wider bg-muted/50 px-2 py-1 rounded-md">
                          <MapPin className="h-3 w-3" /> {job.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-bold uppercase tracking-wider bg-muted/50 px-2 py-1 rounded-md">
                        <Briefcase className="h-3 w-3" /> {job.job_type}
                      </div>
                      {salary && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded-md">
                          <DollarSign className="h-3 w-3" /> {salary}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      {hasApplied ? (
                        <Button className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/10" disabled>
                          <CheckCircle className="mr-2 h-4 w-4" /> Applied successfully
                        </Button>
                      ) : (
                        <>
                          <Button 
                            className="flex-1 btn-premium h-11"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJob(job);
                              setShowApplyDialog(true);
                            }}
                          >
                            <Send className="mr-2 h-4 w-4" /> Standard Apply
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 h-11"
                            onClick={(e) => {
                              e.stopPropagation();
                              import("sonner").then(({ toast }) => {
                                toast.info("AI Tailoring in progress...", {
                                  description: "Optimizing your profile for " + job.title,
                                  icon: <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                                });
                                setTimeout(() => {
                                  applyToJob.mutate({ jobId: job.id });
                                }, 2000);
                              });
                            }}
                          >
                            <Sparkles className="mr-2 h-4 w-4" /> One-Click AI Apply
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Job Details Dialog */}
        <Dialog open={!!selectedJob && !showApplyDialog} onOpenChange={(open) => !open && setSelectedJob(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            {selectedJob && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {selectedJob.companies?.name}
                    {selectedJob.location && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <MapPin className="h-4 w-4" />
                        {selectedJob.location}
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="capitalize">{selectedJob.job_type}</Badge>
                    <Badge variant="secondary" className="capitalize">
                      {selectedJob.experience_level} level
                    </Badge>
                    {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency) && (
                      <Badge variant="outline">
                        {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency)}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold">About the Role</h4>
                    <p className="text-muted-foreground">{selectedJob.description}</p>
                  </div>

                  {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">Requirements</h4>
                      <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                        {selectedJob.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">Responsibilities</h4>
                      <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                        {selectedJob.responsibilities.map((resp, i) => (
                          <li key={i}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedJob.companies && (
                    <div>
                      <h4 className="mb-2 font-semibold">About {selectedJob.companies.name}</h4>
                      <p className="text-muted-foreground">{selectedJob.companies.description}</p>
                      {selectedJob.companies.culture_values && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedJob.companies.culture_values.map((value, i) => (
                            <Badge key={i} variant="outline">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const isSaved = savedJobIds.includes(selectedJob.id);
                      saveJob.mutate({ jobId: selectedJob.id, save: !isSaved });
                    }}
                  >
                    {savedJobIds.includes(selectedJob.id) ? (
                      <>
                        <BookmarkCheck className="mr-2 h-4 w-4" /> Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="mr-2 h-4 w-4" /> Save Job
                      </>
                    )}
                  </Button>
                  {appliedJobIds.includes(selectedJob.id) ? (
                    <Button disabled>
                      <CheckCircle className="mr-2 h-4 w-4" /> Already Applied
                    </Button>
                  ) : selectedJob.application_url ? (
                    <Button asChild>
                      <a href={selectedJob.application_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> Apply on Company Site
                      </a>
                    </Button>
                  ) : (
                    <Button onClick={() => setShowApplyDialog(true)}>
                      <Send className="mr-2 h-4 w-4" /> Apply Now
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Apply Dialog */}
        <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply to {selectedJob?.title}</DialogTitle>
              <DialogDescription>
                at {selectedJob?.companies?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cover Letter (Optional)</label>
                <Textarea
                  placeholder="Tell the employer why you're a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={applyToJob.isPending}>
                {applyToJob.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
