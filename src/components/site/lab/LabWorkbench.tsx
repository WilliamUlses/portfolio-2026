"use client";

import { useEffect, useRef, useState } from "react";
import { parseDisplay } from "@/content/display-text";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  DEFAULT_FLUTED_CONTROLS,
  type FlutedGlassControls,
  mountInteractiveFlutedGlass,
} from "@/motion/webgl/fluted-glass";
import {
  DEFAULT_MONOGRAM_PARAMS,
  type GlassMonogram,
  type MonogramShaderParams,
  mountGlassMonogram,
} from "@/motion/webgl/glass-monogram";
import styles from "./LabWorkbench.module.css";

type TabMode = "prism" | "fluted";

export function LabWorkbench({ dict }: { dict: Dictionary }) {
  const t = dict.lab;
  const [activeTab, setActiveTab] = useState<TabMode>("prism");
  const [copied, setCopied] = useState(false);

  // ── Module 1: Monogram State ───────────────────────────────────────────
  const [prismParams, setPrismParams] = useState<MonogramShaderParams>(
    DEFAULT_MONOGRAM_PARAMS,
  );
  const monogramStageRef = useRef<HTMLDivElement>(null);
  const monogramInstanceRef = useRef<GlassMonogram | null>(null);

  // ── Module 2: Fluted Glass State ───────────────────────────────────────
  const [flutedParams, setFlutedParams] = useState<FlutedGlassControls>(
    DEFAULT_FLUTED_CONTROLS,
  );
  const flutedStageRef = useRef<HTMLDivElement>(null);
  const flutedInstanceRef = useRef<{
    setParams: (p: Partial<FlutedGlassControls>) => void;
    dispose: () => void;
  } | null>(null);

  // Mount 3D Monogram
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only mount when tab changes
  useEffect(() => {
    if (activeTab !== "prism") return;
    const stage = monogramStageRef.current;
    if (!stage) return;

    let instance: GlassMonogram | null = null;
    try {
      instance = mountGlassMonogram(stage, {
        animate: true,
        drag: true,
        initialParams: prismParams,
      });
      if (instance) {
        instance.start();
        monogramInstanceRef.current = instance;
      }
    } catch {
      // WebGL fallback
    }

    return () => {
      instance?.dispose();
      monogramInstanceRef.current = null;
    };
  }, [activeTab]);

  // Update Monogram params in real-time
  const updatePrismParam = (key: keyof MonogramShaderParams, val: number) => {
    const next = { ...prismParams, [key]: val };
    setPrismParams(next);
    monogramInstanceRef.current?.setParams({ [key]: val });
  };

  const applyPrismPreset = (preset: Partial<MonogramShaderParams>) => {
    const next = { ...prismParams, ...preset };
    setPrismParams(next);
    monogramInstanceRef.current?.setParams(preset);
  };

  // Mount Fluted Glass with Swiss typographical canvas
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only mount when tab changes
  useEffect(() => {
    if (activeTab !== "fluted") return;
    const stage = flutedStageRef.current;
    if (!stage) return;

    // Draw typography texture onto an offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#08090D";
    ctx.fillRect(0, 0, 1024, 1024);

    // High contrast Swiss typography target
    ctx.fillStyle = "#1E2BFF";
    ctx.fillRect(80, 80, 864, 12);
    ctx.fillRect(80, 932, 864, 12);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 88px Archivo, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("WILLIAM ULSES", 512, 440);

    ctx.font = "300 42px Archivo, sans-serif";
    ctx.fillStyle = "#1E2BFF";
    ctx.fillText("[ CODE CRÉATIF // LAB OPTIQUE ]", 512, 540);

    ctx.font = "400 24px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("REFRACTION · DISPERSION · SHADERS", 512, 620);

    const img = new Image();
    img.onload = () => {
      const mountRes = mountInteractiveFlutedGlass(stage, img, flutedParams);
      if (mountRes) {
        flutedInstanceRef.current = mountRes;
      }
    };
    img.src = canvas.toDataURL("image/png");

    return () => {
      flutedInstanceRef.current?.dispose();
      flutedInstanceRef.current = null;
    };
  }, [activeTab]);

  // Update Fluted Glass params
  const updateFlutedParam = (key: keyof FlutedGlassControls, val: number) => {
    const next = { ...flutedParams, [key]: val };
    setFlutedParams(next);
    flutedInstanceRef.current?.setParams({ [key]: val });
  };

  const applyFlutedPreset = (preset: Partial<FlutedGlassControls>) => {
    const next = { ...flutedParams, ...preset };
    setFlutedParams(next);
    flutedInstanceRef.current?.setParams(preset);
  };

  const copyCurrentConfig = async () => {
    const payload =
      activeTab === "prism"
        ? {
            shader: "GlassMonogram_CRYSTAL_FRAGMENT",
            params: prismParams,
          }
        : {
            shader: "FlutedGlass_OWNER_GLASS",
            params: flutedParams,
          };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard fallback
    }
  };

  const statement = parseDisplay(t.statement).flat();

  return (
    <div className={styles.section}>
      {/* ── Section Header ─────────────────────────────────────────────── */}
      <header className={styles.head}>
        <span className={styles.label}>{t.title}</span>
        <span className={styles.count}>[ LAB · OPTICAL BENCH ]</span>
      </header>

      {/* ── Intro statement ────────────────────────────────────────────── */}
      <div className={styles.intro}>
        <h1 className={styles.statement}>
          {statement.map((seg) =>
            seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
          )}
        </h1>
        <p className={styles.lede}>{t.intro}</p>
      </div>

      {/* ── Swiss Hairline Tabs ────────────────────────────────────────── */}
      <nav className={styles.tabs} aria-label={t.title}>
        <button
          type="button"
          className={styles.tabButton}
          data-active={activeTab === "prism"}
          onClick={() => setActiveTab("prism")}
        >
          <span className={styles.tabIndex}>[ 01 ]</span>
          <span>{t.modulePrism}</span>
        </button>
        <button
          type="button"
          className={styles.tabButton}
          data-active={activeTab === "fluted"}
          onClick={() => setActiveTab("fluted")}
        >
          <span className={styles.tabIndex}>[ 02 ]</span>
          <span>{t.moduleFluted}</span>
        </button>
      </nav>

      {/* ── Workbench: Stage & Controls ────────────────────────────────── */}
      <div className={styles.workbenchGrid}>
        {/* Left: Viewport Stage */}
        <div className={styles.viewportContainer}>
          <div className={styles.viewportOverlay}>
            <span className={styles.viewportBadge}>
              {activeTab === "prism" ? "THREE.JS GLSL" : "PAPER SHADERS"}
            </span>
            <span>
              {activeTab === "prism"
                ? `IOR ${prismParams.ior.toFixed(2)}`
                : `${flutedParams.angle}° STRIPES`}
            </span>
          </div>

          {activeTab === "prism" ? (
            <div ref={monogramStageRef} className={styles.viewportStage} />
          ) : (
            <div ref={flutedStageRef} className={styles.viewportStage} />
          )}

          <div className={styles.viewportFooter}>
            <div className={styles.dragHint}>
              <span>↗</span>
              <span>{t.dragHint}</span>
            </div>
            {activeTab === "prism" ? (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => monogramInstanceRef.current?.resetRotation()}
              >
                {t.reset}
              </button>
            ) : null}
          </div>
        </div>

        {/* Right: Precision Control Rack */}
        <div className={styles.controlRack}>
          {activeTab === "prism" ? (
            <>
              {/* Presets */}
              <div className={styles.presetsBar}>
                <span className={styles.rackHeading}>PRESETS</span>
                <ul className={styles.presetList}>
                  <li>
                    <button
                      type="button"
                      className={styles.presetButton}
                      onClick={() =>
                        applyPrismPreset({
                          dispersion: 1.0,
                          ior: 1.52,
                          fresnel: 2.5,
                          streak: 1.0,
                        })
                      }
                    >
                      {t.presetDefault}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={styles.presetButton}
                      onClick={() =>
                        applyPrismPreset({
                          dispersion: 2.4,
                          ior: 2.42,
                          fresnel: 1.8,
                          streak: 1.8,
                        })
                      }
                    >
                      {t.presetDiamond}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={styles.presetButton}
                      onClick={() =>
                        applyPrismPreset({
                          dispersion: 0.2,
                          ior: 1.33,
                          fresnel: 4.0,
                          streak: 0.6,
                        })
                      }
                    >
                      {t.presetWater}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={styles.presetButton}
                      onClick={() =>
                        applyPrismPreset({
                          dispersion: 0.0,
                          ior: 1.5,
                          fresnel: 3.0,
                          streak: 1.0,
                        })
                      }
                    >
                      {t.presetAchromatic}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Sliders Stack */}
              <div className={styles.slidersStack}>
                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>
                      {t.dispersionLabel}
                    </span>
                    <span className={styles.sliderValue}>
                      {prismParams.dispersion.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.05"
                    value={prismParams.dispersion}
                    className={styles.rangeInput}
                    aria-label={t.dispersionLabel}
                    onChange={(e) =>
                      updatePrismParam("dispersion", Number(e.target.value))
                    }
                  />
                  <p className={styles.sliderHint}>{t.dispersionHint}</p>
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>{t.iorLabel}</span>
                    <span className={styles.sliderValue}>
                      {prismParams.ior.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.1"
                    max="2.6"
                    step="0.02"
                    value={prismParams.ior}
                    className={styles.rangeInput}
                    aria-label={t.iorLabel}
                    onChange={(e) =>
                      updatePrismParam("ior", Number(e.target.value))
                    }
                  />
                  <p className={styles.sliderHint}>{t.iorHint}</p>
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>{t.fresnelLabel}</span>
                    <span className={styles.sliderValue}>
                      {prismParams.fresnel.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={prismParams.fresnel}
                    className={styles.rangeInput}
                    aria-label={t.fresnelLabel}
                    onChange={(e) =>
                      updatePrismParam("fresnel", Number(e.target.value))
                    }
                  />
                  <p className={styles.sliderHint}>{t.fresnelHint}</p>
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>{t.glintsLabel}</span>
                    <span className={styles.sliderValue}>
                      {prismParams.streak.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.5"
                    step="0.1"
                    value={prismParams.streak}
                    className={styles.rangeInput}
                    aria-label={t.glintsLabel}
                    onChange={(e) =>
                      updatePrismParam("streak", Number(e.target.value))
                    }
                  />
                  <p className={styles.sliderHint}>{t.glintsHint}</p>
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>{t.speedLabel}</span>
                    <span className={styles.sliderValue}>
                      {prismParams.speed.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={prismParams.speed}
                    className={styles.rangeInput}
                    aria-label={t.speedLabel}
                    onChange={(e) =>
                      updatePrismParam("speed", Number(e.target.value))
                    }
                  />
                  <p className={styles.sliderHint}>{t.speedHint}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Presets Fluted */}
              <div className={styles.presetsBar}>
                <span className={styles.rackHeading}>PRESETS CANNELÉS</span>
                <ul className={styles.presetList}>
                  <li>
                    <button
                      type="button"
                      className={styles.presetButton}
                      onClick={() =>
                        applyFlutedPreset({
                          angle: 0,
                          size: 0.81,
                          distortion: 0.75,
                          blur: 0.25,
                        })
                      }
                    >
                      Cannelé Classique 0°
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={styles.presetButton}
                      onClick={() =>
                        applyFlutedPreset({
                          angle: 90,
                          size: 0.6,
                          distortion: 0.9,
                          blur: 0.2,
                        })
                      }
                    >
                      Stores Horizontaux 90°
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={styles.presetButton}
                      onClick={() =>
                        applyFlutedPreset({
                          angle: 45,
                          size: 1.2,
                          distortion: 1.2,
                          blur: 0.1,
                        })
                      }
                    >
                      Biais Prisme 45°
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={styles.presetButton}
                      onClick={() =>
                        applyFlutedPreset({
                          angle: 0,
                          size: 1.8,
                          distortion: 0.35,
                          blur: 0.8,
                        })
                      }
                    >
                      Verre Dépoli Dense
                    </button>
                  </li>
                </ul>
              </div>

              {/* Sliders Fluted */}
              <div className={styles.slidersStack}>
                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>
                      {t.flutedAngleLabel}
                    </span>
                    <span className={styles.sliderValue}>
                      {flutedParams.angle}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="1"
                    value={flutedParams.angle}
                    className={styles.rangeInput}
                    aria-label={t.flutedAngleLabel}
                    onChange={(e) =>
                      updateFlutedParam("angle", Number(e.target.value))
                    }
                  />
                  <p className={styles.sliderHint}>{t.flutedAngleHint}</p>
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>
                      {t.flutedSizeLabel}
                    </span>
                    <span className={styles.sliderValue}>
                      {flutedParams.size.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={flutedParams.size}
                    className={styles.rangeInput}
                    aria-label={t.flutedSizeLabel}
                    onChange={(e) =>
                      updateFlutedParam("size", Number(e.target.value))
                    }
                  />
                  <p className={styles.sliderHint}>{t.flutedSizeHint}</p>
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>
                      {t.flutedDistortionLabel}
                    </span>
                    <span className={styles.sliderValue}>
                      {flutedParams.distortion.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={flutedParams.distortion}
                    className={styles.rangeInput}
                    aria-label={t.flutedDistortionLabel}
                    onChange={(e) =>
                      updateFlutedParam("distortion", Number(e.target.value))
                    }
                  />
                  <p className={styles.sliderHint}>{t.flutedDistortionHint}</p>
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderLabel}>
                      {t.flutedBlurLabel}
                    </span>
                    <span className={styles.sliderValue}>
                      {flutedParams.blur.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={flutedParams.blur}
                    className={styles.rangeInput}
                    aria-label={t.flutedBlurLabel}
                    onChange={(e) =>
                      updateFlutedParam("blur", Number(e.target.value))
                    }
                  />
                  <p className={styles.sliderHint}>{t.flutedBlurHint}</p>
                </div>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className={styles.actionsBar}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={copyCurrentConfig}
            >
              {copied ? t.copied : t.copyParams}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
