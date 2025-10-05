import { SpaceBackground } from '@/components/SpaceBackground';
import { Navigation } from '@/components/Navigation';
import { TimeCapsule3D } from '@/components/TimeCapsule3D';
import { CosmicButton } from '@/components/CosmicButton';
import { FeatureCard } from '@/components/FeatureCard';
import { Shield, Clock, CheckCircle, Lock, Zap, Globe, FileText, Image, Music, Folder } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Lock,
      title: 'Immutable Storage',
      description: 'Blockchain-secured storage that cannot be tampered with',
    },
    {
      icon: Clock,
      title: 'Timestamp Proof',
      description: 'Cryptographic proof of when your content was created',
    },
    {
      icon: CheckCircle,
      title: 'Blockchain Verified',
      description: 'Publicly verifiable on the blockchain network',
    },
  ];

  const howItWorks = [
    {
      icon: Zap,
      title: 'Create Your Capsule',
      description: 'Upload memories, set unlock date, and customize your time capsule',
    },
    {
      icon: Shield,
      title: 'Blockchain Lock',
      description: 'Content is hashed and securely locked on the blockchain',
    },
    {
      icon: Clock,
      title: 'Time Travel',
      description: 'Your capsule waits safely in the blockchain until the unlock date',
    },
    {
      icon: Globe,
      title: 'Future Unlock',
      description: 'Content is revealed at the specified time for you or the world',
    },
  ];

  const floatingIcons = [
    { Icon: FileText, position: 'top-1/4 left-1/4', delay: 0 },
    { Icon: Image, position: 'top-1/4 right-1/4', delay: 0.2 },
    { Icon: Music, position: 'bottom-1/4 left-1/4', delay: 0.4 },
    { Icon: Folder, position: 'bottom-1/4 right-1/4', delay: 0.6 },
  ];

  return (
    <div className="min-h-screen">
      <SpaceBackground />
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center">
            {/* Floating Icons */}
            {floatingIcons.map(({ Icon, position, delay }, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, duration: 0.8 }}
                className={`absolute ${position} hidden lg:block`}
              >
                <div className="p-4 glass-panel rounded-full cosmic-glow-accent animate-float">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
              </motion.div>
            ))}

            {/* 3D Capsule */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="w-full max-w-2xl mb-8"
            >
              <TimeCapsule3D />
            </motion.div>

            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center max-w-4xl"
            >
              <div className="inline-block mb-4 px-4 py-2 glass-panel rounded-full border border-primary/30">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Blockchain-Powered Time Capsules
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 leading-tight">
                <span className="text-gradient">Preserve Your Memories</span>
                <br />
                <span className="text-foreground">for Tomorrow</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Securely store your digital legacy for future generations. Lock your ideas in time with immutable blockchain proof.
              </p>

              <div className="flex gap-4 justify-center flex-wrap">
                <CosmicButton 
                  size="lg" 
                  glow
                  onClick={() => navigate('/create')}
                >
                  Create Time Capsule
                </CosmicButton>
                <CosmicButton 
                  variant="outline" 
                  size="lg"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  How It Works
                </CosmicButton>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-heading font-bold mb-4 text-gradient">
              Why Choose Time Capsule?
            </h2>
            <p className="text-muted-foreground text-lg">
              Built on cutting-edge blockchain technology for unparalleled security
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-heading font-bold mb-4 text-gradient">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg">
              Four simple steps to preserve your memories forever
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="relative"
              >
                <div className="glass-panel p-6 rounded-xl text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 cosmic-glow mb-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -top-4 right-4 w-8 h-8 rounded-full bg-accent cosmic-glow-accent flex items-center justify-center font-heading font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl font-heading font-bold mb-6 text-gradient">
              About Time Capsule
            </h2>
            <div className="glass-panel p-8 rounded-xl">
              <p className="text-lg text-muted-foreground mb-4">
                Time Capsule is a revolutionary blockchain-powered platform that allows you to preserve your digital memories, ideas, and content for the future. Built on cutting-edge Web3 technology, we provide immutable, timestamped proof of your content that can't be altered or tampered with.
              </p>
              <p className="text-lg text-muted-foreground">
                Whether you want to send a message to your future self, preserve family memories, or protect intellectual property, Time Capsule provides the security and reliability of blockchain technology in an easy-to-use interface.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-panel p-12 rounded-2xl text-center cosmic-glow"
          >
            <h2 className="text-4xl font-heading font-bold mb-4 text-gradient">
              Ready to Create Your Time Capsule?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users preserving their memories on the blockchain
            </p>
            <CosmicButton size="lg" glow onClick={() => navigate('/create')}>
              Get Started Now
            </CosmicButton>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2025 Time Capsule. All rights reserved. Built on Web3.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
