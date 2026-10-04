"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/admin/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/admin/ui/native-select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/admin/ui/tabs";
import { Textarea } from "@/components/admin/ui/textarea";
import { AA_TEXT, bestTextOn, INK, PAPER } from "@/lib/color";
import { COVER_MIN_WIDTH } from "@/media/constants";
import { updateProject } from "@/server/actions/projects";
import type { MediaOption } from "@/server/admin/media";
import { describedBy, FieldError } from "./FieldError";
import { MediaPicker } from "./MediaPicker";

type TranslationValues = {
  title: string;
  subtitle: string;
  role: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
};

type Props = {
  initial: {
    id: string;
    slug: string;
    year: number;
    client: string;
    categoryId: string;
    tagIds: string[];
    accentColor: string;
    externalUrl: string;
    featured: boolean;
    coverMediaId: string;
    previewMediaId: string;
    ogMediaId: string;
    fr: TranslationValues;
    en: TranslationValues;
    hasEn: boolean;
  };
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  media: MediaOption[];
};

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function ProjectEditForm({ initial, categories, tags, media }: Props) {
  const [state, action, pending] = useActionState(updateProject, null);
  const [accent, setAccent] = useState(initial.accentColor);
  const contrast = HEX.test(accent) ? bestTextOn(accent) : null;

  // Toast notification on submission result
  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Projet enregistré");
    else toast.error(state.message);
  }, [state]);

  // Text input with label, description hint, and validation error
  const field = (
    name: string,
    label: string,
    defaultValue: string,
    options: { multiline?: boolean; hint?: string; lang?: string } = {},
  ) => (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>
        {label}
        {options.hint && (
          <span className="font-normal text-muted-foreground">
            {" "}
            — {options.hint}
          </span>
        )}
      </Label>
      {options.multiline ? (
        <Textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={3}
          lang={options.lang}
          aria-describedby={describedBy(state, name)}
        />
      ) : (
        <Input
          id={name}
          name={name}
          defaultValue={defaultValue}
          lang={options.lang}
          aria-describedby={describedBy(state, name)}
        />
      )}
      <FieldError state={state} name={name} />
    </div>
  );

  const select = (
    name: string,
    label: string,
    value: string,
    options: { id: string; label: string }[],
    hint?: string,
  ) => (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>
        {label}
        {hint && (
          <span className="font-normal text-muted-foreground"> — {hint}</span>
        )}
      </Label>
      <NativeSelect
        id={name}
        name={name}
        defaultValue={value}
        className="w-full"
      >
        <NativeSelectOption value="">— Aucune —</NativeSelectOption>
        {options.map((o) => (
          <NativeSelectOption key={o.id} value={o.id}>
            {o.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <FieldError state={state} name={name} />
    </div>
  );

  const translationFields = (locale: "fr" | "en", v: TranslationValues) => {
    const fr = locale === "fr";
    return (
      <div lang={locale} className="grid gap-4">
        {!fr && !initial.hasEn && (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Pas encore de traduction anglaise : elle sera créée dès qu'un titre
            est saisi.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {field(`${locale}.title`, fr ? "Titre" : "Title", v.title, {
            lang: locale,
          })}
          {field(
            `${locale}.subtitle`,
            fr ? "Sous-titre" : "Subtitle",
            v.subtitle,
            { lang: locale },
          )}
        </div>
        {field(`${locale}.role`, fr ? "Rôle" : "Role", v.role, {
          hint: fr ? "ex. Direction artistique" : "e.g. Art direction",
          lang: locale,
        })}
        {field(`${locale}.summary`, fr ? "Résumé" : "Summary", v.summary, {
          multiline: true,
          lang: locale,
        })}
        <div className="grid gap-4 md:grid-cols-2">
          {field(`${locale}.seoTitle`, "SEO — title", v.seoTitle, {
            hint: "70 car. max",
            lang: locale,
          })}
          {field(
            `${locale}.seoDescription`,
            "SEO — description",
            v.seoDescription,
            {
              multiline: true,
              hint: "160 car. max",
              lang: locale,
            },
          )}
        </div>
      </div>
    );
  };

  return (
    <form
      // Manual submit handler prevents form reset on validation failure
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      className="grid gap-6"
    >
      <input type="hidden" name="id" value={initial.id} />

      <Card>
        <CardHeader>
          <CardTitle>Textes</CardTitle>
          <CardDescription>
            Les deux langues sont enregistrées ensemble.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fr">
            <TabsList>
              <TabsTrigger value="fr">Français</TabsTrigger>
              <TabsTrigger value="en">
                English{!initial.hasEn && " (à créer)"}
              </TabsTrigger>
            </TabsList>
            {/* forceMount: inactive tab remains in DOM (hidden) so its inputs are included in form submission */}
            <TabsContent
              value="fr"
              forceMount
              className="mt-4 data-[state=inactive]:hidden"
            >
              {translationFields("fr", initial.fr)}
            </TabsContent>
            <TabsContent
              value="en"
              forceMount
              className="mt-4 data-[state=inactive]:hidden"
            >
              {translationFields("en", initial.en)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            {field("slug", "Slug", initial.slug, {
              hint: "URL, identique en FR et EN",
            })}
            <div className="grid gap-1.5">
              <Label htmlFor="year">Année</Label>
              <Input
                id="year"
                name="year"
                type="number"
                inputMode="numeric"
                defaultValue={initial.year}
                aria-describedby={describedBy(state, "year")}
              />
              <FieldError state={state} name="year" />
            </div>
            {field("client", "Client", initial.client)}
          </div>
          <p className="text-xs text-muted-foreground">
            Changer le slug crée automatiquement une redirection depuis
            l'ancien.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {select(
              "categoryId",
              "Catégorie",
              initial.categoryId,
              categories.map((c) => ({ id: c.id, label: c.name })),
            )}
            {field("externalUrl", "Lien externe", initial.externalUrl, {
              hint: "https://, facultatif",
            })}
          </div>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Tags</legend>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1 text-sm has-checked:border-ring has-checked:bg-accent"
                >
                  <input
                    type="checkbox"
                    name="tagIds"
                    value={t.id}
                    defaultChecked={initial.tagIds.includes(t.id)}
                    className="accent-(--color-signal)"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-1.5">
            <Label htmlFor="accentColor">Couleur d'accent</Label>
            <div className="flex items-center gap-2">
              <Input
                id="accentColor"
                name="accentColor"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                aria-describedby="accent-contrast"
                className="w-32 font-mono"
              />
              <input
                type="color"
                aria-label="Choisir la couleur d'accent"
                value={HEX.test(accent) ? accent : "#000000"}
                onChange={(e) => setAccent(e.target.value.toUpperCase())}
                className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent"
              />
              <span
                aria-hidden
                className="rounded px-2 py-1 text-xs"
                style={{
                  background: HEX.test(accent) ? accent : undefined,
                  color: contrast?.text === "paper" ? PAPER : INK,
                }}
              >
                Aperçu
              </span>
            </div>
            <p
              id="accent-contrast"
              aria-live="polite"
              className={`text-xs ${contrast !== null && contrast.ratio < AA_TEXT ? "text-destructive" : "text-muted-foreground"}`}
            >
              {contrast === null
                ? "Format attendu : #RRGGBB"
                : `Texte encre : ${contrast.ink.toFixed(2)}:1 · texte papier : ${contrast.paper.toFixed(2)}:1 — ${
                    contrast.ratio >= AA_TEXT
                      ? `lisible avec le texte ${contrast.text === "ink" ? "encre" : "papier"} (AA ✓)`
                      : "insuffisant avec les deux (AA exige 4,5:1)"
                  }`}
            </p>
            <FieldError state={state} name="accentColor" />
          </div>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={initial.featured}
              className="accent-(--color-signal)"
            />
            Mis en avant sur l'accueil
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Médias du projet</CardTitle>
          <CardDescription>
            Choisis dans la médiathèque ou envoie un nouveau fichier.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <MediaPicker
            name="coverMediaId"
            label="Cover"
            hint={`≥ ${COVER_MIN_WIDTH} px, obligatoire pour publier`}
            media={media}
            kinds={["image", "svg"]}
            minWidth={COVER_MIN_WIDTH}
            value={initial.coverMediaId ? [initial.coverMediaId] : []}
          />
          <MediaPicker
            name="previewMediaId"
            label="Vidéo de survol"
            hint="facultatif"
            media={media}
            kinds={["video"]}
            value={initial.previewMediaId ? [initial.previewMediaId] : []}
          />
          <MediaPicker
            name="ogMediaId"
            label="Image de partage"
            hint="facultatif"
            media={media}
            kinds={["image"]}
            value={initial.ogMediaId ? [initial.ogMediaId] : []}
          />
          <div className="md:col-span-3">
            <FieldError state={state} name="coverMediaId" />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-6 flex items-center gap-3 border-t border-border bg-background/95 px-6 py-3 backdrop-blur">
        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Enregistrement…" : "Enregistrer le projet"}
        </Button>
        <span aria-live="polite" className="text-sm">
          {state?.ok && <span className="text-success">Enregistré ✓</span>}
          {state && !state.ok && (
            <span role="alert" className="text-destructive">
              {state.message}
            </span>
          )}
        </span>
      </div>
    </form>
  );
}
