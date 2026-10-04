"use server";

import { and, eq, gte, lte } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db/client";
import { appointments, type appointmentTopicEnum } from "@/db/schema";
import { env } from "@/lib/env";
import { generateAppointmentIcs, getGoogleCalendarUrl } from "@/server/ics";

export type BookingActionState =
  | { status: "idle" }
  | {
      status: "success";
      appointmentId: number;
      icsContent: string;
      dateFormatted: string;
      googleCalendarUrl: string;
    }
  | {
      status: "error";
      message: string;
    };

const TOPIC_LABELS: Record<string, string> = {
  job: "Opportunité CDI",
  freelance: "Mission freelance",
  exchange: "Échange technique / Café virtuel",
  other: "Autre",
};

export async function bookAppointment(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const topic = String(formData.get("topic") ?? "job").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const startIso = String(formData.get("startIso") ?? "").trim();

  if (!name || name.length > 100) {
    return { status: "error", message: "Nom invalide." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { status: "error", message: "Adresse e-mail invalide." };
  }

  if (!startIso) {
    return { status: "error", message: "Créneau horaire manquant." };
  }

  const startTime = new Date(startIso);
  if (Number.isNaN(startTime.getTime()) || startTime <= new Date()) {
    return { status: "error", message: "Date de créneau invalide ou passée." };
  }

  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes

  try {
    // Check if slot was taken in the meantime
    const conflicts = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.status, "confirmed"),
          gte(appointments.startTime, startTime),
          lte(appointments.endTime, endTime),
        ),
      );

    if (conflicts.length > 0) {
      return {
        status: "error",
        message:
          "Ce créneau vient d'être réservé. Veuillez en choisir un autre.",
      };
    }

    // Insert new appointment
    const [inserted] = await db
      .insert(appointments)
      .values({
        name,
        email,
        topic: (topic in TOPIC_LABELS
          ? topic
          : "other") as (typeof appointmentTopicEnum.enumValues)[number],
        notes: notes.slice(0, 1000),
        startTime,
        endTime,
        status: "confirmed",
      })
      .returning({ id: appointments.id });

    if (!inserted) {
      return {
        status: "error",
        message: "Impossible d'enregistrer le rendez-vous. Veuillez réessayer.",
      };
    }

    const topicLabel = TOPIC_LABELS[topic] ?? topic;
    const icsContent = generateAppointmentIcs({
      id: inserted.id,
      name,
      email,
      topic: topicLabel,
      startTime,
      endTime,
      notes,
    });

    const googleCalendarUrl = getGoogleCalendarUrl({
      name,
      topic: topicLabel,
      startTime,
      endTime,
      notes,
    });

    const dateFormatted = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    }).format(startTime);

    // Send confirmation emails via Resend
    if (env.RESEND_API_KEY) {
      const resend = new Resend(env.RESEND_API_KEY);
      const icsBase64 = Buffer.from(icsContent, "utf-8").toString("base64");
      const fromEmail =
        env.CONTACT_FROM_EMAIL || "Portfolio <contact@williamulses.fr>";

      // 1. Email to client with ICS attachment configured for native calendar invite
      try {
        const clientRes = await resend.emails.send({
          from: fromEmail,
          to: email,
          replyTo: "contact@williamulses.fr",
          subject: `Confirmation rendez-vous · ${dateFormatted}`,
          text: `Bonjour ${name},\n\nVotre créneau avec William Ulses est bien confirmé pour le :\n${dateFormatted} (Heure de Paris)\n\nSujet : ${topicLabel}${notes ? `\nNotes : ${notes}` : ""}\n\nUn lien de visioconférence vous sera communiqué en amont. L'invitation calendrier est attachée à cet e-mail pour l'ajouter directement à votre agenda.\n\nLien rapide Google Calendar : ${googleCalendarUrl}\n\nÀ très vite,\nWilliam Ulses\nwilliamulses.fr`,
          attachments: [
            {
              filename: "rendez-vous-william-ulses.ics",
              content: icsBase64,
              contentType: "text/calendar; method=REQUEST; charset=UTF-8",
            },
          ],
        });
        if (clientRes.error) {
          console.error(
            "[booking] Resend client email error:",
            clientRes.error,
          );
        } else {
          console.log(
            "[booking] Resend client email sent successfully:",
            clientRes.data?.id,
          );
        }
      } catch (err) {
        console.error(
          "[booking] Failed sending client confirmation email:",
          err,
        );
      }

      // 2. Notification email to William (sent to his gmail and configured email)
      const recipientEmails = Array.from(
        new Set([
          "williamulses78@gmail.com",
          env.CONTACT_TO_EMAIL || "contact@williamulses.fr",
        ]),
      );

      for (const to of recipientEmails) {
        try {
          const hostRes = await resend.emails.send({
            from: fromEmail,
            to,
            replyTo: email,
            subject: `📅 Nouveau RDV : ${name} (${topicLabel}) · ${dateFormatted}`,
            text: `Nouveau rendez-vous réservé sur le portfolio !\n\n- Invité : ${name}\n- E-mail : ${email}\n- Date : ${dateFormatted} (Heure de Paris)\n- Sujet : ${topicLabel}\n${notes ? `- Notes : ${notes}\n` : ""}\nL'invitation calendrier .ics est jointe à cet e-mail. Ouvrez-la pour l'ajouter instantanément dans votre Apple Calendar.\nLien Google Calendar direct : ${googleCalendarUrl}`,
            attachments: [
              {
                filename: "rendez-vous.ics",
                content: icsBase64,
                contentType: "text/calendar; method=REQUEST; charset=UTF-8",
              },
            ],
          });
          if (hostRes.error) {
            console.error(
              `[booking] Resend host email error to ${to}:`,
              hostRes.error,
            );
          } else {
            console.log(
              `[booking] Resend host email sent successfully to ${to}:`,
              hostRes.data?.id,
            );
          }
        } catch (err) {
          console.error(
            `[booking] Failed sending host notification to ${to}:`,
            err,
          );
        }
      }
    } else {
      console.warn(
        "[booking] RESEND_API_KEY is missing. Skipping email delivery.",
      );
    }

    return {
      status: "success",
      appointmentId: inserted.id,
      icsContent,
      dateFormatted,
      googleCalendarUrl,
    };
  } catch (err) {
    console.error("[booking] Booking submission error:", err);
    return {
      status: "error",
      message:
        "Une erreur est survenue lors de la réservation. Veuillez réessayer.",
    };
  }
}
