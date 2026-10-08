"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  type ContactField,
  HONEYPOT_FIELD,
  TOPICS,
} from "@/content/contact-fields";
import { parseDisplay } from "@/content/display-text";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { type ContactState, sendContact } from "@/server/actions/contact";
import { BookingButton } from "./BookingButton";
import styles from "./ContactForm.module.css";

// Storefront contact form component powered by React useActionState and Server Action.
type Labels = Dictionary["contact"]["form"];

const initial: ContactState = { status: "idle" };

export function ContactForm({
  locale,
  labels: t,
  email,
  bookingDict,
}: {
  locale: Locale;
  labels: Labels;
  email: string;
  bookingDict?: Dictionary["booking"];
}) {
  const [resetKey, setResetKey] = useState(0);

  return (
    <ContactFormInner
      key={resetKey}
      locale={locale}
      labels={t}
      email={email}
      bookingDict={bookingDict}
      onReset={() => setResetKey((k) => k + 1)}
    />
  );
}

function ContactFormInner({
  locale,
  labels: t,
  email,
  bookingDict,
  onReset,
}: {
  locale: Locale;
  labels: Labels;
  email: string;
  bookingDict?: Dictionary["booking"];
  onReset: () => void;
}) {
  const [state, action, pending] = useActionState(sendContact, initial);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status !== "idle") resultRef.current?.focus();
  }, [state]);

  if (state.status === "sent") {
    const rawTitle = state.name
      ? t.sentTitleNamed.replace("{name}", state.name)
      : t.sentTitleDefault;
    const statement = parseDisplay(rawTitle).flat();

    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={styles.sentState}
      >
        <p className={styles.sentLabel}>{t.sentLabel}</p>

        <h3 className={styles.sentStatement}>
          {statement.map((seg) =>
            seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
          )}
        </h3>

        <p className={styles.sentText}>{t.sent}</p>

        <dl className={styles.sentDetails}>
          <div>
            <dt>{t.sentDelayLabel}</dt>
            <dd>{t.sentDelayValue}</dd>
          </div>
          <div>
            <dt>{t.sentRecipientLabel}</dt>
            <dd>
              <span>{t.sentRecipientValue}</span>
              <span className={styles.sentSep} aria-hidden="true">
                ·
              </span>
              <a href={`mailto:${email}`} className={styles.sentEmailLink}>
                {email}
              </a>
            </dd>
          </div>
          {state.email ? (
            <div>
              <dt>{t.sentEmailLabel}</dt>
              <dd className={styles.sentClientEmail}>{state.email}</dd>
            </div>
          ) : null}
        </dl>

        <div className={styles.sentActions}>
          <button type="button" onClick={onReset} className={styles.sentPill}>
            <span>{t.sentReset}</span>
          </button>

          {bookingDict ? (
            <BookingButton
              label={t.sentBookCall}
              locale={locale}
              dict={bookingDict}
              className={styles.sentPill}
              showIcon
            />
          ) : null}
        </div>
      </div>
    );
  }

  const error = state.status === "error" ? state : null;
  const invalid = (f: ContactField) => Boolean(error?.fields.includes(f));
  const value = (f: ContactField) => error?.values[f] ?? "";
  const fieldError: Record<ContactField, string> = {
    name: t.fieldName,
    email: t.fieldEmail,
    message: t.fieldMessage,
    projectType: t.fieldChoice,
    budget: t.fieldChoice,
    topic: t.fieldChoice,
  };
  // Screen-reader accessible error descriptions
  const describe = (f: ContactField) =>
    invalid(f)
      ? { "aria-invalid": true, "aria-describedby": `${f}-error` }
      : {};
  const errorText = (f: ContactField) =>
    invalid(f) ? (
      <p id={`${f}-error`} className={styles.error}>
        {fieldError[f]}
      </p>
    ) : null;
  const topicLabel: Record<(typeof TOPICS)[number], string> = {
    job: t.topicJob,
    freelance: t.topicFreelance,
    other: t.topicOther,
  };

  return (
    <>
      {error ? (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="alert"
          className={styles.alert}
        >
          {error.code === "invalid" ? <p>{t.errorInvalid}</p> : null}
          {error.code === "rate" ? <p>{t.errorRate}</p> : null}
          {error.code === "unavailable" ? (
            <p>
              {t.errorUnavailable} <a href={`mailto:${email}`}>{email}</a>
            </p>
          ) : null}
        </div>
      ) : null}

      <form
        action={action}
        key={JSON.stringify(error?.values ?? {})}
        className={styles.form}
      >
        <input type="hidden" name="locale" value={locale} />
        <fieldset
          className={styles.topics}
          {...(invalid("topic")
            ? { "aria-invalid": true, "aria-describedby": "topic-error" }
            : {})}
        >
          <legend className={styles.legend}>{t.topic}</legend>
          {TOPICS.map((v) => (
            <label key={v} className={styles.chip}>
              <input
                type="radio"
                name="topic"
                value={v}
                defaultChecked={value("topic") === v}
              />
              <span>{topicLabel[v]}</span>
            </label>
          ))}
          {errorText("topic")}
        </fieldset>
        <div className={styles.row}>
          <p className={styles.field}>
            <label htmlFor="name">{t.name}</label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              defaultValue={value("name")}
              {...describe("name")}
            />
            {errorText("name")}
          </p>
          <p className={styles.field}>
            <label htmlFor="email">{t.email}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={200}
              defaultValue={value("email")}
              {...describe("email")}
            />
            {errorText("email")}
          </p>
        </div>
        <p className={styles.field}>
          <label htmlFor="message">{t.message}</label>
          <textarea
            id="message"
            name="message"
            required
            minLength={10}
            maxLength={5000}
            rows={5}
            defaultValue={value("message")}
            {...describe("message")}
          />
          {errorText("message")}
        </p>
        {/* Anti-spam honeypot input */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-10000px",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        >
          <label htmlFor={HONEYPOT_FIELD}>{t.honeypot}</label>
          <input
            id={HONEYPOT_FIELD}
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>
        <p className={styles.actions}>
          <button type="submit" disabled={pending} className={styles.submit}>
            {pending ? t.sending : t.send}
            <span aria-hidden="true"> ↗</span>
          </button>
        </p>
      </form>
    </>
  );
}
