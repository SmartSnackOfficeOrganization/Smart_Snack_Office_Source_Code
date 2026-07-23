interface NoResultsProps {
  query: string;
}

export function NoResults({ query }: NoResultsProps) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl">
        🔍
      </div>
      <h2 className="mt-6 text-xl font-bold text-slate-900">
        No se encontraron resultados
      </h2>
      <p className="mt-3 max-w-sm text-sm text-slate-500">
        No hay productos que coincidan con &ldquo;{query}&rdquo;. Intenta con otros
        términos como &ldquo;dulce&rdquo;, &ldquo;picante&rdquo; o &ldquo;saludable&rdquo;.
      </p>
    </div>
  );
}
