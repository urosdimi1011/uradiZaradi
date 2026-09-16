import { redirect } from "next/navigation";

import { majstorRepository } from "@/modules/majstori/repository";
import { AvatarCrop } from "@/modules/majstori/ui/wizard/avatar-crop";
import { GalerijaUpload } from "@/modules/majstori/ui/wizard/galerija-upload";
import { Korak3Form } from "@/modules/majstori/ui/wizard/korak3-form";
import { WizardHeader } from "@/modules/majstori/ui/wizard/wizard-header";
import { requireUser } from "@/lib/session";

/**
 * Korak 3 — profil.
 *
 * Tri celine, namerno razdvojene: slika, fotografije radova i tekst. Slike se
 * otpremaju čim se izaberu, pa su gotove dok majstor još piše opis — dugme
 * „Sačuvaj" onda ne čeka ni na jedan bajt.
 */
export default async function ProfilPage() {
  const user = await requireUser();

  const profil = await majstorRepository.findWizardProfile(user.id);
  if (!profil) redirect("/registracija-majstora/zanat");
  if (profil.services.length === 0) redirect("/registracija-majstora/usluge");

  const izmena = profil.status === "ACTIVE";
  const zavrseni = ["zanat" as const, "usluge" as const, ...(profil.bio ? ["profil" as const] : [])];

  return (
    <>
      <WizardHeader
        izmena={izmena}
        naslov="Vaš profil"
        opis="Ovo je ono što posetilac vidi pre nego što odluči da vas pozove."
        trenutni="profil"
        zavrseni={izmena ? ["zanat", "usluge", "profil", "objava"] : zavrseni}
      />

      <div className="flex flex-col gap-8">
        <section>
          <h2 className="mb-3 text-sm font-medium text-content-primary">Profilna fotografija</h2>
          <AvatarCrop pocetniUrl={profil.avatarUrl} />
        </section>

        <section>
          <h2 className="mb-1 text-sm font-medium text-content-primary">Fotografije radova</h2>
          <p className="mb-3 text-xs leading-relaxed text-content-muted">
            Nije obavezno, ali profili sa fotografijama radova dobijaju osetno više poziva — posao
            koji se vidi ubedljiviji je od svakog opisa.
          </p>
          <GalerijaUpload pocetne={profil.gallery} />
        </section>

        <section>
          <Korak3Form
            izmena={profil.status === "ACTIVE"}
            pocetno={{
              bio: profil.bio,
              yearsExperience: profil.yearsExperience ? String(profil.yearsExperience) : "",
            }}
          />
        </section>
      </div>
    </>
  );
}
