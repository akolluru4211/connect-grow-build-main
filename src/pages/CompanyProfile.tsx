import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  Users,
  Globe,
  Briefcase,
  ArrowLeft,
  Plus,
  Edit,
  ExternalLink,
  Clock,
  DollarSign,
} from "lucide-react";
import { useCompany, useCompanyJobs, useCreateJob, useUpdateCompany } from "@/hooks/useCompanyProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const jobTypes = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "remote", label: "Remote" },
];

const experienceLevels = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

export default function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  const { data: company, isLoading: companyLoading } = useCompany(id || "");
  const { data: jobs = [], isLoading: jobsLoading } = useCompanyJobs(id || "");
  const createJob = useCreateJob();
  const updateCompany = useUpdateCompany();

  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    location: "",
    job_type: "",
    experience_level: "",
    salary_min: "",
    salary_max: "",
    requirements: "",
    responsibilities: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    location: "",
    industry: "",
    company_size: "",
    website: "",
  });

  const handleCreateJob = async () => {
    if (!jobForm.title || !jobForm.description || !jobForm.job_type || !jobForm.experience_level) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createJob.mutateAsync({
      company_id: id!,
      title: jobForm.title,
      description: jobForm.description,
      location: jobForm.location || undefined,
      job_type: jobForm.job_type,
      experience_level: jobForm.experience_level,
      salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : undefined,
      salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : undefined,
      requirements: jobForm.requirements ? jobForm.requirements.split("\n").filter(Boolean) : undefined,
      responsibilities: jobForm.responsibilities ? jobForm.responsibilities.split("\n").filter(Boolean) : undefined,
    });

    setJobDialogOpen(false);
    setJobForm({
      title: "",
      description: "",
      location: "",
      job_type: "",
      experience_level: "",
      salary_min: "",
      salary_max: "",
      requirements: "",
      responsibilities: "",
    });
  };

  const openEditDialog = () => {
    if (company) {
      setEditForm({
        name: company.name || "",
        description: company.description || "",
        location: company.location || "",
        industry: company.industry || "",
        company_size: company.company_size || "",
        website: (company as { website?: string }).website || "",
      });
      setEditDialogOpen(true);
    }
  };

  const handleUpdateCompany = async () => {
    await updateCompany.mutateAsync({
      id: id!,
      ...editForm,
    });
    setEditDialogOpen(false);
  };

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `From $${(min / 1000).toFixed(0)}k`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return null;
  };

  if (companyLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-24 rounded-lg mx-auto mb-4" />
                  <Skeleton className="h-6 w-48 mx-auto mb-2" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!company) {
    return (
      <MainLayout>
        <div className="container py-8">
          <Card className="py-12">
            <CardContent className="text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Company not found</h2>
              <Button variant="outline" onClick={() => navigate("/companies")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Companies
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate("/companies")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Avatar className="h-24 w-24 mx-auto rounded-xl mb-4">
                  <AvatarImage src={company.logo_url || undefined} className="object-cover" />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-2xl">
                    {company.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-bold">{company.name}</h1>
                {company.industry && (
                  <p className="text-muted-foreground">{company.industry}</p>
                )}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {company.location && (
                    <Badge variant="secondary">
                      <MapPin className="mr-1 h-3 w-3" />
                      {company.location}
                    </Badge>
                  )}
                  {company.company_size && (
                    <Badge variant="secondary">
                      <Users className="mr-1 h-3 w-3" />
                      {company.company_size}
                    </Badge>
                  )}
                </div>
                {(company as { website?: string }).website && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.open((company as { website?: string }).website, "_blank")}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Visit Website
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                )}
                {(user && isAdmin) && (
                  <Button variant="outline" className="w-full mt-2" onClick={openEditDialog}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </CardContent>
            </Card>

            {company.culture_values && company.culture_values.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Culture & Values</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {company.culture_values.map((value, i) => (
                      <Badge key={i} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="about">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="jobs">
                  Jobs ({jobs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3">About {company.name}</h3>
                    {company.description ? (
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {company.description}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        No description provided.
                      </p>
                    )}
                    {company.work_environment && (
                      <>
                        <h3 className="font-semibold mt-6 mb-3">Work Environment</h3>
                        <p className="text-muted-foreground">{company.work_environment}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="jobs" className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Open Positions</h3>
                  {user && (
                    <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Post Job
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Post a New Job</DialogTitle>
                          <DialogDescription>
                            Create a job listing for {company.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label>Job Title *</Label>
                            <Input
                              value={jobForm.title}
                              onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                              placeholder="e.g. Senior Software Engineer"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description *</Label>
                            <Textarea
                              value={jobForm.description}
                              onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                              placeholder="Describe the role..."
                              rows={4}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Job Type *</Label>
                              <Select
                                value={jobForm.job_type}
                                onValueChange={(v) => setJobForm({ ...jobForm, job_type: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {jobTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Experience Level *</Label>
                              <Select
                                value={jobForm.experience_level}
                                onValueChange={(v) => setJobForm({ ...jobForm, experience_level: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                  {experienceLevels.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                      {level.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                              value={jobForm.location}
                              onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                              placeholder="e.g. New York, NY or Remote"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Min Salary (USD)</Label>
                              <Input
                                type="number"
                                value={jobForm.salary_min}
                                onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })}
                                placeholder="50000"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Max Salary (USD)</Label>
                              <Input
                                type="number"
                                value={jobForm.salary_max}
                                onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })}
                                placeholder="100000"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Requirements (one per line)</Label>
                            <Textarea
                              value={jobForm.requirements}
                              onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                              placeholder="5+ years of experience&#10;Bachelor's degree in CS"
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Responsibilities (one per line)</Label>
                            <Textarea
                              value={jobForm.responsibilities}
                              onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })}
                              placeholder="Lead development team&#10;Architect solutions"
                              rows={3}
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={handleCreateJob}
                            disabled={createJob.isPending}
                          >
                            {createJob.isPending ? "Posting..." : "Post Job"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {jobsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-5 w-48 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : jobs.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No open positions at the moment</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <Card
                        key={job.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/jobs?selected=${job.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{job.title}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary">{job.job_type}</Badge>
                                <Badge variant="outline">{job.experience_level}</Badge>
                                {job.location && (
                                  <Badge variant="outline">
                                    <MapPin className="mr-1 h-3 w-3" />
                                    {job.location}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {formatSalary(job.salary_min, job.salary_max) && (
                              <Badge className="bg-success/10 text-success">
                                <DollarSign className="mr-1 h-3 w-3" />
                                {formatSalary(job.salary_min, job.salary_max)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {job.description}
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Edit Company Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Company Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Input
                    value={editForm.company_size}
                    onChange={(e) => setEditForm({ ...editForm, company_size: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleUpdateCompany}
                disabled={updateCompany.isPending}
              >
                {updateCompany.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
