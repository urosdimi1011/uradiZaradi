"use client";

import { useEffect } from "react";

/**
 * Dovodi aktivnu kategoriju u vidno polje trake koja skroluje.
 *
 * Bez ovoga se posle izbora zanata koji nije na početku trake (npr. „Bravari",
 * deveti po redu) traka vrati na levu ivicu, pa korisnik ne vidi šta je izabrao
 * dok ručno ne odskroluje.
 *
 * `scrollLeft` se računa ručno umesto `scrollIntoView()`: ta metoda skroluje i
 * sve pretke, pa bi uz pomeranje trake pomerila i celu stranicu naviše.
 *
 * Skače bez animacije — ovo je uspostavljanje polazne pozicije, ne pokret koji
 * korisnik treba da isprati.
 */
export function ScrollActiveIntoView({
  containerId,
  activeKey,
}: {
  containerId: string;
  /** Menja se sa izabranom kategorijom i ponovo pokreće pozicioniranje. */
  activeKey: string;
}) {
  useEffect(() => {
    const run = (): boolean => {
      const container = document.getElementById(containerId);
      // Još nema rasporeda — pozivalac pokušava ponovo.
      if (!container || container.clientWidth === 0) return false;

      // Na desktopu se traka prelama u više redova i nema šta da se skroluje.
      if (container.scrollWidth <= container.clientWidth) return true;

      const active = container.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active) {
        container.scrollLeft = 0;
        return true;
      }

      /*
       * Mera preko `getBoundingClientRect`, ne preko `offsetLeft`: `offsetLeft`
       * se računa od najbližeg pozicioniranog pretka, koji je ovde slučajno
       * `<body>`. Čim traka dobije pozicioniran omotač, ta računica bi tiho
       * dala pogrešan broj.
       */
      const containerRect = container.getBoundingClientRect();
      const itemRect = (active.closest("li") ?? active).getBoundingClientRect();
      const delta =
        itemRect.left - containerRect.left - (containerRect.width - itemRect.width) / 2;

      container.scrollLeft = Math.max(0, container.scrollLeft + delta);
      return true;
    };

    if (run()) return;

    /*
     * Efekat ume da se izvrši pre nego što traka dobije dimenzije (`clientWidth`
     * je tada 0), pa pokušavamo ponovo.
     *
     * `setTimeout`, ne `requestAnimationFrame`: rAF se ne okida dok stranica nije
     * vidljiva. U pozadinskoj kartici bi se skrol izgubio, a korisnik bi je
     * otvorio sa trakom na levoj ivici — tačno na problem koji rešavamo.
     */
    let attempts = 0;
    const timer = setInterval(() => {
      if (run() || ++attempts > 10) clearInterval(timer);
    }, 50);

    return () => clearInterval(timer);
  }, [containerId, activeKey]);

  return null;
}
