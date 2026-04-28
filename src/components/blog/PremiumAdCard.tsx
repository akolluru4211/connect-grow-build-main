import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Award, Phone, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsPremium } from "@/hooks/useSubscription";

export function PremiumAdCard() {
  const navigate = useNavigate();
  const { isPremium } = useIsPremium();

  if (isPremium) return null;

  return (
    <Card className="overflow-hidden border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-primary/10">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-center gap-4 p-5">
          <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Crown className="h-7 w-7 text-white" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-foreground mb-1">
              Get Pro Badge — ₹49/mo
            </h3>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Award className="h-3 w-3" /> Pro Badge</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Voice/Video Calls</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">All AI tools are free for everyone!</p>
          </div>

          <Button
            onClick={() => navigate("/pricing")}
            className="flex-shrink-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold shadow-md hover:from-yellow-600 hover:to-orange-600"
            size="lg"
          >
            <Crown className="h-4 w-4 mr-1.5" />
            Upgrade
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
