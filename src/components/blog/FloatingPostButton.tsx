import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface FloatingPostButtonProps {
  onClick?: () => void;
}

export function FloatingPostButton({ onClick }: FloatingPostButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (onClick) {
      onClick();
    } else {
      navigate("/blogs?compose=true");
    }
  };

  return (
    <Button
      onClick={handleClick}
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">Create Post</span>
    </Button>
  );
}
