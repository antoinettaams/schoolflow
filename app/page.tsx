export default function Home() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="font-title text-4xl">Titre en Poppins</h1>
      <p className="font-text text-xl">Texte en Inter</p>
      <a className="font-link text-lg text-blue-500">Lien en Montserrat</a>
      
      {/* Test avec couleurs Tailwind par défaut */}
      <div className="font-title text-red-500 text-2xl">Rouge Tailwind + Poppins</div>
      <div className="font-text text-green-500 text-xl">Vert Tailwind + Inter</div>
    </div>
  );
}