interface Props {
  // kept for backward compat; no longer used since calendar was removed
  entregas?: unknown[];
}

export const GestaoCalendarioView = (_props: Props) => {
  return (
    <div className="h-full w-full">
      <iframe
        src="https://controleproducao.desorcompany.com/"
        title="Controle de Produção"
        className="w-full h-full border-0"
        loading="lazy"
      />
    </div>
  );
};