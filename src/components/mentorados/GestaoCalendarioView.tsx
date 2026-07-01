interface Props {
  // kept for backward compat; no longer used since calendar was removed
  entregas?: unknown[];
}

export const GestaoCalendarioView = (_props: Props) => {
  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <iframe
        src="https://controleproducao.desorcompany.com/"
        title="Controle de Produção"
        className="w-full flex-1 min-h-0 border-0 block"
        scrolling="yes"
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
};