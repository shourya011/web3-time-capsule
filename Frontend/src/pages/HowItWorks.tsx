import { SpaceBackground } from '@/components/SpaceBackground';
import { Navigation } from '@/components/Navigation';
import { motion } from 'framer-motion';
import { Rocket, Shield, Clock, Database, Key, Users } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Rocket,
      title: "Create Your Capsule",
      description: "Upload files, write messages, and set recipients for your time capsule.",
    },
    {
      icon: Shield,
      title: "Client-Side Encryption",
      description: "Your content is encrypted locally using AES-GCM before leaving your device.",
    },
    {
      icon: Database,
      title: "IPFS Storage",
      description: "Encrypted content is stored on IPFS, ensuring decentralized and permanent storage.",
    },
    {
      icon: Clock,
      title: "Smart Contract Lock",
      description: "Set unlock time and recipients using Base blockchain smart contracts.",
    },
    {
      icon: Key,
      title: "Recovery Kit",
      description: "Download your recovery kit containing decryption keys for future access.",
    },
    {
      icon: Users,
      title: "Access & Share",
      description: "Recipients can access content after unlock time using their recovery kit.",
    },
  ];

  return (
    <div className="min-h-screen">
      <SpaceBackground />
      <Navigation />
      
      <div className="container mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-heading font-bold mb-6 text-gradient">
            How It Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Time Capsule uses cutting-edge Web3 technology to create secure, 
            time-locked storage for your digital memories and messages.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass-panel p-8 rounded-xl cosmic-glow text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              
              <h3 className="text-xl font-heading font-bold mb-4">
                {step.title}
              </h3>
              
              <p className="text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel p-12 rounded-xl cosmic-glow text-center"
        >
          <h2 className="text-3xl font-heading font-bold mb-6">
            Why Web3 Time Capsules?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div>
              <h3 className="text-xl font-heading font-bold mb-3 text-primary">
                Decentralized
              </h3>
              <p className="text-muted-foreground">
                No single point of failure. Your capsules exist on the blockchain 
                and IPFS, ensuring they survive even if our service goes down.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-heading font-bold mb-3 text-accent">
                Secure
              </h3>
              <p className="text-muted-foreground">
                Client-side encryption means only you and your chosen recipients 
                can access the content. Not even we can see what's inside.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-heading font-bold mb-3 text-secondary">
                Trustless
              </h3>
              <p className="text-muted-foreground">
                Smart contracts automatically enforce unlock conditions. 
                No intermediaries or trust required.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HowItWorks;