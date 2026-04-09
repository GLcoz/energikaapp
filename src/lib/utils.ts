import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " DH";
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function getMonthName(month: number): string {
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  return months[month - 1] || "";
}

export function generateWhatsAppMessage(
  parentPhone: string,
  patientName: string,
  month: string,
  amount: number
): string {
  const phone = parentPhone.replace(/[^0-9]/g, "");
  const formattedPhone = phone.startsWith("0")
    ? "212" + phone.slice(1)
    : phone;
  const message = encodeURIComponent(
    `Bonjour,\n\nNous vous contactons du centre Energika concernant le forfait de ${patientName} pour le mois de ${month}.\n\nLe montant de ${formatCurrency(amount)} est en attente de règlement.\n\nMerci de votre compréhension.\n\nCordialement,\nCentre Energika`
  );
  return `https://wa.me/${formattedPhone}?text=${message}`;
}
