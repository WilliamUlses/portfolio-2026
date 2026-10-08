"use client";

import {
  useActionState,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { glassMapUrl } from "@/motion/glass-map";
import {
  type BookingActionState,
  bookAppointment,
} from "@/server/actions/booking";
import type { BookingSlot } from "@/server/booking";
import styles from "./BookingModal.module.css";
import { Monogram } from "./Monogram";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  dict: Dictionary["booking"];
}

const initialActionState: BookingActionState = { status: "idle" };

// Liquid glass parameters matching MobileDrawer
const GLASS = {
  radius: 32,
  bezel: 26,
  lateral: 0.55,
  jitter: 0.35,
  scale: { r: 42, g: 39, b: 35 },
  soften: { before: 16, after: 6 },
};

function BookingGlassFilter({
  map,
  width,
  height,
}: {
  map: string;
  width: number;
  height: number;
}) {
  const only = (r: number, g: number, b: number) =>
    `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
  const channels = [
    { key: "r", scale: GLASS.scale.r, matrix: only(1, 0, 0) },
    { key: "g", scale: GLASS.scale.g, matrix: only(0, 1, 0) },
    { key: "b", scale: GLASS.scale.b, matrix: only(0, 0, 1) },
  ];
  return (
    <svg className={styles.defs} aria-hidden="true" focusable="false">
      <filter
        id="booking-glass"
        x="0"
        y="0"
        width={width}
        height={height}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href={map}
          x="0"
          y="0"
          width={width}
          height={height}
          preserveAspectRatio="none"
          result="map"
        />
        <feGaussianBlur
          in="map"
          stdDeviation={GLASS.soften.before}
          result="softMap"
        />
        <feComponentTransfer in="softMap" result="flat">
          <feFuncR type="linear" slope="0.75" intercept="0.125" />
          <feFuncG type="linear" slope="0.75" intercept="0.125" />
          <feFuncB type="linear" slope="0.75" intercept="0.125" />
        </feComponentTransfer>
        {channels.map((c) => (
          <feDisplacementMap
            key={c.key}
            in="SourceGraphic"
            in2="flat"
            scale={c.scale}
            xChannelSelector="R"
            yChannelSelector="G"
            result={`disp_${c.key}`}
          />
        ))}
        {channels.map((c) => (
          <feColorMatrix
            key={c.key}
            in={`disp_${c.key}`}
            type="matrix"
            values={c.matrix}
            result={`ch_${c.key}`}
          />
        ))}
        <feBlend in="ch_r" in2="ch_g" mode="screen" result="rg" />
        <feBlend in="rg" in2="ch_b" mode="screen" result="chroma" />
        <feGaussianBlur
          in="chroma"
          stdDeviation={GLASS.soften.after}
          result="diffused"
        />
        <feBlend in="SourceGraphic" in2="diffused" mode="normal" />
      </filter>
    </svg>
  );
}

export function BookingModal({
  isOpen,
  onClose,
  locale,
  dict,
}: BookingModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [glass, setGlass] = useState(false);
  const [modalSize, setModalSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [map, setMap] = useState("");

  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>("job");

  const [actionState, formAction, isPending] = useActionState(
    bookAppointment,
    initialActionState,
  );

  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect Chromium for displacement filter
  useEffect(() => {
    const brands =
      (
        navigator as Navigator & {
          userAgentData?: { brands: { brand: string }[] };
        }
      ).userAgentData?.brands ?? [];
    setGlass(brands.some((b) => b.brand === "Chromium"));
  }, []);

  // Measure modal for refraction map
  useLayoutEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;
    const measure = () => {
      const w = modal.offsetWidth;
      const h = modal.offsetHeight;
      if (w > 0 && h > 0) {
        setModalSize((prev) =>
          prev && prev.w === w && prev.h === h ? prev : { w, h },
        );
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(modal);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isOpen]);

  useEffect(() => {
    if (glass && modalSize) {
      setMap(
        glassMapUrl(
          modalSize.w,
          modalSize.h,
          GLASS.radius,
          GLASS.bezel,
          GLASS.lateral,
          GLASS.jitter,
          Math.min(window.devicePixelRatio || 1, 2),
        ),
      );
    }
  }, [glass, modalSize]);

  // Load available slots and current month on open
  useEffect(() => {
    if (!isOpen) return;

    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));

    let ignore = false;
    setLoading(true);
    setFetchError(false);

    fetch("/api/booking/slots")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (ignore) return;
        const list: BookingSlot[] = data.slots ?? [];
        setSlots(list);
        const first = list[0];
        if (first) {
          setSelectedDate((prev) => prev ?? first.date);
        }
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Failed to load booking slots:", err);
        setFetchError(true);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  // Lock scrolling & blur entire background page (exact match with MobileDrawer)
  useEffect(() => {
    if (!isOpen) return;

    window.dispatchEvent(new CustomEvent("wu:modal-open"));
    document.documentElement.dataset.drawerOpen = "true";
    document.documentElement.dataset.modalOpen = "true";

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.dispatchEvent(new CustomEvent("wu:modal-close"));
      delete document.documentElement.dataset.drawerOpen;
      delete document.documentElement.dataset.modalOpen;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const availableDatesSet = useMemo(() => {
    return new Set(slots.map((s) => s.date));
  }, [slots]);

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return slots.filter((s) => s.date === selectedDate);
  }, [slots, selectedDate]);

  const calendarDays = useMemo(() => {
    if (!currentMonth) return [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: {
      key: string;
      day: number;
      dateStr: string;
      isPad: boolean;
    }[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        key: `pad-${year}-${month}-${i}`,
        day: 0,
        dateStr: "",
        isPad: true,
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({
        key: dateStr,
        day,
        dateStr,
        isPad: false,
      });
    }
    return days;
  }, [currentMonth]);

  const monthLabel = useMemo(() => {
    if (!currentMonth) return "";
    return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      month: "long",
      year: "numeric",
    }).format(currentMonth);
  }, [currentMonth, locale]);

  const selectedDateFormatted = useMemo(() => {
    if (!selectedDate) return "";
    const parts = selectedDate.split("-").map(Number);
    const y = parts[0] ?? 2026;
    const m = parts[1] ?? 1;
    const d = parts[2] ?? 1;
    return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(y, m - 1, d));
  }, [selectedDate, locale]);

  const dayHeaders = useMemo(
    () =>
      locale === "fr"
        ? [
            { id: "mon", label: "L" },
            { id: "tue", label: "M" },
            { id: "wed", label: "M" },
            { id: "thu", label: "J" },
            { id: "fri", label: "V" },
            { id: "sat", label: "S" },
            { id: "sun", label: "D" },
          ]
        : [
            { id: "mon", label: "M" },
            { id: "tue", label: "T" },
            { id: "wed", label: "W" },
            { id: "thu", label: "T" },
            { id: "fri", label: "F" },
            { id: "sat", label: "S" },
            { id: "sun", label: "S" },
          ],
    [locale],
  );

  const topics = [
    { id: "job", label: dict.topicJob },
    { id: "freelance", label: dict.topicFreelance },
    { id: "exchange", label: dict.topicExchange },
    { id: "other", label: dict.topicOther },
  ];

  if (!mounted) return null;

  return createPortal(
    <div
      className={styles.overlay}
      data-open={isOpen}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label={dict.close}
        tabIndex={isOpen ? 0 : -1}
      />

      <div
        ref={modalRef}
        className={styles.modal}
        data-glass={glass && map ? "" : undefined}
      >
        {glass && map && modalSize ? (
          <BookingGlassFilter
            map={map}
            width={modalSize.w}
            height={modalSize.h}
          />
        ) : null}

        {/* Topbar Apple Control Center with Monogram & close button */}
        <div className={styles.topBar}>
          <div className={styles.brand}>
            <Monogram size={28} />
            <div className={styles.brandText}>
              <span className={styles.brandName}>William Ulses</span>
              <span className={styles.brandTag}>[ {dict.title} ]</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={dict.close}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {actionState.status === "success" ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon} aria-hidden="true">
                ✓
              </div>
              <h3 className={styles.successTitle}>{dict.successTitle}</h3>
              <p className={styles.successDesc}>
                {dict.successDesc}
                <br />
                <strong style={{ display: "inline-block", marginTop: 6 }}>
                  {actionState.dateFormatted}
                </strong>
              </p>

              <div className={styles.calendarButtonsRow}>
                {/* Apple Calendar native ICS direct download/open */}
                <a
                  href={`data:text/calendar;charset=utf-8,${encodeURIComponent(actionState.icsContent)}`}
                  download="rendez-vous-william-ulses.ics"
                  className={styles.calendarBtn}
                >
                  <span> Ajouter à Apple Calendar</span>
                  <span aria-hidden="true">↓</span>
                </a>

                {/* Google Calendar direct link */}
                <a
                  href={actionState.googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.calendarBtn}
                >
                  <span>🌐 Ajouter à Google Calendar</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>

              <button
                type="button"
                className={styles.actionBtn}
                onClick={onClose}
                style={{ width: "100%", marginTop: 12 }}
              >
                {dict.finish}
              </button>
            </div>
          ) : loading ? (
            <div className={styles.controlCard}>
              <p className={styles.cardTitle}>{dict.loadingSlots}</p>
            </div>
          ) : fetchError || slots.length === 0 ? (
            <div className={styles.controlCard}>
              <p className={styles.cardTitle}>{dict.noSlots}</p>
            </div>
          ) : !selectedSlot ? (
            <div className={styles.step1Grid}>
              {/* Step 1: Calendar card */}
              <div className={styles.controlCard}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>{dict.step1}</h4>
                  <span style={{ fontSize: 11, opacity: 0.65 }}>
                    {dict.duration}
                  </span>
                </div>

                <div className={styles.monthNav}>
                  <button
                    type="button"
                    className={styles.navArrow}
                    onClick={() => {
                      if (!currentMonth) return;
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1,
                          1,
                        ),
                      );
                    }}
                    aria-label="Previous month"
                  >
                    ←
                  </button>
                  <h5 className={styles.monthTitle}>{monthLabel}</h5>
                  <button
                    type="button"
                    className={styles.navArrow}
                    onClick={() => {
                      if (!currentMonth) return;
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1,
                          1,
                        ),
                      );
                    }}
                    aria-label="Next month"
                  >
                    →
                  </button>
                </div>

                <div className={styles.calendarGrid}>
                  {dayHeaders.map((dh) => (
                    <div key={dh.id} className={styles.dayHeader}>
                      {dh.label}
                    </div>
                  ))}
                  {calendarDays.map((cell) => {
                    if (cell.isPad) {
                      return <div key={cell.key} />;
                    }
                    const isAvail = availableDatesSet.has(cell.dateStr);
                    const isSel = selectedDate === cell.dateStr;
                    return (
                      <button
                        key={cell.key}
                        type="button"
                        className={styles.dayBtn}
                        disabled={!isAvail}
                        data-available={isAvail}
                        data-selected={isSel}
                        onClick={() => setSelectedDate(cell.dateStr)}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots section */}
              {selectedDate && slotsForSelectedDate.length > 0 ? (
                <div className={styles.controlCard}>
                  <div className={styles.cardHeader}>
                    <h4 className={styles.cardTitle}>
                      {dict.selectSlot} {selectedDateFormatted}
                    </h4>
                  </div>
                  <div className={styles.slotsGrid}>
                    {slotsForSelectedDate.map((slot) => (
                      <button
                        key={slot.startIso}
                        type="button"
                        className={styles.slotBtn}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className={styles.controlCard}
                  style={{ justifyContent: "center", minHeight: 200 }}
                >
                  <div className={styles.cardHeader}>
                    <h4 className={styles.cardTitle}>{dict.selectSlot}</h4>
                  </div>
                  <p
                    style={{
                      margin: "24px 0",
                      fontSize: 13,
                      opacity: 0.7,
                      textAlign: "center",
                      lineHeight: 1.5,
                    }}
                  >
                    {locale === "fr"
                      ? "Sélectionnez un jour sur le calendrier pour voir les créneaux disponibles."
                      : "Select a day on the calendar to see available slots."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Information form */
            <div className={styles.controlCard}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>{dict.step2}</h4>
                <button
                  type="button"
                  className={styles.closeButton}
                  style={{
                    width: "auto",
                    height: "auto",
                    padding: "4px 10px",
                    borderRadius: 999,
                  }}
                  onClick={() => setSelectedSlot(null)}
                >
                  ← {dict.back}
                </button>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "rgb(255 255 255 / 0.08)",
                  border: "1px solid rgb(255 255 255 / 0.16)",
                  fontSize: 13,
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                <strong>{selectedDateFormatted}</strong> · {selectedSlot.time}{" "}
                (30 min)
              </div>

              <form
                action={formAction}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <input
                  type="hidden"
                  name="startIso"
                  value={selectedSlot.startIso}
                />
                <input type="hidden" name="topic" value={selectedTopic} />

                <div className={styles.nameEmailRow}>
                  <div className={styles.inputField}>
                    <label htmlFor="bk-name" className={styles.inputLabel}>
                      {dict.name} *
                    </label>
                    <input
                      id="bk-name"
                      name="name"
                      type="text"
                      required
                      maxLength={100}
                      placeholder={dict.namePlaceholder}
                      className={styles.textInput}
                    />
                  </div>

                  <div className={styles.inputField}>
                    <label htmlFor="bk-email" className={styles.inputLabel}>
                      {dict.email} *
                    </label>
                    <input
                      id="bk-email"
                      name="email"
                      type="email"
                      required
                      placeholder={dict.emailPlaceholder}
                      className={styles.textInput}
                    />
                  </div>
                </div>

                {/* Apple Segmented Control for Topic selection */}
                <div className={styles.inputField}>
                  <span className={styles.inputLabel}>{dict.topic}</span>
                  <div className={styles.segmentedRow}>
                    {topics.map((top) => (
                      <button
                        key={top.id}
                        type="button"
                        className={styles.segmentBtn}
                        data-active={selectedTopic === top.id}
                        onClick={() => setSelectedTopic(top.id)}
                      >
                        {top.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.inputField}>
                  <label htmlFor="bk-notes" className={styles.inputLabel}>
                    {dict.notes}
                  </label>
                  <textarea
                    id="bk-notes"
                    name="notes"
                    rows={2}
                    maxLength={1000}
                    placeholder={dict.notesPlaceholder}
                    className={styles.textareaInput}
                  />
                </div>

                {actionState.status === "error" && (
                  <p
                    style={{
                      color: "#ff5a5a",
                      fontSize: 13,
                      margin: "2px 0",
                    }}
                  >
                    {actionState.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.actionBtn}
                >
                  {isPending ? dict.bookingInProgress : dict.confirm}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
