import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface InteractiveFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export function InteractiveFeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  index 
}: InteractiveFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card className="group h-full hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <motion.div 
              className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground mt-2">{description}</p>
            <motion.div
              className="mt-4 h-1 bg-primary rounded-full origin-left"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
