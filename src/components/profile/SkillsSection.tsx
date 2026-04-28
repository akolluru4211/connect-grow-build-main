import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSkillEndorsements } from "@/hooks/useSkillEndorsements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ThumbsUp, Trash, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getDisplayName, getDisplayAvatar } from "@/lib/edworldProfile";

interface SkillsSectionProps {
  userId: string;
  isOwnProfile?: boolean;
}

export function SkillsSection({ userId, isOwnProfile = false }: SkillsSectionProps) {
  const { user } = useAuth();
  const { userSkills, allSkills, isLoading, addSkill, removeSkill, endorseSkill } = useSkillEndorsements(userId);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredSkills = allSkills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !userSkills.some((us) => us.skill_id === skill.id)
  );

  const handleAddSkill = (skillId: string) => {
    addSkill(skillId);
    setDialogOpen(false);
    setSearchTerm("");
  };

  const handleEndorse = (skillId: string) => {
    if (!user) return;
    endorseSkill({ skillId, endorsedUserId: userId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            {isOwnProfile ? "Showcase your expertise" : "Endorse skills you can vouch for"}
          </CardDescription>
        </div>
        {isOwnProfile && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Skills
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Skill</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {filteredSkills.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        No skills found
                      </p>
                    ) : (
                      filteredSkills.map((skill) => (
                        <Button
                          key={skill.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleAddSkill(skill.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {skill.name}
                          {skill.category && (
                            <Badge variant="secondary" className="ml-auto">
                              {skill.category}
                            </Badge>
                          )}
                        </Button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {userSkills.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <p>No skills added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userSkills.map((userSkill) => (
              <div
                key={userSkill.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{userSkill.skill.name}</span>
                    {userSkill.skill.category && (
                      <Badge variant="secondary" className="text-xs">
                        {userSkill.skill.category}
                      </Badge>
                    )}
                  </div>
                  {userSkill.endorsers.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {userSkill.endorsement_count} endorsement{userSkill.endorsement_count !== 1 ? "s" : ""}
                      </span>
                      <div className="flex -space-x-2">
                        {userSkill.endorsers.slice(0, 3).map((endorser) => (
                          <Tooltip key={endorser.id}>
                            <TooltipTrigger>
                              <Avatar className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={getDisplayAvatar(endorser.full_name, endorser.avatar_url)} />
                                <AvatarFallback className="text-xs">
                                  {getDisplayName(endorser.full_name)[0]}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>{getDisplayName(endorser.full_name)}</TooltipContent>
                          </Tooltip>
                        ))}
                        {userSkill.endorsers.length > 3 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                            +{userSkill.endorsers.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isOwnProfile && user && (
                    <Button
                      size="sm"
                      variant={userSkill.user_endorsed ? "default" : "outline"}
                      onClick={() => handleEndorse(userSkill.skill_id)}
                    >
                      <ThumbsUp className={`h-4 w-4 ${userSkill.user_endorsed ? "mr-1" : ""}`} />
                      {userSkill.user_endorsed && "Endorsed"}
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSkill(userSkill.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
