import { redirect } from "next/navigation";

export default function NewUserRedirectPage() {
  redirect("/cadastro/empresas");
}
