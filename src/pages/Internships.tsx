import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useInternships, useSavedInternships, useSaveInternship, useApplyToInternship, Internship } from "@/hooks/useInternships";
import { Card, CardContent } from "@/components/ui/card";
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
  GraduationCap,
  Clock,
  DollarSign,
  Building2,
  Bookmark,
  BookmarkCheck,
  Send,
  Calendar,
  ExternalLink,
} from "lucide-react";

const internshipTypes = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "stipend", label: "Stipend" },
];

export default function Internships() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [internshipType, setInternshipType] = useState<string>("");
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  const { data: internships, isLoading } = useInternships({
    search: search || undefined,
    location: location || undefined,
    internshipType: internshipType || undefined,
  });
  const { data: savedIds = [] } = useSavedInternships();
  const saveInternship = useSaveInternship();
  const applyToInternship = useApplyToInternship();

  const formatStipend = (amount: number | null, currency: string | null) => {
    if (!amount) return null;
    return `$${amount}/month`;
  };

  const handleApply = () => {
    if (!selectedInternship) return;
    applyToInternship.mutate(
      { internshipId: selectedInternship.id, coverLetter },
      {
        onSuccess: () => {
          setShowApplyDialog(false);
          setCoverLetter("");
          setSelectedInternship(null);
        },
      }
    );
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Internship Opportunities</h1>
          <p className="mt-2 text-muted-foreground">
            Kickstart your career with hands-on experience
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search internships..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative flex-1 lg:max-w-[200px]">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={internshipType || "all"} onValueChange={(val) => setInternshipType(val === "all" ? "" : val)}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {internshipTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Internship Listings */}
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
          ) : internships?.length === 0 ? (
            <div className="col-span-2 flex h-64 items-center justify-center">
              <div className="text-center">
                <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No internships found</h3>
                <p className="text-muted-foreground">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            internships?.map((internship) => {
              const isSaved = savedIds.includes(internship.id);
              const stipend = formatStipend(internship.stipend_amount, internship.stipend_currency);

              return (
                <Card
                  key={internship.id}
                  className="group cursor-pointer transition-all hover:shadow-soft"
                  onClick={() => setSelectedInternship(internship)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary">
                          {internship.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {internship.companies?.name || "Company"}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveInternship.mutate({ internshipId: internship.id, save: !isSaved });
                        }}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="h-5 w-5 text-primary" />
                        ) : (
                          <Bookmark className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {internship.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {internship.location && (
                        <Badge variant="secondary" className="gap-1">
                          <MapPin className="h-3 w-3" /> {internship.location}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="gap-1 capitalize">
                        <GraduationCap className="h-3 w-3" /> {internship.internship_type}
                      </Badge>
                      {internship.duration_months && (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" /> {internship.duration_months} months
                        </Badge>
                      )}
                      {stipend && (
                         <Badge variant="secondary" className="gap-1">
                           <DollarSign className="h-3 w-3" /> {stipend}
                         </Badge>
                       )}
                     </div>

                     {internship.application_url && (
                       <Button
                         size="sm"
                         variant="outline"
                         className="mt-3 gap-2 w-full"
                         onClick={(e) => {
                           e.stopPropagation();
                           window.open(internship.application_url, '_blank', 'noopener,noreferrer');
                         }}
                       >
                         <ExternalLink className="h-3.5 w-3.5" /> Apply on Site
                       </Button>
                     )}
                   </CardContent>
                 </Card>
               );
             })
           )}
        </div>

        {/* Internship Details Dialog */}
        <Dialog open={!!selectedInternship && !showApplyDialog} onOpenChange={(open) => !open && setSelectedInternship(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            {selectedInternship && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedInternship.title}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {selectedInternship.companies?.name}
                    {selectedInternship.location && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <MapPin className="h-4 w-4" />
                        {selectedInternship.location}
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="capitalize">{selectedInternship.internship_type}</Badge>
                    {selectedInternship.duration_months && (
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" /> {selectedInternship.duration_months} months
                      </Badge>
                    )}
                    {selectedInternship.stipend_amount && (
                      <Badge variant="outline">
                        <DollarSign className="mr-1 h-3 w-3" /> ${selectedInternship.stipend_amount}/month
                      </Badge>
                    )}
                    {selectedInternship.start_date && (
                      <Badge variant="outline">
                        <Calendar className="mr-1 h-3 w-3" /> Starts {new Date(selectedInternship.start_date).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold">About the Internship</h4>
                    <p className="text-muted-foreground">{selectedInternship.description}</p>
                  </div>

                  {selectedInternship.requirements && selectedInternship.requirements.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">Requirements</h4>
                      <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                        {selectedInternship.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedInternship.companies && (
                    <div>
                      <h4 className="mb-2 font-semibold">About {selectedInternship.companies.name}</h4>
                      <p className="text-muted-foreground">{selectedInternship.companies.description}</p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const isSaved = savedIds.includes(selectedInternship.id);
                      saveInternship.mutate({ internshipId: selectedInternship.id, save: !isSaved });
                    }}
                  >
                    {savedIds.includes(selectedInternship.id) ? (
                      <>
                        <BookmarkCheck className="mr-2 h-4 w-4" /> Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="mr-2 h-4 w-4" /> Save
                      </>
                    )}
                  </Button>
                  {selectedInternship.application_url ? (
                    <Button asChild>
                      <a href={selectedInternship.application_url} target="_blank" rel="noopener noreferrer">
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
              <DialogTitle>Apply to {selectedInternship?.title}</DialogTitle>
              <DialogDescription>
                at {selectedInternship?.companies?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cover Letter (Optional)</label>
                <Textarea
                  placeholder="Tell the employer why you're interested in this internship..."
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
              <Button onClick={handleApply} disabled={applyToInternship.isPending}>
                {applyToInternship.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
