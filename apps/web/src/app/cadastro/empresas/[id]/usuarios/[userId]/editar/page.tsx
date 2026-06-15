import { redirect } from "next/navigation";

type EditCompanyUserAccessPageProps = {
  params: Promise<{
    id: string;
    userId: string;
  }>;
};

export default async function EditCompanyUserAccessPage({
  params
}: EditCompanyUserAccessPageProps) {
  const { id, userId } = await params;

  redirect(`/cadastro/empresas/${id}/usuarios/${userId}`);
}
