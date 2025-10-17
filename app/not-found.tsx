"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FaTachometerAlt, FaLock, FaBug } from "react-icons/fa";

const Button = ({ children, className, ...props }) => (
    <button className={className} {...props}>
        {children}
    </button>
);


export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const FloatingBug = ({ delay, size, position }: { delay: number; size: number; position: string }) => (
    <div 
      className={`absolute ${position} animate-float opacity-0`}
      style={{ 
        animationDelay: `${delay}s`,
        animationFillMode: 'forwards'
      }}
    >
      <FaBug className={`text-second ${size > 24 ? 'text-2xl' : 'text-lg'} transition-all duration-1000 hover:scale-125 hover:text-tertiary`} />
    </div>
  );
  
  // Tableau de bugs pour l'affichage décoratif
  const bugs = [
    { delay: 0.5, size: 24, position: 'top-10 left-10' },
    { delay: 1.2, size: 30, position: 'top-1/4 right-1/4' },
    { delay: 2.0, size: 20, position: 'bottom-1/3 left-1/3' },
    { delay: 3.5, size: 28, position: 'bottom-20 right-20' },
  ];


  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Bugs flottants en arrière-plan (décoration) */}
      {bugs.map((bug, index) => (
        <FloatingBug key={index} {...bug} />
      ))}

      <div className="relative z-10 text-center">
        {/* 404 Glitch Effect */}
        <div className="font-title flex items-center justify-center mb-8 md:mb-12">
          <div className="relative">
            {/* Le nombre 4-Robot-4 */}
            <div className="flex items-center justify-center text-[8rem] sm:text-[12rem] md:text-[18rem] lg:text-[22rem] leading-none font-black">
              <span className="inline-block animate-glitch-1 relative">
                4
                <span className="absolute top-0 left-0 text-second animate-glitch-2 opacity-70">4</span>
                <span className="absolute top-0 left-0 text-bluvy animate-glitch-3 opacity-70">4</span>
              </span>
              
              {/* Emoji robot central */}
              <div className="relative mx-2 sm:mx-4 md:mx-8">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48">
                  <div className="absolute inset-0 bg-tertiary rounded-full animate-pulse-slow" />
                  <div className="absolute inset-2 bg-dark rounded-full" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="text-4xl sm:text-6xl md:text-8xl animate-bounce-slow">🤖</div>
                  </div>
                  {/* Antennes */}
                  <div className="absolute -top-4 left-1/4 w-1 h-4 bg-second rounded-t-full animate-antenna-1" />
                  <div className="absolute -top-4 right-1/4 w-1 h-4 bg-bluvy rounded-t-full animate-antenna-2" />
                </div>
              </div>

              <span className="inline-block animate-glitch-1 relative">
                4
                <span className="absolute top-0 left-0 text-second animate-glitch-2 opacity-70">4</span>
                <span className="absolute top-0 left-0 text-bluvy animate-glitch-3 opacity-70">4</span>
              </span>
            </div>
            
            {/* Effet de scan à travers les chiffres */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-second to-transparent opacity-20 animate-scan" />
          </div>
        </div>

        {/* Message d'erreur */}
        <div className="mb-12 md:mb-16 px-4 max-w-4xl mx-auto">
          <h1 className="font-title text-2xl sm:text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-second via-tertiary to-bluvy bg-clip-text text-transparent animate-gradient">
            Page Introuvable
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-second leading-relaxed mb-4">
            Oups ! Cette page n&apos;existe pas ou a été déplacée.
          </p>
        </div>

        {/* Boutons */}
        <div className="font-link flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-8">
          <Link href="/dashboard">
            <button
              className="group bg-lien text-white font-bold text-base sm:text-lg py-3 px-10 rounded-full !rounded-full transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:bg-principal flex items-center justify-center gap-3"
            >
              <FaTachometerAlt className="text-xl transition-transform duration-300 group-hover:scale-110" />
              <span>Tableau de bord</span>
            </button>
          </Link>

          <Link href="/auth/login">
            <button
              className="group bg-lien text-white font-bold text-base sm:text-lg py-3 px-10 rounded-full !rounded-full transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:bg-principal flex items-center justify-center gap-3"
    
            >
              <FaLock className="text-xl transition-transform duration-300 group-hover:scale-110" />
              <span>Connexion</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}