"use client";

import { isNative } from './platform';

/** Doğru cevap haptic'i — orta şiddetli titreşim */
export async function hapticCorrect(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Success });
}

/** Yanlış cevap haptic'i — hata titreşimi */
export async function hapticWrong(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Error });
}

/** Hafif dokunma — buton tıklama, kart çevirme */
export async function hapticLight(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Light });
}

/** Orta dokunma — çark tick, eleman yerleştirme */
export async function hapticMedium(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Medium });
}

/** Kutlama haptic'i — ağır titreşim */
export async function hapticHeavy(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Heavy });
}
