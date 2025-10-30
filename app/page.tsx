"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
      router.push("/auth/signin/"); 
    }, 3000); 
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro-screen"
            className="absolute inset-0 bg-principal flex flex-col items-center justify-center z-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <motion.div
              initial={{ y: 100, scale: 1 }}        // effet départ bas
              animate={{ y: 0, scale: 0.8 }}       // zoom arrière et montée
              transition={{ duration: 2, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <motion.img
                src="/images/logo.png"
                alt="SchoolFlow Logo"
                className="h-48 w-48 mb-4"
                loading="eager"
                initial={{ y: 20 }}
                animate={{ y: [20, -10, 0] }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
