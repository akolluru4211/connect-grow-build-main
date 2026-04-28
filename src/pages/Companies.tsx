import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Search,
  Plus,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { useCompanies, useCreateCompany, useCompanyJobs } from "@/hooks/useCompanyProfile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Marketing",
  "Consulting",
  "Real Estate",
  "Entertainment",
];

const companySizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

function CompanyCard({
  company,
  onClick,
}: {
  company: {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    location: string | null;
    industry: string | null;
    company_size: string | null;
  };
  onClick: () => void;
}) {
  const { data: jobs = [] } = useCompanyJobs(company.id);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-medium hover:-translate-y-0.5"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarImage src={company.logo_url || undefined} className="object-cover" />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xl">
              {company.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{company.name}</h3>
            {company.industry && (
              <p className="text-sm text-muted-foreground">{company.industry}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {company.location && (
                <Badge variant="secondary" className="text-xs">
                  <MapPin className="mr-1 h-3 w-3" />
                  {company.location}
                </Badge>
              )}
              {company.company_size && (
                <Badge variant="secondary" className="text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {company.company_size}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {company.description && (
          <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
            {company.description}
          </p>
        )}
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            {jobs.length} open position{jobs.length !== 1 ? "s" : ""}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Companies() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: companies = [], isLoading } = useCompanies();
  const createCompany = useCreateCompany();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    industry: "",
    company_size: "",
    website: "",
  });

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      company.description?.toLowerCase().includes(search.toLowerCase());
    const matchesIndustry =
      industryFilter === "all" || company.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    await createCompany.mutateAsync({
      name: formData.name,
      description: formData.description || undefined,
      location: formData.location || undefined,
      industry: formData.industry || undefined,
      company_size: formData.company_size || undefined,
      website: formData.website || undefined,
    });

    setCreateDialogOpen(false);
    setFormData({
      name: "",
      description: "",
      location: "",
      industry: "",
      company_size: "",
      website: "",
    });
  };

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Companies</h1>
            <p className="text-muted-foreground mt-1">
              Discover companies and explore career opportunities
            </p>
          </div>
          {user && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Company Profile</DialogTitle>
                  <DialogDescription>
                    Add your company to connect with talented professionals
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Tell us about your company"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) =>
                          setFormData({ ...formData, industry: value })
                        }
                      >
                        <SelectTrigger id="industry">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size">Company Size</Label>
                      <Select
                        value={formData.company_size}
                        onValueChange={(value) =>
                          setFormData({ ...formData, company_size: value })
                        }
                      >
                        <SelectTrigger id="size">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizes.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreate}
                    disabled={createCompany.isPending}
                  >
                    {createCompany.isPending ? "Creating..." : "Create Company"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="mt-4 h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No companies found</h3>
              <p className="text-muted-foreground mt-1">
                {search || industryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Be the first to add a company!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onClick={() => navigate(`/companies/${company.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
