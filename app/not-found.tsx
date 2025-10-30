"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FaTachometerAlt, FaLock, FaBug } from "react-icons/fa";

// Définition des types pour TypeScript
interface FloatingBugProps {
  delay: number;
  size: number;
  position: string;
}

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Composant avec typage approprié
  const FloatingBug = ({ delay, size, position }: FloatingBugProps) => (
    <div 
      className={`absolute ${position} animate-float opacity-0`}
      style={{ 
        animationDelay: `${delay}s`,
        animationFillMode: 'forwards'
      }}
    >
      <FaBug className={`text-second ${size > 24 ? 'text-2xl' : 'text-xl'} transition-all duration-1000 hover:scale-125 hover:text-tertiary`} />
    </div>
  );
  
  const bugs = [
    { delay: 0.5, size: 24, position: 'top-[5vh] left-[5vw]' },
    { delay: 1.2, size: 30, position: 'top-[25vh] right-[20vw]' },
    { delay: 2.0, size: 20, position: 'bottom-[33vh] left-[33vw]' },
    { delay: 3.5, size: 28, position: 'bottom-[10vh] right-[10vw]' },
  ];


  if (!mounted) return null;

  return (
    // 'h-screen' est conservé. 'overflow-hidden' est ajouté pour couper tout débordement accidentel
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Bugs flottants */}
      {bugs.map((bug, index) => (
        <FloatingBug key={index} {...bug} />
      ))}

      <div className="relative z-10 text-center flex flex-col items-center justify-center h-full">
        
        {/* 404 Glitch Effect */}
        <div className="font-title flex items-center justify-center mb-6 flex-none">
          <div className="relative">
            
            {/* Le nombre 4-Robot-4 */}
            <div className="flex items-center justify-center 
              text-[5rem] sm:text-[8rem] md:text-[12rem] lg:text-[15rem] 
              leading-none font-black flex-none"
            >
              <span className="inline-block animate-glitch-1 relative">
                4
                <span className="absolute top-0 left-0 text-second animate-glitch-2 opacity-70">4</span>
                <span className="absolute top-0 left-0 text-bluvy animate-glitch-3 opacity-70">4</span>
              </span>
              
              {/* Emoji robot central */}
              <div className="relative mx-1 sm:mx-3 md:mx-4 flex-none">
                <div className="relative w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28">
                  <div className="absolute inset-0 bg-tertiary rounded-full animate-pulse-slow" />
                  <div className="absolute inset-1 bg-black rounded-full" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    {/* Taille de l'emoji réduite */}
                    <div className="text-2xl sm:text-4xl md:text-6xl animate-bounce-slow">🤖</div>
                  </div>
                  {/* Antennes */}
                  <div className="absolute -top-2 left-1/4 w-1 h-3 bg-second rounded-t-full animate-antenna-1" />
                  <div className="absolute -top-2 right-1/4 w-1 h-3 bg-bluvy rounded-t-full animate-antenna-2" />
                </div>
              </div>

              <span className="inline-block animate-glitch-1 relative">
                4
                <span className="absolute top-0 left-0 text-second animate-glitch-2 opacity-70">4</span>
                <span className="absolute top-0 left-0 text-bluvy animate-glitch-3 opacity-70">4</span>
              </span>
            </div>
            
            {/* Effet de scan */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-second to-transparent opacity-20 animate-scan" />
          </div>
        </div>

        {/* Message d'erreur */}
        <div className="mb-6 md:mb-8 px-4 max-w-4xl mx-auto flex-none">
          <h1 className="font-title text-xl sm:text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-second via-tertiary to-bluvy bg-clip-text text-transparent animate-gradient">
            [ERREUR 404] Page Introuvable
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-second leading-relaxed">
            Le chemin demandé a été corrompu ou n&apos;existe pas dans la matrice. Tentative de redirection...
          </p>
        </div>

        {/* Boutons  */}
        <div className="font-link flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 flex-none">
          <Link href="/dashboard">
            <button
              className="group bg-principal text-white font-bold text-base py-2 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(30,144,255,0.6)] flex items-center justify-center gap-3"
            >
              <FaTachometerAlt className="text-lg transition-transform duration-300 group-hover:scale-110" />
              <span>Tableau de bord</span>
            </button>
          </Link>

          <Link href="/auth/signin">
            <button
              className="group bg-gray-700 text-white font-bold text-base py-2 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:bg-gray-600 flex items-center justify-center gap-3"
            >
              <FaLock className="text-lg transition-transform duration-300 group-hover:scale-110" />
              <span>Connexion</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}