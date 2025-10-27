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
      router.push("/auth/signin/"); // Redirection après l'intro
    }, 3000); // durée de l'intro
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
              <motion.svg
                className="h-16 w-16 text-tertiary mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                initial={{ y: 20 }}
                animate={{ y: [20, -10, 0] }}
                transition={{ duration: 2, ease: "easeOut" }}
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5v-2l-10 5-10-5v2z" />
              </motion.svg>

              <motion.h1
                className="text-4xl md:text-5xl font-title font-bold text-white"
                initial={{ y: 20 }}
                animate={{ y: [20, -10, 0] }}
                transition={{ duration: 2, ease: "easeOut" }}
              >
                SchoolFlow
              </motion.h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
