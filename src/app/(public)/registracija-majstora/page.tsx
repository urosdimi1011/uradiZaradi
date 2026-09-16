import { redirect } from "next/navigation";

import { majstorRepository } from "@/modules/majstori/repository";
import { requireUser } from "@/lib/session";

/**
 * Bez koraka u adresi — vodi na prvi nepopunjen.
 *
 * „Gde sam stao" odgovara BAZA, ne stanje u pretraživaču. Zato osvežavanje,
 * zatvorena kartica i povratak sutradan daju isti odgovor: sledeći korak je
 * onaj čiji podaci još ne postoje.
 */
export default async function WizardPage() {
  const user = await requireUser();
  const profil = await majstorRepository.findWizardProfile(user.id);

  /* Nema profila — tek se kreira, dakle prvi korak. */
  if (!profil) redirect("/registracija-majstora/zanat");

  if (profil.services.length === 0) redirect("/registracija-majstora/usluge");
  if (!profil.bio) redirect("/registracija-majstora/profil");

  redirect("/registracija-majstora/objava");
}
