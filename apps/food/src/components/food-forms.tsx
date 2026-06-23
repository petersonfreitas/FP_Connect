import type {
  AdminCurrentUserCompanyAccessContract,
  FoodCategoryContract,
  FoodMenuContract,
  FoodProductContract,
  FoodStoreContract,
  FoodStoreHourContract,
  FoodStoreHourKind
} from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { StoreHoursRow } from "@/components/store-hours-row";
import {
  saveFoodCategoryAction,
  saveFoodProductAction,
  saveFoodStoreAction,
  saveFoodStoreHoursAction
} from "@/app/actions";
import { displayCompanyName } from "@/lib/food-context";

const statusOptions = [
  ["implementation", "Implementacao"],
  ["open", "Aberta"],
  ["closed", "Fechada"],
  ["suspended", "Suspensa"]
] as const;

const categoryStatusOptions = [
  ["active", "Ativa"],
  ["inactive", "Inativa"]
] as const;

const productStatusOptions = [
  ["available", "Disponivel"],
  ["unavailable", "Indisponivel"],
  ["hidden", "Oculto"]
] as const;

const weekdayOptions = [
  [0, "Domingo"],
  [1, "Segunda"],
  [2, "Terca"],
  [3, "Quarta"],
  [4, "Quinta"],
  [5, "Sexta"],
  [6, "Sabado"]
] as const;

const hourKindOptions: Array<{
  allDayLabel?: string;
  defaultClosesAt: string;
  defaultOpensAt: string;
  description: string;
  kind: FoodStoreHourKind;
  label: string;
  summary: string;
}> = [
  {
    allDayLabel: "Aberto 24h",
    defaultClosesAt: "23:00",
    defaultOpensAt: "18:00",
    description: "Define quando a loja aceita pedidos pela vitrine publica.",
    kind: "ordering",
    label: "Funcionamento da loja",
    summary: "Pedidos online"
  },
  {
    defaultClosesAt: "23:00",
    defaultOpensAt: "18:00",
    description: "Define quando a operacao de entrega fica disponivel.",
    kind: "delivery",
    label: "Entrega",
    summary: "Janela de entrega"
  }
];

