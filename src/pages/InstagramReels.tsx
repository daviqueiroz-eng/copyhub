const InstagramReels = () => {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="border-b bg-background p-4">
        <h1 className="text-2xl font-bold text-foreground">Instagram Reels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Extração de transcrições de vídeos
        </p>
      </div>
      <div className="flex-1 relative">
        <iframe
          src="https://inteligenciacore.com.br/dashboard/admin/instagram-reels"
          className="absolute inset-0 w-full h-full border-0"
          title="Instagram Reels - Inteligência Core"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default InstagramReels;
