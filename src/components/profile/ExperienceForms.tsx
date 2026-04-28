import { useState } from "react";
import { useWorkExperience, useEducation, WorkExperience, Education } from "@/hooks/useExperience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, GraduationCap, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ExperienceFormProps {
  experience?: WorkExperience | null;
  onClose: () => void;
  onSave: (data: Omit<WorkExperience, "id" | "user_id" | "created_at" | "updated_at">) => void;
  isLoading: boolean;
}

function ExperienceForm({ experience, onClose, onSave, isLoading }: ExperienceFormProps) {
  const [formData, setFormData] = useState({
    company_name: experience?.company_name || "",
    title: experience?.title || "",
    location: experience?.location || "",
    start_date: experience?.start_date || "",
    end_date: experience?.end_date || "",
    is_current: experience?.is_current || false,
    description: experience?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Company Name *</Label>
          <Input
            required
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Job Title *</Label>
          <Input
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input
            type="date"
            required
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        {!formData.is_current && (
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={formData.end_date || ""}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="is_current"
          checked={formData.is_current}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_current: !!checked, end_date: checked ? null : formData.end_date })
          }
        />
        <Label htmlFor="is_current">I currently work here</Label>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          placeholder="Describe your responsibilities and achievements..."
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {experience ? "Update" : "Add"} Experience
        </Button>
      </DialogFooter>
    </form>
  );
}

interface EducationFormProps {
  education?: Education | null;
  onClose: () => void;
  onSave: (data: Omit<Education, "id" | "user_id" | "created_at" | "updated_at">) => void;
  isLoading: boolean;
}

function EducationForm({ education, onClose, onSave, isLoading }: EducationFormProps) {
  const [formData, setFormData] = useState({
    institution: education?.institution || "",
    degree: education?.degree || "",
    field_of_study: education?.field_of_study || "",
    start_date: education?.start_date || "",
    end_date: education?.end_date || "",
    is_current: education?.is_current || false,
    description: education?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Institution *</Label>
        <Input
          required
          value={formData.institution}
          onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Degree *</Label>
          <Input
            required
            value={formData.degree}
            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
            placeholder="e.g. Bachelor of Science"
          />
        </div>
        <div className="space-y-2">
          <Label>Field of Study</Label>
          <Input
            value={formData.field_of_study || ""}
            onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
            placeholder="e.g. Computer Science"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={formData.start_date || ""}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        {!formData.is_current && (
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={formData.end_date || ""}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="is_current_edu"
          checked={formData.is_current}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_current: !!checked, end_date: checked ? null : formData.end_date })
          }
        />
        <Label htmlFor="is_current_edu">I'm currently studying here</Label>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Activities, honors, or relevant coursework..."
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {education ? "Update" : "Add"} Education
        </Button>
      </DialogFooter>
    </form>
  );
}

export function WorkExperienceSection() {
  const { experiences, addExperience, updateExperience, deleteExperience } = useWorkExperience();
  const [editingExp, setEditingExp] = useState<WorkExperience | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (data: Omit<WorkExperience, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (editingExp) {
      updateExperience.mutate({ id: editingExp.id, ...data }, { onSuccess: () => { setShowForm(false); setEditingExp(null); } });
    } else {
      addExperience.mutate(data, { onSuccess: () => { setShowForm(false); } });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Work Experience
          </CardTitle>
          <CardDescription>Your professional journey</CardDescription>
        </div>
        <Button size="sm" onClick={() => { setEditingExp(null); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent>
        {experiences.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No work experience added yet.</p>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="flex items-start justify-between rounded-lg border p-4">
                <div>
                  <h4 className="font-medium">{exp.title}</h4>
                  <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exp.start_date && format(new Date(exp.start_date), "MMM yyyy")} -{" "}
                    {exp.is_current ? "Present" : exp.end_date ? format(new Date(exp.end_date), "MMM yyyy") : ""}
                  </p>
                  {exp.description && <p className="mt-2 text-sm">{exp.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingExp(exp); setShowForm(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteExperience.mutate(exp.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExp ? "Edit" : "Add"} Work Experience</DialogTitle>
            </DialogHeader>
            <ExperienceForm
              experience={editingExp}
              onClose={() => setShowForm(false)}
              onSave={handleSave}
              isLoading={addExperience.isPending || updateExperience.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export function EducationSection() {
  const { education, addEducation, updateEducation, deleteEducation } = useEducation();
  const [editingEdu, setEditingEdu] = useState<Education | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (data: Omit<Education, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (editingEdu) {
      updateEducation.mutate({ id: editingEdu.id, ...data }, { onSuccess: () => { setShowForm(false); setEditingEdu(null); } });
    } else {
      addEducation.mutate(data, { onSuccess: () => { setShowForm(false); } });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Education
          </CardTitle>
          <CardDescription>Your academic background</CardDescription>
        </div>
        <Button size="sm" onClick={() => { setEditingEdu(null); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent>
        {education.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No education added yet.</p>
        ) : (
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="flex items-start justify-between rounded-lg border p-4">
                <div>
                  <h4 className="font-medium">{edu.degree}</h4>
                  <p className="text-sm text-muted-foreground">{edu.institution}</p>
                  {edu.field_of_study && <p className="text-sm text-muted-foreground">{edu.field_of_study}</p>}
                  <p className="text-xs text-muted-foreground">
                    {edu.start_date && format(new Date(edu.start_date), "MMM yyyy")} -{" "}
                    {edu.is_current ? "Present" : edu.end_date ? format(new Date(edu.end_date), "MMM yyyy") : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingEdu(edu); setShowForm(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteEducation.mutate(edu.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEdu ? "Edit" : "Add"} Education</DialogTitle>
            </DialogHeader>
            <EducationForm
              education={editingEdu}
              onClose={() => setShowForm(false)}
              onSave={handleSave}
              isLoading={addEducation.isPending || updateEducation.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