export function StoreForm({
  company,
  store
}: {
  company: AdminCurrentUserCompanyAccessContract;
  store: FoodStoreContract | null;
}) {
  return (
    <form action={saveFoodStoreAction} className="store-form">
      <input name="companyId" type="hidden" value={company.company.id} />

      <label>
        Nome publico da loja
        <input
          defaultValue={store?.displayName ?? company.company.tradeName ?? company.company.legalName}
          maxLength={120}
          name="displayName"
          required
        />
      </label>

      <label>
        Slug publico
        <input
          defaultValue={store?.publicSlug ?? suggestSlug(company)}
          maxLength={80}
          name="publicSlug"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
        />
      </label>

      <div className="form-grid">
        <label>
          Status operacional
          <select defaultValue={store?.status ?? "implementation"} name="status">
            {statusOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tempo de preparo
          <input
            defaultValue={store?.preparationTimeMinutes ?? ""}
            min={0}
            max={600}
            name="preparationTimeMinutes"
            type="number"
          />
        </label>
      </div>

      <label>
        Telefone de contato
        <input defaultValue={store?.contactPhone ?? ""} maxLength={40} name="contactPhone" />
      </label>

      <label>
        Observacoes de entrega
        <textarea
          defaultValue={store?.deliveryNotes ?? ""}
          maxLength={600}
          name="deliveryNotes"
          rows={4}
        />
      </label>

      <div className="form-footer">
        <span>Salvar emite o evento food.store.configured para o FP Robots.</span>
        <PendingSubmitButton pendingLabel="Salvando...">Salvar loja</PendingSubmitButton>
      </div>
    </form>
  );
}

export function StoreHoursForm({
  companyId,
  hours
}: {
  companyId: string;
  hours: FoodStoreHourContract[];
}) {
  return (
    <form action={saveFoodStoreHoursAction} className="store-form">
      <input name="companyId" type="hidden" value={companyId} />

      <div className="hours-layout">
        {hourKindOptions.map((group) => (
          <section className="content-panel stack-panel hours-card" key={group.kind}>
            <div className="panel-heading">
              <div>
                <h2>{group.label}</h2>
                <p>{group.description}</p>
              </div>
              <div className="panel-heading-actions">
                <span>{group.summary}</span>
                {group.allDayLabel ? <strong className="hours-card-badge">{group.allDayLabel}</strong> : null}
              </div>
            </div>

            <div className="hours-list">
              {weekdayOptions.map(([weekday, label]) => {
                const key = `${group.kind}:${weekday}`;
                const current = hours.find(
                  (hour) => hour.kind === group.kind && hour.weekday === weekday && hour.isActive
                );
                const isAllDay = current?.opensAt === "00:00" && current?.closesAt === "23:59";

                return (
                  <StoreHoursRow
                    allDayLabel={group.allDayLabel}
                    closesAt={current?.closesAt ?? group.defaultClosesAt}
                    defaultClosesAt={group.defaultClosesAt}
                    defaultOpensAt={group.defaultOpensAt}
                    isActive={Boolean(current)}
                    isAllDay={isAllDay}
                    key={key}
                    label={label}
                    nameKey={key}
                    opensAt={current?.opensAt ?? group.defaultOpensAt}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="content-panel stack-panel hours-actions-panel">
        <div className="form-footer">
          <span>Sem dias ativos em funcionamento, a loja segue aceitando pedidos enquanto o status estiver Aberta.</span>
          <PendingSubmitButton pendingLabel="Salvando...">Salvar horarios</PendingSubmitButton>
        </div>
      </section>
    </form>
  );
}

export function CategoryForm({
  category,
  companyId
}: {
  category?: FoodCategoryContract;
  companyId: string;
}) {
  return (
    <form action={saveFoodCategoryAction} className="store-form">
      <input name="companyId" type="hidden" value={companyId} />
      {category ? <input name="categoryId" type="hidden" value={category.id} /> : null}

      <div className="form-grid">
        <label>
          Nome
          <input defaultValue={category?.name ?? ""} maxLength={120} name="name" required />
        </label>
        <label>
          Slug
          <input
            defaultValue={category?.slug ?? ""}
            maxLength={80}
            name="slug"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="gerado automaticamente"
          />
        </label>
      </div>

      <label>
        Descricao
        <input defaultValue={category?.description ?? ""} maxLength={500} name="description" />
      </label>

      <div className="form-grid">
        <label>
          Status
          <select defaultValue={category?.status ?? "active"} name="status">
            {categoryStatusOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ordem
          <input defaultValue={category?.sortOrder ?? 100} min={0} name="sortOrder" type="number" />
        </label>
      </div>

      <div className="form-footer">
        <span>{category ? "Atualiza tambem a previa do cardapio." : "Crie grupos como Lanches ou Bebidas."}</span>
        <PendingSubmitButton pendingLabel="Salvando...">
          {category ? "Atualizar categoria" : "Criar categoria"}
        </PendingSubmitButton>
      </div>
    </form>
  );
}

export function ProductForm({
  categories,
  companyId,
  product
}: {
  categories: FoodCategoryContract[];
  companyId: string;
  product?: FoodProductContract;
}) {
  return (
    <form action={saveFoodProductAction} className="store-form">
      <input name="companyId" type="hidden" value={companyId} />
      {product ? <input name="productId" type="hidden" value={product.id} /> : null}

      <div className="form-grid">
        <label>
          Nome
          <input defaultValue={product?.name ?? ""} maxLength={140} name="name" required />
        </label>
        <label>
          Preco
          <input
            defaultValue={product ? formatMoneyInput(product.priceCents) : ""}
            min={0}
            name="price"
            placeholder="0,00"
            required
          />
        </label>
      </div>

      <div className="form-grid">
        <label>
          Categoria
          <select defaultValue={product?.categoryId ?? ""} name="categoryId">
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select defaultValue={product?.status ?? "available"} name="status">
            {productStatusOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Descricao
        <textarea
          defaultValue={product?.description ?? ""}
          maxLength={800}
          name="description"
          rows={3}
        />
      </label>

      <div className="form-grid">
        <label>
          Slug
          <input
            defaultValue={product?.slug ?? ""}
            maxLength={80}
            name="slug"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="gerado automaticamente"
          />
        </label>
        <label>
          Ordem
          <input defaultValue={product?.sortOrder ?? 100} min={0} name="sortOrder" type="number" />
        </label>
      </div>

      <label>
        Imagem URL
        <input defaultValue={product?.imageUrl ?? ""} maxLength={500} name="imageUrl" type="url" />
      </label>

      <div className="form-footer">
        <span>{product ? "Alteracoes emitem food.menu.updated." : "Produtos disponiveis aparecem na previa."}</span>
        <PendingSubmitButton pendingLabel="Salvando...">
          {product ? "Atualizar produto" : "Criar produto"}
        </PendingSubmitButton>
      </div>
    </form>
  );
}

export function MenuPreview({ menu }: { menu: FoodMenuContract | null }) {
  if (!menu) {
    return null;
  }

  return (
    <section className="content-panel menu-preview">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">Cardapio</div>
          <h1>{menu.store.displayName}</h1>
          <p>Previa interna com categorias ativas e produtos disponiveis.</p>
        </div>
        <span>Previa ativa</span>
      </div>

      <div className="menu-list">
        {menu.categories.map((category) => (
          <div className="menu-category" key={category.id}>
            <h3>{category.name}</h3>
            {category.description ? <p>{category.description}</p> : null}
            <div className="menu-products">
              {category.products.map((product) => (
                <div className="menu-product" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    {product.description ? <span>{product.description}</span> : null}
                  </div>
                  <b>{formatMoney(product.priceCents)}</b>
                </div>
              ))}
              {category.products.length === 0 ? (
                <span className="muted-copy">Sem produtos disponiveis nesta categoria.</span>
              ) : null}
            </div>
          </div>
        ))}

        {menu.uncategorizedProducts.length > 0 ? (
          <div className="menu-category">
            <h3>Outros produtos</h3>
            <div className="menu-products">
              {menu.uncategorizedProducts.map((product) => (
                <div className="menu-product" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    {product.description ? <span>{product.description}</span> : null}
                  </div>
                  <b>{formatMoney(product.priceCents)}</b>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {menu.categories.length === 0 && menu.uncategorizedProducts.length === 0 ? (
          <p className="muted-copy">A previa mostra apenas categorias ativas e produtos disponiveis.</p>
        ) : null}
      </div>
    </section>
  );
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(value / 100);
}

function formatMoneyInput(value: number): string {
  return (value / 100).toFixed(2).replace(".", ",");
}

function suggestSlug(companyAccess: AdminCurrentUserCompanyAccessContract): string {
  return displayCompanyName(companyAccess)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
