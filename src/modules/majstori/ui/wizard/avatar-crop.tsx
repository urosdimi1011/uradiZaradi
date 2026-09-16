"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { AlertCircle, Camera, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { otpremiSlikuAction } from "@/modules/majstori/actions";
import { isecinAvatar, proveriIzabranFajl } from "./slika-utils";

/**
 * Izbor i sečenje profilne slike.
 *
 * Slika se seče u KVADRAT jer se svuda prikazuje kao kvadrat — na kartici, u
 * zaglavlju, na profilu. Da se seče na serveru po sredini, polovina majstora bi
 * dobila fotografiju bez glave; ovako čovek sam bira šta ostaje.
 *
 * Pregled je stalno vidljiv sa strane: kadar koji lepo izgleda u velikom
 * kvadratu često ne valja u malom, a malog ima svuda po sajtu.
 */
export function AvatarCrop({ pocetniUrl }: { pocetniUrl: string | null }) {
  const [izvor, setIzvor] = useState<string | null>(null);
  const [url, setUrl] = useState(pocetniUrl);
  const [greska, setGreska] = useState<string | null>(null);
  const [radi, setRadi] = useState(false);

  const [pozicija, setPozicija] = useState({ x: 0, y: 0 });
  const [zumiranje, setZumiranje] = useState(1);
  const isecakRef = useRef<Area | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Adresa iz `createObjectURL` drži fajl u memoriji dok se ne oslobodi. */
  useEffect(() => {
    return () => {
      if (izvor) URL.revokeObjectURL(izvor);
    };
  }, [izvor]);

  const zapamtiIsecak = useCallback((_: Area, uPikselima: Area) => {
    isecakRef.current = uPikselima;
  }, []);

  function izaberi(event: React.ChangeEvent<HTMLInputElement>) {
    const fajl = event.currentTarget.files?.[0];
    if (!fajl) return;

    const problem = proveriIzabranFajl(fajl);
    if (problem) {
      setGreska(problem);
      return;
    }

    setGreska(null);
    setIzvor(URL.createObjectURL(fajl));
    setPozicija({ x: 0, y: 0 });
    setZumiranje(1);
  }

  async function sacuvaj() {
    if (!izvor || !isecakRef.current) return;

    setRadi(true);
    setGreska(null);

    try {
      const blob = await isecinAvatar(izvor, isecakRef.current);

      const podaci = new FormData();
      podaci.append("slika", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      podaci.append("vrsta", "avatar");

      const odgovor = await otpremiSlikuAction(podaci);
      if (odgovor.error) {
        setGreska(odgovor.error);
        return;
      }

      setUrl(odgovor.url ?? null);
      setIzvor(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setGreska("Slika nije mogla da se obradi. Pokušajte sa drugom fotografijom.");
    } finally {
      setRadi(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {izvor ? (
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative h-64 w-full overflow-hidden rounded-[var(--radius-control)] bg-black sm:flex-1">
            <Cropper
              image={izvor}
              crop={pozicija}
              zoom={zumiranje}
              aspect={1}
              onCropChange={setPozicija}
              onZoomChange={setZumiranje}
              onCropComplete={zapamtiIsecak}
            />
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2 sm:w-40">
            <span className="text-xs text-content-muted">Ovako će izgledati</span>
            {/*
              Pregled je isti element kao kropovanje, samo mali — ne pravi se
              druga slika. Kadar koji valja u velikom kvadratu često ne valja
              u malom, a malog ima svuda po sajtu.
            */}
            <div className="relative h-20 w-20 overflow-hidden rounded-[var(--radius-pill)] bg-black">
              <Cropper
                image={izvor}
                crop={pozicija}
                zoom={zumiranje}
                aspect={1}
                showGrid={false}
                onCropChange={() => undefined}
                onZoomChange={() => undefined}
              />
            </div>

            <label className="mt-2 w-full text-xs text-content-secondary">
              Uvećanje
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zumiranje}
                onChange={(event) => setZumiranje(Number(event.currentTarget.value))}
                className="mt-1 w-full accent-[var(--color-brand)]"
                aria-label="Uvećanje slike"
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-pill)] border border-line bg-surface-hover">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element -- slika iz skladišta, bez poznatih dimenzija
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera width={22} height={22} aria-hidden className="text-content-muted" />
            )}
          </span>

          <div>
            <p className="text-sm text-content-primary">
              {url ? "Profilna fotografija je postavljena." : "Bez fotografije."}
            </p>
            {/*
              Ovo nije prazna pohvala nego razlog zbog kog majstor treba da
              uloži minut: profil sa licem dobija osetno više poziva.
            */}
            <p className="mt-0.5 text-xs leading-relaxed text-content-muted">
              Majstore sa fotografijom ljudi zovu znatno češće — lice uliva poverenje pre nego što
              se iko javi.
            </p>
          </div>
        </div>
      )}

      {greska ? (
        <p className="flex items-start gap-1.5 text-xs text-danger" role="alert">
          <AlertCircle width={14} height={14} aria-hidden className="mt-px shrink-0" />
          {greska}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={izaberi}
          className="text-xs text-content-secondary file:mr-3 file:rounded-[var(--radius-control)] file:border file:border-line file:bg-surface-input file:px-3 file:py-2 file:text-xs file:text-content-primary"
          aria-label="Izaberite profilnu fotografiju"
        />

        {izvor ? (
          <Button type="button" onClick={sacuvaj} disabled={radi} size="sm">
            {radi ? <Loader2 aria-hidden className="h-[1em] w-[1em] animate-spin" /> : "Sačuvaj sliku"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
