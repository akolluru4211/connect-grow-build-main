import { useState } from "react";
import { useCertifications, Certification } from "@/hooks/useCertifications";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Award, Plus, Pencil, Trash2, ExternalLink, Calendar, BadgeCheck, Sparkles, Share2 } from "lucide-react";
import { format, parseISO, isBefore } from "date-fns";
import { motion } from "framer-motion";

interface CertificationsSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

export function CertificationsSection({ userId, isOwnProfile = false }: CertificationsSectionProps) {
  const { user } = useAuth();
  const { certifications, isLoading, addCertification, updateCertification, deleteCertification } = useCertifications(userId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [edworldDialogOpen, setEdworldDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    issuing_organization: "",
    issue_date: "",
    expiry_date: "",
    credential_id: "",
    credential_url: "",
    description: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      issuing_organization: "",
      issue_date: "",
      expiry_date: "",
      credential_id: "",
      credential_url: "",
      description: "",
    });
    setEditingCert(null);
  };

  const handleOpenDialog = (cert?: Certification) => {
    if (cert) {
      setEditingCert(cert);
      setFormData({
        name: cert.name,
        issuing_organization: cert.issuing_organization,
        issue_date: cert.issue_date || "",
        expiry_date: cert.expiry_date || "",
        credential_id: cert.credential_id || "",
        credential_url: cert.credential_url || "",
        description: cert.description || "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      issuing_organization: formData.issuing_organization,
      issue_date: formData.issue_date || null,
      expiry_date: formData.expiry_date || null,
      credential_id: formData.credential_id || null,
      credential_url: formData.credential_url || null,
      description: formData.description || null,
    };

    if (editingCert) {
      await updateCertification.mutateAsync({ id: editingCert.id, ...payload });
    } else {
      await addCertification.mutateAsync(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleCreateEdworldCertificate = async () => {
    const credentialId = `EDW-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    await addCertification.mutateAsync({
      name: "Professional Career OS Specialist",
      issuing_organization: "EdWorld co.",
      issue_date: new Date().toISOString().split("T")[0],
      expiry_date: null,
      credential_id: credentialId,
      credential_url: "https://edworld.pro/verify",
      description: "Recognized for mastering the Career OS modules including ATS optimization and AI project generation.",
    });
    setEdworldDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this certification?")) {
      await deleteCertification.mutateAsync(id);
    }
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return isBefore(parseISO(expiryDate), new Date());
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/5 border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Award className="h-6 w-6 text-primary" />
           <h3 className="text-xl font-bold text-foreground">Certificate Gallery</h3>
        </div>
        
        {isOwnProfile && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" onClick={() => setEdworldDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" /> EdWorld Cert
            </Button>
            <Button size="sm" onClick={() => handleOpenDialog()} className="btn-premium">
              <Plus className="mr-2 h-4 w-4" /> Add New
            </Button>
          </div>
        )}
      </div>

      {certifications.length === 0 ? (
        <Card className="glass-card border-none flex flex-col items-center justify-center py-16 text-center">
            <Award className="h-12 w-12 text-slate-600 mb-4" />
            <p className="text-muted-foreground">
              {isOwnProfile ? "No certifications showcased yet." : "No certifications listed."}
            </p>
            {isOwnProfile && (
              <Button variant="link" onClick={() => handleOpenDialog()} className="mt-2 text-primary">
                Add your first certification
              </Button>
            )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certifications.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 relative group overflow-hidden border-white/5"
            >
              {/* Decorative background icon */}
              <div className="absolute -right-4 -bottom-4 text-primary/5 rotate-12 transition-transform group-hover:scale-110 duration-500">
                <Award className="h-32 w-32" />
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Award className="h-6 w-6" />
                  </div>
                  {isOwnProfile && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white/5" onClick={() => handleOpenDialog(cert)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-white/5" onClick={() => handleDelete(cert.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <h4 className="font-bold text-lg text-slate-100 group-hover:text-primary transition-colors line-clamp-1">{cert.name}</h4>
                <p className="text-sm text-primary font-medium flex items-center gap-1.5 mt-1">
                  {cert.issuing_organization}
                  {cert.issuing_organization.includes("EdWorld") && <BadgeCheck className="h-3.5 w-3.5" />}
                </p>

                <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {cert.issue_date && format(parseISO(cert.issue_date), "MMM yyyy")}
                  </div>
                  {cert.expiry_date ? (
                    <div className={`flex items-center gap-1.5 ${isExpired(cert.expiry_date) ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isExpired(cert.expiry_date) ? 'Expired' : 'Active'}
                    </div>
                  ) : (
                    <div className="text-slate-600">Lifetime Access</div>
                  )}
                </div>

                {cert.description && (
                  <p className="text-xs text-slate-400 mt-4 line-clamp-2 leading-relaxed italic">
                    "{cert.description}"
                  </p>
                )}

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                   {cert.credential_url ? (
                     <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5">
                       <ExternalLink className="h-3.5 w-3.5" /> Verify Credential
                     </a>
                   ) : <div />}
                   <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold uppercase text-slate-400 hover:bg-white/5 group-hover:text-slate-200">
                     <Share2 className="h-3.5 w-3.5 mr-2" /> Share Proof
                   </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={edworldDialogOpen} onOpenChange={setEdworldDialogOpen}>
        <DialogContent className="glass-card border-none max-w-md">
            <DialogHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    EdWorld co. Certification
                </CardTitle>
                <CardDescription className="text-slate-400">
                    Claim your official platform proficiency certificate.
                </CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-sm text-slate-300">
                    You have unlocked this certificate by completing the Career OS onboarding and setting up your technical profile.
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEdworldDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateEdworldCertificate} className="btn-premium">Claim Certificate</Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-none max-w-lg scroll-area overflow-y-auto max-h-[90vh]">
            <DialogHeader>
                <DialogTitle>{editingCert ? "Modify Achievement" : "Add Professional Certification"}</DialogTitle>
                <CardDescription className="text-slate-400">
                    Update your certification details.
                </CardDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. AWS Cloud Practitioner" className="bg-white/5 border-white/10" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Organization *</Label>
                        <Input value={formData.issuing_organization} onChange={e => setFormData({...formData, issuing_organization: e.target.value})} placeholder="e.g. Amazon Web Services" className="bg-white/5 border-white/10" required />
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Issue Date</Label>
                        <Input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-2">
                        <Label>Expiry Date (Optional)</Label>
                        <Input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="bg-white/5 border-white/10" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Credential URL</Label>
                    <Input value={formData.credential_url} onChange={e => setFormData({...formData, credential_url: e.target.value})} placeholder="https://..." className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Briefly describe what you learned..." className="bg-white/5 border-white/10" rows={3} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="btn-premium">{editingCert ? "Save Changes" : "Add Certificate"}</Button>
                </div>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
