"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { cn } from "@/lib/cn";
import styles from "./prijava.module.css";

export function TextField(props: ComponentProps<"input">) {
  return (
    <div className={styles.field}>
      <Mail width={18} height={18} aria-hidden className={styles.fieldIcon} />
      <input {...props} className={styles.fieldInput} />
    </div>
  );
}

/**
 * Lozinka sa prekidačem za prikaz.
 *
 * Ikonica oka na mockupu je stvarno dugme, ne ukras — zato je ovo klijentska
 * komponenta. Prekidač ima `aria-pressed` i menja `aria-label`, da čitač ekrana
 * zna u kom je stanju; bez toga je to dugme bez značenja.
 */
export function PasswordField(props: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <Lock width={18} height={18} aria-hidden className={styles.fieldIcon} />
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(styles.fieldInput, styles.fieldInputWithToggle)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Sakrij lozinku" : "Prikaži lozinku"}
        className={styles.fieldToggle}
      >
        {visible ? (
          <Eye width={18} height={18} aria-hidden />
        ) : (
          <EyeOff width={18} height={18} aria-hidden />
        )}
      </button>
    </div>
  );
}
