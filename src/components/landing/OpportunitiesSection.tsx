import { useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Briefcase, 
  Trophy, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ExternalLink,
  Building2,
  Search,
  Filter,
  Clock
} from "lucide-react";
import { useOpportunities, Opportunity } from "@/hooks/useOpportunities";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const OpportunityCard = memo(({ opportunity, type }: { opportunity: Opportunity; type: "internship" | "hackathon" }) => {
  const isHackathon = type === "hackathon";
  
  return (
    <motion.div variants={itemVariants}>
      <Card className="h-full bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-slate-100 group overflow-hidden rounded-3xl">
        {isHackathon && <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />}
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
            <Badge 
              variant="outline" 
              className={isHackathon ? "bg-amber-500/5 text-amber-600 border-amber-200" : "bg-primary/5 text-primary border-primary/20"}
            >
              {opportunity.stipend || (isHackathon ? "Prizes Pool" : "Paid Role")}
            </Badge>
          </div>
          <CardTitle className="text-xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">
            {opportunity.title}
          </CardTitle>
          <p className="text-sm text-slate-500 font-bold flex items-center gap-1.5 mt-1">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            {opportunity.organization}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="space-y-2 text-sm font-medium">
            {opportunity.location && (
              <div className="flex items-center gap-2.5 text-slate-500">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="truncate">{opportunity.location}</span>
              </div>
            )}
            {opportunity.duration && (
              <div className="flex items-center gap-2.5 text-slate-500">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{opportunity.duration}</span>
              </div>
            )}
            {opportunity.deadline && (
              <div className="flex items-center gap-2.5 text-slate-500">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Deadline: {new Date(opportunity.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-slate-50">
            {opportunity.application_link && (
              <Button
                size="lg"
                className="w-full gap-2 rounded-xl btn-premium shadow-md"
                asChild
              >
                <a href={opportunity.application_link} target="_blank" rel="noopener noreferrer">
                  {isHackathon ? "Register" : "Apply Now"} <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

OpportunityCard.displayName = "OpportunityCard";

const OpportunitySkeleton = memo(() => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-20 mb-2" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-32 mt-2" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-8 w-full mt-3" />
    </CardContent>
  </Card>
));

OpportunitySkeleton.displayName = "OpportunitySkeleton";

interface OpportunityListProps {
  type: "internship" | "hackathon";
  searchQuery: string;
}

const OpportunityList = ({ type, searchQuery }: OpportunityListProps) => {
  const { data: opportunities, isLoading, error } = useOpportunities(type, searchQuery);
  const isHackathon = type === "hackathon";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <OpportunitySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load opportunities. Please try again later.
      </div>
    );
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery ? `No ${type}s found matching "${searchQuery}"` : `No ${type}s available at the moment.`}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {opportunities.map((opportunity) => (
        <OpportunityCard key={opportunity.id} opportunity={opportunity} type={type} />
      ))}
    </motion.div>
  );
};

export const OpportunitiesSection = () => {
  const [internshipSearch, setInternshipSearch] = useState("");
  const [hackathonSearch, setHackathonSearch] = useState("");

  return (
    <section className="py-32 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Internships Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <div>
                 <h2 className="text-4xl font-black text-slate-900 leading-none">
                   Internships
                 </h2>
                 <p className="text-slate-500 font-medium mt-1">Foundational industry roles</p>
              </div>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Find your next role..."
                value={internshipSearch}
                onChange={(e) => setInternshipSearch(e.target.value)}
                className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          <OpportunityList type="internship" searchQuery={internshipSearch} />
        </motion.div>

        {/* Hackathons Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                 <h2 className="text-4xl font-black text-slate-900 leading-none">
                   Hackathons
                 </h2>
                 <p className="text-slate-500 font-medium mt-1">High-stakes challenges</p>
              </div>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search challenges..."
                value={hackathonSearch}
                onChange={(e) => setHackathonSearch(e.target.value)}
                className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          <OpportunityList type="hackathon" searchQuery={hackathonSearch} />
        </motion.div>
      </div>
    </section>
  );
};
