import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      className="glass-panel p-6 rounded-xl cosmic-glow-accent hover:cosmic-glow transition-all duration-300"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-4 rounded-full bg-accent/20 cosmic-glow-accent">
          <Icon className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-heading font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
};
