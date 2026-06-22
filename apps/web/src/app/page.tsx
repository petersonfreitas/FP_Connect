import Image from "next/image";
import Link from "next/link";
import type {
  AdminApplicationContract,
  AdminCurrentUserAccessContract,
  AdminCurrentUserModuleAccessContract
} from "@fp/types";
import { AppShell } from "@/components/app-shell";
import { getAdminConsoleOverview, getCurrentAdminAccess } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

const foundationItems = [
  "Banco unico Supabase por schemas",
  "Auth centralizado no core",
  "APIs internas por dominio",
  "Frontends separados quando necessario"
];

const applicationStatusLabels: Record<AdminApplicationContract["status"], string> = {
  active: "Ativo",
  hidden: "Oculto",
  inactive: "Inativo"
};

const applicationToneByKey: Record<string, string> = {
  "admin-console": "Core",
  billing: "Financeiro",
  food: "Produto",
  gateway: "Integracao",
  marketing: "Crescimento",
  robots: "Automacao",
  sales: "Comercial",
  tickets: "Suporte",
  tracking: "Produto"
};

export default async function Home() {
  const accessResult = await getCurrentAdminAccess();
  const access = accessResult.data;
  const overviewResult = access?.isSuperAdmin
    ? await getAdminConsoleOverview()
    : { data: null, error: null };
  const overview = overviewResult.data;
  const applications = overview?.applications ?? [];
  const basicPlans = overview?.basicPlans ?? [];
  const companies = overview?.companies ?? [];

  if (!access) {
    return (
      <AppShell access={null} accessError={accessResult.error} activePath="/">
        <header className="topbar">
          <div>
            <div className="eyebrow">Portal principal</div>
            <strong>Acesso nao carregado</strong>
          </div>
          <div className="status-pill">Acesso pendente</div>
        </header>

        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar seu acesso.</strong>
          <span>{accessResult.error ?? "Contrato de acesso indisponivel."}</span>
        </section>
      </AppShell>
    );
  }

  if (!access.isSuperAdmin) {
    return <ContextualPortal access={access} />;
  }

  return (
    <AppShell access={access} activePath="/">
        <header className="topbar">
          <div>
            <div className="eyebrow">Portal principal</div>
            <strong>Empresas cadastradas: {companies.length}</strong>
          </div>
          <div className="status-pill">
            {overviewResult.error ? "API interna indisponivel" : "Core conectado"}
          </div>
        </header>

        {overviewResult.error ? (
          <section className="data-alert" role="status">
            <strong>Nao foi possivel carregar dados reais do core.</strong>
            <span>{overviewResult.error}</span>
          </section>
        ) : null}

        <section className="hero">
          <div className="hero-copy">
            <Image
              src="/brand/logo.png"
              alt="FP WebTech"
              width={270}
              height={95}
              priority
            />
            <h1>Centro operacional do ecossistema FP WebTech.</h1>
            <p>
              Uma base comum para administrar empresas, liberar modulos, controlar
              permissoes e preparar integracoes entre produtos SaaS.
            </p>
          </div>
          <div className="foundation-panel" aria-label="Contratos da fundacao">
            <span>Contratos de arquitetura</span>
            {foundationItems.map((item) => (
              <div className="foundation-item" key={item}>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="summary-strip" aria-label="Resumo do core">
          <div className="summary-item">
            <span>Modulos no core</span>
            <strong>{applications.length}</strong>
          </div>
          <div className="summary-item">
            <span>Planos base</span>
            <strong>{basicPlans.length}</strong>
          </div>
          <div className="summary-item">
            <span>Empresas</span>
            <strong>{companies.length}</strong>
          </div>
        </section>

        <section className="section-heading">
          <div>
            <div className="eyebrow">Meus sistemas</div>
            <h2>Modulos do ecossistema</h2>
          </div>
          <span className="muted">Dados carregados do schema core</span>
        </section>

        <section className="module-grid" aria-label="Modulos do ecossistema">
          {applications.length > 0 ? (
            applications.map((application) => (
              <article className="module-card" key={application.id}>
                <div className="module-card-top">
                  <span>{applicationToneByKey[application.key] ?? "Modulo"}</span>
                  <small>{applicationStatusLabels[application.status]}</small>
                </div>
                <h3>{application.name}</h3>
                <p>{application.description ?? "Descricao pendente no catalogo do core."}</p>
              </article>
            ))
          ) : (
            <div className="empty-state">
              Nenhum modulo retornado pela API interna ate o momento.
            </div>
          )}
        </section>
    </AppShell>
  );
}

function ContextualPortal({ access }: { access: AdminCurrentUserAccessContract }) {
  const companies = access.companies;
  const modules = companies.flatMap((company) => company.modules);
  const moduleCards = buildPortalModuleCards(modules);

  return (
    <AppShell access={access} activePath="/">
      <header className="topbar">
        <div>
          <div className="eyebrow">Portal principal</div>
          <strong>{access.user.fullName}</strong>
        </div>
        <div className="status-pill">{getRoleLabel(access.user.globalRole)}</div>
      </header>

      <section className="hero contextual-hero">
        <div className="hero-copy">
          <Image src="/brand/logo.png" alt="FP WebTech" width={270} height={95} priority />
          <h1>Seu acesso ao ecossistema FP WebTech.</h1>
          <p>
            As areas abaixo refletem seus vinculos ativos, permissoes e modulos liberados.
            Menus administrativos globais ficam ocultos quando nao fazem parte do seu perfil.
          </p>
        </div>
        <div className="foundation-panel" aria-label="Resumo de acesso">
          <span>Resumo do acesso</span>
          <div className="foundation-item">{companies.length} empresa(s) vinculada(s)</div>
          <div className="foundation-item">{moduleCards.length} sistema(s) liberado(s)</div>
          <div className="foundation-item">
            {access.isPlatformUser ? "Usuario interno da plataforma" : "Usuario de empresa"}
          </div>
        </div>
      </section>

      <section className="summary-strip" aria-label="Resumo do acesso atual">
        <div className="summary-item">
          <span>Empresas</span>
          <strong>{companies.length}</strong>
        </div>
        <div className="summary-item">
          <span>Sistemas</span>
          <strong>{moduleCards.length}</strong>
        </div>
        <div className="summary-item">
          <span>Perfil</span>
          <strong>{access.isPlatformUser ? "Interno" : "Empresa"}</strong>
        </div>
      </section>

      <section className="section-heading">
        <div>
          <div className="eyebrow">Meus sistemas</div>
          <h2>Hubs operacionais liberados</h2>
        </div>
        <span className="muted">Empresas continuam na Carteira</span>
      </section>

      {companies.length > 0 ? (
        <section className="module-grid" aria-label="Sistemas liberados">
          <article className="module-card">
            <div className="module-card-top">
              <span>Carteira</span>
              <small>{companies.length} empresa(s)</small>
            </div>
            <h3>Carteira de empresas</h3>
            <p>Consulte empresas vinculadas, status, modulos liberados e acessos administrativos.</p>
            <div className="tag-list">
              <Link className="tag" href="/carteira/empresas">
                Abrir carteira
              </Link>
            </div>
          </article>

          {moduleCards.length > 0 ? (
            moduleCards.map((module) => (
              <article className="module-card" key={module.applicationId}>
                <div className="module-card-top">
                  <span>{applicationToneByKey[module.applicationKey] ?? "Sistema"}</span>
                  <small>{module.companyCount} empresa(s)</small>
                </div>
                <h3>{module.applicationName}</h3>
                <p>{formatModuleCompanies(module.companyNames)}</p>
                <div className="tag-list">
                  <Link className="tag" href={module.href}>
                    Abrir hub
                  </Link>
                  {module.companyNames.slice(0, 2).map((companyName) => (
                    <span className="tag muted-tag" key={`${module.applicationId}:${companyName}`}>
                      {companyName}
                    </span>
                  ))}
                  {module.companyNames.length > 2 ? (
                    <span className="tag muted-tag">+{module.companyNames.length - 2}</span>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <article className="module-card">
              <div className="module-card-top">
                <span>Carteira</span>
                <small>Sem sistema operacional</small>
              </div>
              <h3>Nenhum modulo liberado</h3>
              <p>Seu usuario possui empresa vinculada, mas ainda nao ha modulo operacional ativo.</p>
            </article>
          )}
        </section>
      ) : (
        <section className="content-panel">
          <div className="empty-state">
            Seu usuario esta ativo, mas ainda nao possui empresa, carteira de suporte ou modulo
            liberado. Solicite a liberacao ao responsavel pelo FP Console.
          </div>
        </section>
      )}
    </AppShell>
  );
}

type PortalModuleCard = {
  applicationId: string;
  applicationKey: string;
  applicationName: string;
  companyCount: number;
  companyNames: string[];
  href: string;
};

function buildPortalModuleCards(
  modules: AdminCurrentUserModuleAccessContract[]
): PortalModuleCard[] {
  const modulesByApplication = new Map<string, PortalModuleCard>();

  for (const module of modules) {
    const current = modulesByApplication.get(module.applicationId);

    if (current) {
      current.companyCount += 1;
      current.companyNames.push(module.companyName);
      continue;
    }

    modulesByApplication.set(module.applicationId, {
      applicationId: module.applicationId,
      applicationKey: module.applicationKey,
      applicationName: module.applicationName,
      companyCount: 1,
      companyNames: [module.companyName],
      href: getModuleHref(module)
    });
  }

  return Array.from(modulesByApplication.values()).sort((first, second) =>
    first.applicationName.localeCompare(second.applicationName, "pt-BR")
  );
}

function getModuleHref(module: AdminCurrentUserModuleAccessContract): string {
  if (module.applicationKey === "food") {
    return `/sistemas/food?companyId=${module.companyId}`;
  }

  const path = module.entryPath ?? "/";

  if (path === "/" || modulesShouldOpenWithoutCompany(module.applicationKey)) {
    return path;
  }

  return path.includes("?")
    ? `${path}&companyId=${module.companyId}`
    : `${path}?companyId=${module.companyId}`;
}

function modulesShouldOpenWithoutCompany(applicationKey: string): boolean {
  return applicationKey === "gateway" || applicationKey === "robots";
}

function getRoleLabel(role: AdminCurrentUserAccessContract["user"]["globalRole"]): string {
  if (role === "super_admin") {
    return "Superadmin";
  }

  if (role === "fp_admin") {
    return "Admin do Console";
  }

  if (role === "support") {
    return "Suporte";
  }

  return "Usuario de empresa";
}

function formatModuleCompanies(companyNames: string[]): string {
  if (companyNames.length === 0) {
    return "Nenhuma empresa vinculada a este sistema.";
  }

  if (companyNames.length === 1) {
    return `Disponivel para ${companyNames[0]}.`;
  }

  return `Disponivel para ${companyNames.length} empresas da sua carteira.`;
}
