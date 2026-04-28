import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding, ONBOARDING_STEPS, OnboardingStepId } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  User, 
  Briefcase, 
  Users, 
  Compass, 
  Award,
  CheckCircle,
  ArrowRight,
  X
} from "lucide-react";

const stepIcons: Record<OnboardingStepId, React.ReactNode> = {
  profile: <User className="h-6 w-6" />,
  skills: <Award className="h-6 w-6" />,
  experience: <Briefcase className="h-6 w-6" />,
  network: <Users className="h-6 w-6" />,
  explore: <Compass className="h-6 w-6" />,
};

const stepPaths: Record<OnboardingStepId, string> = {
  profile: "/profile",
  skills: "/profile",
  experience: "/profile",
  network: "/network",
  explore: "/dashboard",
};

interface OnboardingFlowProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function OnboardingFlow({ open, onOpenChange }: OnboardingFlowProps) {
  const navigate = useNavigate();
  const { 
    showOnboarding, 
    completedSteps, 
    currentStep, 
    progress,
    completeStep,
    skipOnboarding 
  } = useOnboarding();
  
  const [activeStep, setActiveStep] = useState<OnboardingStepId | null>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : showOnboarding;

  const handleClose = () => {
    if (isControlled && onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleStepClick = (stepId: OnboardingStepId) => {
    setActiveStep(stepId);
  };

  const handleGoToStep = (stepId: OnboardingStepId) => {
    completeStep(stepId);
    navigate(stepPaths[stepId]);
    handleClose();
  };

  const handleSkip = () => {
    skipOnboarding();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Welcome to EdWorld!</DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Getting started</span>
              <span className="font-medium">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            {ONBOARDING_STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep?.id === step.id;
              const isActive = activeStep === step.id;

              return (
                <Card
                  key={step.id}
                  className={`cursor-pointer transition-all ${
                    isActive ? "ring-2 ring-primary" : ""
                  } ${isCompleted ? "bg-muted/50" : ""} ${isCurrent ? "border-primary" : ""}`}
                  onClick={() => handleStepClick(step.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        stepIcons[step.id]
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isCompleted ? "text-muted-foreground" : ""}`}>
                        {step.label}
                      </p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {!isCompleted && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGoToStep(step.id);
                        }}
                      >
                        Start <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button onClick={() => handleGoToStep(currentStep?.id || "profile")}>
              Continue Setup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
