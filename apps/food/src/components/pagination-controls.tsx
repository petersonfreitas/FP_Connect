import Link from "next/link";

type PaginationControlsProps = {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
};

export function PaginationControls({
  basePath,
  page,
  pageSize,
  params = {},
  total,
  totalPages
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const previousPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav className="pagination-bar" aria-label="Paginacao">
      <span>
        {from}-{to} de {total}
      </span>
      <div>
        {page > 1 ? (
          <Link className="secondary-action compact-action" href={getPageHref(basePath, previousPage, params)}>
            Anterior
          </Link>
        ) : (
          <span className="secondary-action compact-action disabled-action">Anterior</span>
        )}
        <strong>
          Pagina {page} de {totalPages}
        </strong>
        {page < totalPages ? (
          <Link className="secondary-action compact-action" href={getPageHref(basePath, nextPage, params)}>
            Proxima
          </Link>
        ) : (
          <span className="secondary-action compact-action disabled-action">Proxima</span>
        )}
      </div>
    </nav>
  );
}

function getPageHref(basePath: string, page: number, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  search.set("page", String(page));
  return `${basePath}?${search.toString()}`;
}
